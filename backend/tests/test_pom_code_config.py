"""
Test suite for POM (Points of Measurement) Library and Code Configuration features.
Tests CRUD operations for POM and Code Config endpoints.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Get authentication token for tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testfix@example.com",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        return data["token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Return headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }


class TestPOMLibrary(TestAuth):
    """Test POM (Points of Measurement) Library CRUD operations"""
    
    created_pom_ids = []
    
    def test_get_pom_list(self, auth_headers):
        """Test GET /api/pom - List all POMs"""
        response = requests.get(f"{BASE_URL}/api/pom", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} existing POMs")
    
    def test_create_pom_basic(self, auth_headers):
        """Test POST /api/pom - Create a basic POM"""
        pom_data = {
            "name": "TEST Chest Width",
            "code": "TEST-CHEST",
            "description": "Measure across the chest at the widest point",
            "category": "tops",
            "unit": "cm",
            "sort_order": 1
        }
        response = requests.post(f"{BASE_URL}/api/pom", json=pom_data, headers=auth_headers)
        assert response.status_code == 200, f"Create POM failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["name"] == pom_data["name"]
        assert data["code"] == pom_data["code"]
        assert data["category"] == pom_data["category"]
        assert data["unit"] == pom_data["unit"]
        
        self.__class__.created_pom_ids.append(data["id"])
        print(f"Created POM: {data['code']} - {data['name']}")
    
    def test_create_pom_different_categories(self, auth_headers):
        """Test creating POMs with different categories"""
        categories = [
            {"name": "TEST Waist", "code": "TEST-WAIST", "category": "bottoms", "unit": "cm"},
            {"name": "TEST Sleeve Length", "code": "TEST-SLEEVE", "category": "tops", "unit": "in"},
            {"name": "TEST Foot Length", "code": "TEST-FOOT", "category": "footwear", "unit": "mm"},
        ]
        
        for pom_data in categories:
            response = requests.post(f"{BASE_URL}/api/pom", json=pom_data, headers=auth_headers)
            assert response.status_code == 200, f"Create POM failed for {pom_data['code']}: {response.text}"
            data = response.json()
            assert data["category"] == pom_data["category"]
            assert data["unit"] == pom_data["unit"]
            self.__class__.created_pom_ids.append(data["id"])
            print(f"Created POM: {data['code']} ({data['category']}, {data['unit']})")
    
    def test_get_pom_list_after_create(self, auth_headers):
        """Verify POMs were created by fetching list"""
        response = requests.get(f"{BASE_URL}/api/pom", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check our test POMs exist
        test_codes = ["TEST-CHEST", "TEST-WAIST", "TEST-SLEEVE", "TEST-FOOT"]
        found_codes = [p["code"] for p in data if p["code"].startswith("TEST-")]
        
        for code in test_codes:
            assert code in found_codes, f"POM {code} not found in list"
        print(f"Verified {len(test_codes)} test POMs exist")
    
    def test_update_pom(self, auth_headers):
        """Test PUT /api/pom/{pom_id} - Update a POM"""
        if not self.__class__.created_pom_ids:
            pytest.skip("No POMs created to update")
        
        pom_id = self.__class__.created_pom_ids[0]
        update_data = {
            "name": "TEST Chest Width Updated",
            "code": "TEST-CHEST",
            "description": "Updated description for chest measurement",
            "category": "tops",
            "unit": "in",  # Changed from cm to in
            "sort_order": 10
        }
        
        response = requests.put(f"{BASE_URL}/api/pom/{pom_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200, f"Update POM failed: {response.text}"
        
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["unit"] == "in"
        assert data["sort_order"] == 10
        print(f"Updated POM: {data['code']} - unit changed to {data['unit']}")
    
    def test_delete_pom(self, auth_headers):
        """Test DELETE /api/pom/{pom_id} - Delete a POM"""
        if not self.__class__.created_pom_ids:
            pytest.skip("No POMs created to delete")
        
        # Delete all test POMs
        for pom_id in self.__class__.created_pom_ids:
            response = requests.delete(f"{BASE_URL}/api/pom/{pom_id}", headers=auth_headers)
            assert response.status_code == 200, f"Delete POM failed: {response.text}"
            data = response.json()
            assert data.get("status") == "deleted"
        
        print(f"Deleted {len(self.__class__.created_pom_ids)} test POMs")
        self.__class__.created_pom_ids.clear()
    
    def test_verify_pom_deleted(self, auth_headers):
        """Verify POMs were deleted"""
        response = requests.get(f"{BASE_URL}/api/pom", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        test_codes = [p["code"] for p in data if p["code"].startswith("TEST-")]
        assert len(test_codes) == 0, f"Test POMs still exist: {test_codes}"
        print("Verified all test POMs deleted")


class TestCodeConfiguration(TestAuth):
    """Test Code Configuration CRUD operations"""
    
    def test_get_all_code_configs(self, auth_headers):
        """Test GET /api/code-config - List all code configs"""
        response = requests.get(f"{BASE_URL}/api/code-config", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} existing code configs")
    
    def test_get_code_config_asset(self, auth_headers):
        """Test GET /api/code-config/asset - Get asset code config"""
        response = requests.get(f"{BASE_URL}/api/code-config/asset", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should have default or configured values
        assert "entity_type" in data
        assert data["entity_type"] == "asset"
        assert "prefix" in data
        assert "separator" in data
        assert "sequence_digits" in data
        print(f"Asset config: prefix={data.get('prefix')}, separator={data.get('separator')}")
    
    def test_get_code_config_product(self, auth_headers):
        """Test GET /api/code-config/product - Get product code config"""
        response = requests.get(f"{BASE_URL}/api/code-config/product", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["entity_type"] == "product"
        print(f"Product config: prefix={data.get('prefix')}")
    
    def test_get_code_config_material(self, auth_headers):
        """Test GET /api/code-config/material - Get material code config"""
        response = requests.get(f"{BASE_URL}/api/code-config/material", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["entity_type"] == "material"
        print(f"Material config: prefix={data.get('prefix')}")
    
    def test_get_code_config_color(self, auth_headers):
        """Test GET /api/code-config/color - Get color code config"""
        response = requests.get(f"{BASE_URL}/api/code-config/color", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["entity_type"] == "color"
        print(f"Color config: prefix={data.get('prefix')}")
    
    def test_create_update_code_config(self, auth_headers):
        """Test POST /api/code-config - Create/Update code config"""
        config_data = {
            "entity_type": "asset",
            "prefix": "AST",
            "separator": "-",
            "include_date": True,
            "date_format": "YYMMDD",
            "sequence_digits": 4,
            "sequence_start": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/code-config", json=config_data, headers=auth_headers)
        assert response.status_code == 200, f"Create/Update config failed: {response.text}"
        
        data = response.json()
        assert data["entity_type"] == "asset"
        assert data["prefix"] == "AST"
        assert data["separator"] == "-"
        assert data["include_date"] == True
        assert data["date_format"] == "YYMMDD"
        assert data["sequence_digits"] == 4
        print(f"Created/Updated asset config: {data['prefix']}{data['separator']}YYMMDD{data['separator']}0001")
    
    def test_update_code_config_different_settings(self, auth_headers):
        """Test updating code config with different settings"""
        config_data = {
            "entity_type": "product",
            "prefix": "PRD",
            "separator": "_",
            "include_date": False,
            "date_format": "YYMMDD",
            "sequence_digits": 5,
            "sequence_start": 100
        }
        
        response = requests.post(f"{BASE_URL}/api/code-config", json=config_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["prefix"] == "PRD"
        assert data["separator"] == "_"
        assert data["include_date"] == False
        assert data["sequence_digits"] == 5
        print(f"Updated product config: {data['prefix']}{data['separator']}00100")
    
    def test_generate_code_asset(self, auth_headers):
        """Test POST /api/code-config/asset/generate - Generate asset code"""
        response = requests.post(f"{BASE_URL}/api/code-config/asset/generate", headers=auth_headers)
        assert response.status_code == 200, f"Generate code failed: {response.text}"
        
        data = response.json()
        assert "code" in data
        assert len(data["code"]) > 0
        print(f"Generated asset code: {data['code']}")
    
    def test_generate_code_product(self, auth_headers):
        """Test POST /api/code-config/product/generate - Generate product code"""
        response = requests.post(f"{BASE_URL}/api/code-config/product/generate", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "code" in data
        print(f"Generated product code: {data['code']}")
    
    def test_generate_code_increments_sequence(self, auth_headers):
        """Test that generating codes increments the sequence"""
        # Get current config
        response1 = requests.get(f"{BASE_URL}/api/code-config/material", headers=auth_headers)
        initial_seq = response1.json().get("current_sequence", 1)
        
        # Generate a code
        response2 = requests.post(f"{BASE_URL}/api/code-config/material/generate", headers=auth_headers)
        assert response2.status_code == 200
        code1 = response2.json()["code"]
        
        # Generate another code
        response3 = requests.post(f"{BASE_URL}/api/code-config/material/generate", headers=auth_headers)
        assert response3.status_code == 200
        code2 = response3.json()["code"]
        
        # Codes should be different (sequence incremented)
        assert code1 != code2, f"Codes should be different: {code1} vs {code2}"
        print(f"Generated sequential codes: {code1}, {code2}")
    
    def test_code_config_with_date_format(self, auth_headers):
        """Test code generation with different date formats"""
        # Configure with date
        config_data = {
            "entity_type": "color",
            "prefix": "CLR",
            "separator": "-",
            "include_date": True,
            "date_format": "YYMM",
            "sequence_digits": 3,
            "sequence_start": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/code-config", json=config_data, headers=auth_headers)
        assert response.status_code == 200
        
        # Generate code
        response2 = requests.post(f"{BASE_URL}/api/code-config/color/generate", headers=auth_headers)
        assert response2.status_code == 200
        
        code = response2.json()["code"]
        assert code.startswith("CLR-")
        # Should have format like CLR-2601-001
        parts = code.split("-")
        assert len(parts) >= 2
        print(f"Generated color code with date: {code}")


class TestPOMIntegration(TestAuth):
    """Test POM integration with Measurement Chart"""
    
    created_ids = {"pom": [], "size": [], "asset": None}
    
    def test_create_pom_for_integration(self, auth_headers):
        """Create POMs for integration testing"""
        poms = [
            {"name": "INT Chest", "code": "INT-CHEST", "category": "tops", "unit": "cm"},
            {"name": "INT Waist", "code": "INT-WAIST", "category": "bottoms", "unit": "cm"},
        ]
        
        for pom_data in poms:
            response = requests.post(f"{BASE_URL}/api/pom", json=pom_data, headers=auth_headers)
            assert response.status_code == 200
            self.__class__.created_ids["pom"].append(response.json()["id"])
        
        print(f"Created {len(poms)} POMs for integration test")
    
    def test_create_size_for_integration(self, auth_headers):
        """Create sizes for integration testing"""
        sizes = [
            {"name": "INT Small", "code": "INT-S", "category": "general"},
            {"name": "INT Medium", "code": "INT-M", "category": "general"},
        ]
        
        for size_data in sizes:
            response = requests.post(f"{BASE_URL}/api/sizes", json=size_data, headers=auth_headers)
            assert response.status_code == 200
            self.__class__.created_ids["size"].append(response.json()["id"])
        
        print(f"Created {len(sizes)} sizes for integration test")
    
    def test_create_asset_with_measurements(self, auth_headers):
        """Create asset with measurements using POM codes"""
        asset_data = {
            "code": "INT-ASSET-001",
            "name": "Integration Test Asset",
            "description": "Asset for POM integration testing",
            "measurements": [
                {
                    "id": "meas-1",
                    "size_id": self.__class__.created_ids["size"][0] if self.__class__.created_ids["size"] else "test-size",
                    "size_name": "INT Small",
                    "size_code": "INT-S",
                    "measurements": {
                        "INT-CHEST": 90,
                        "INT-WAIST": 70
                    }
                },
                {
                    "id": "meas-2",
                    "size_id": self.__class__.created_ids["size"][1] if len(self.__class__.created_ids["size"]) > 1 else "test-size-2",
                    "size_name": "INT Medium",
                    "size_code": "INT-M",
                    "measurements": {
                        "INT-CHEST": 95,
                        "INT-WAIST": 75
                    }
                }
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers=auth_headers)
        assert response.status_code == 200, f"Create asset failed: {response.text}"
        
        data = response.json()
        assert len(data["measurements"]) == 2
        assert data["measurements"][0]["measurements"]["INT-CHEST"] == 90
        
        self.__class__.created_ids["asset"] = data["id"]
        print(f"Created asset with measurements: {data['code']}")
    
    def test_verify_asset_measurements_persisted(self, auth_headers):
        """Verify measurements were persisted correctly"""
        if not self.__class__.created_ids["asset"]:
            pytest.skip("No asset created")
        
        response = requests.get(f"{BASE_URL}/api/assets/{self.__class__.created_ids['asset']}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["measurements"]) == 2
        
        # Verify measurement values
        small_meas = next((m for m in data["measurements"] if m["size_code"] == "INT-S"), None)
        assert small_meas is not None
        assert small_meas["measurements"]["INT-CHEST"] == 90
        assert small_meas["measurements"]["INT-WAIST"] == 70
        
        print("Verified measurements persisted correctly")
    
    def test_cleanup_integration_data(self, auth_headers):
        """Clean up integration test data"""
        # Delete asset
        if self.__class__.created_ids["asset"]:
            requests.delete(f"{BASE_URL}/api/assets/{self.__class__.created_ids['asset']}", headers=auth_headers)
        
        # Delete sizes
        for size_id in self.__class__.created_ids["size"]:
            requests.delete(f"{BASE_URL}/api/sizes/{size_id}", headers=auth_headers)
        
        # Delete POMs
        for pom_id in self.__class__.created_ids["pom"]:
            requests.delete(f"{BASE_URL}/api/pom/{pom_id}", headers=auth_headers)
        
        print("Cleaned up integration test data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
