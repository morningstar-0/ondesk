"""
Backend API Tests for BOM (Bill of Materials) and Measurement Chart Features
Tests: BOM items in Assets/Products, Measurement items in Assets/Products, Materials library for BOM
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://inventoai-1.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "testfix@example.com"
TEST_PASSWORD = "test123"


class TestMaterialsLibraryForBOM:
    """Materials library tests - required for BOM functionality"""
    
    def test_get_materials_list(self, auth_token):
        """Test GET /api/materials returns list"""
        response = requests.get(f"{BASE_URL}/api/materials", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Materials list returned {len(data)} items")
    
    def test_create_material_with_unit_price(self, auth_token):
        """Test creating material with unit_price for BOM cost calculation"""
        material_data = {
            "code": f"TEST-BOM-MAT-{uuid.uuid4().hex[:6].upper()}",
            "name": "Cotton Fabric for BOM Test",
            "description": "Test material for BOM",
            "material_type": "fabric",
            "composition": "100% Cotton",
            "unit": "meter",
            "unit_price": 15.50,
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/api/materials", json=material_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["code"] == material_data["code"]
        assert data["name"] == material_data["name"]
        assert data["unit_price"] == 15.50
        assert data["unit"] == "meter"
        print(f"SUCCESS: Material created with id={data['id']}, unit_price={data['unit_price']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/materials/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        return data["id"]


class TestSizesLibraryForMeasurements:
    """Sizes library tests - required for Measurement Chart functionality"""
    
    def test_get_sizes_list(self, auth_token):
        """Test GET /api/sizes returns list"""
        response = requests.get(f"{BASE_URL}/api/sizes", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Sizes list returned {len(data)} items")
    
    def test_create_size_for_measurements(self, auth_token):
        """Test creating size for measurement chart"""
        size_data = {
            "name": "Medium",
            "code": f"M-{uuid.uuid4().hex[:4].upper()}",
            "category": "apparel",
            "sort_order": 2
        }
        response = requests.post(f"{BASE_URL}/api/sizes", json=size_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == size_data["name"]
        assert data["code"] == size_data["code"]
        print(f"SUCCESS: Size created with id={data['id']}, name={data['name']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sizes/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestAssetBOM:
    """Asset BOM (Bill of Materials) tests"""
    
    def test_create_asset_with_bom(self, auth_token, test_material):
        """Test creating asset with BOM items"""
        bom_item = {
            "id": f"bom-{uuid.uuid4().hex[:8]}",
            "material_id": test_material["id"],
            "material_code": test_material["code"],
            "material_name": test_material["name"],
            "quantity": 2.5,
            "unit": "meter",
            "unit_cost": test_material["unit_price"],
            "total_cost": test_material["unit_price"] * 2.5,
            "notes": "Main fabric"
        }
        
        asset_data = {
            "code": f"TEST-AST-BOM-{uuid.uuid4().hex[:6].upper()}",
            "name": "Asset with BOM",
            "description": "Test asset with bill of materials",
            "status": "draft",
            "bom": [bom_item]
        }
        
        response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "bom" in data
        assert len(data["bom"]) == 1
        assert data["bom"][0]["material_id"] == test_material["id"]
        assert data["bom"][0]["quantity"] == 2.5
        assert data["bom"][0]["total_cost"] == test_material["unit_price"] * 2.5
        print(f"SUCCESS: Asset created with BOM, total_cost={data['bom'][0]['total_cost']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_update_asset_bom(self, auth_token, test_material):
        """Test updating asset BOM"""
        # Create asset first
        asset_data = {
            "code": f"TEST-AST-BOM-UPD-{uuid.uuid4().hex[:6].upper()}",
            "name": "Asset for BOM Update",
            "status": "draft",
            "bom": []
        }
        create_response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert create_response.status_code == 200
        asset = create_response.json()
        asset_id = asset["id"]
        
        # Update with BOM
        bom_item = {
            "id": f"bom-{uuid.uuid4().hex[:8]}",
            "material_id": test_material["id"],
            "material_code": test_material["code"],
            "material_name": test_material["name"],
            "quantity": 5.0,
            "unit": "meter",
            "unit_cost": test_material["unit_price"],
            "total_cost": test_material["unit_price"] * 5.0,
            "notes": "Updated BOM"
        }
        
        update_data = {
            "code": asset["code"],
            "name": asset["name"],
            "status": "draft",
            "bom": [bom_item]
        }
        
        update_response = requests.put(f"{BASE_URL}/api/assets/{asset_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert update_response.status_code == 200
        updated = update_response.json()
        assert len(updated["bom"]) == 1
        assert updated["bom"][0]["quantity"] == 5.0
        print(f"SUCCESS: Asset BOM updated, quantity={updated['bom'][0]['quantity']}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/assets/{asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert len(fetched["bom"]) == 1
        assert fetched["bom"][0]["quantity"] == 5.0
        print("SUCCESS: BOM data persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestAssetMeasurements:
    """Asset Measurement Chart tests"""
    
    def test_create_asset_with_measurements(self, auth_token, test_size):
        """Test creating asset with measurement chart"""
        measurement_item = {
            "id": f"meas-{uuid.uuid4().hex[:8]}",
            "size_id": test_size["id"],
            "size_name": test_size["name"],
            "size_code": test_size["code"],
            "measurements": {
                "Chest": 100.0,
                "Waist": 85.0,
                "Length": 72.0
            }
        }
        
        asset_data = {
            "code": f"TEST-AST-MEAS-{uuid.uuid4().hex[:6].upper()}",
            "name": "Asset with Measurements",
            "description": "Test asset with measurement chart",
            "status": "draft",
            "measurements": [measurement_item]
        }
        
        response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "measurements" in data
        assert len(data["measurements"]) == 1
        assert data["measurements"][0]["size_id"] == test_size["id"]
        assert data["measurements"][0]["measurements"]["Chest"] == 100.0
        assert data["measurements"][0]["measurements"]["Waist"] == 85.0
        print(f"SUCCESS: Asset created with measurements, Chest={data['measurements'][0]['measurements']['Chest']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_update_asset_measurements(self, auth_token, test_size):
        """Test updating asset measurements"""
        # Create asset first
        asset_data = {
            "code": f"TEST-AST-MEAS-UPD-{uuid.uuid4().hex[:6].upper()}",
            "name": "Asset for Measurement Update",
            "status": "draft",
            "measurements": []
        }
        create_response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert create_response.status_code == 200
        asset = create_response.json()
        asset_id = asset["id"]
        
        # Update with measurements
        measurement_item = {
            "id": f"meas-{uuid.uuid4().hex[:8]}",
            "size_id": test_size["id"],
            "size_name": test_size["name"],
            "size_code": test_size["code"],
            "measurements": {
                "Chest": 105.0,
                "Waist": 90.0,
                "Hip": 100.0,
                "Length": 75.0
            }
        }
        
        update_data = {
            "code": asset["code"],
            "name": asset["name"],
            "status": "draft",
            "measurements": [measurement_item]
        }
        
        update_response = requests.put(f"{BASE_URL}/api/assets/{asset_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert update_response.status_code == 200
        updated = update_response.json()
        assert len(updated["measurements"]) == 1
        assert updated["measurements"][0]["measurements"]["Chest"] == 105.0
        print(f"SUCCESS: Asset measurements updated")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/assets/{asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert len(fetched["measurements"]) == 1
        assert fetched["measurements"][0]["measurements"]["Chest"] == 105.0
        print("SUCCESS: Measurement data persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestProductBOM:
    """Product BOM (Bill of Materials) tests"""
    
    def test_create_product_with_bom(self, auth_token, test_material):
        """Test creating product with BOM items"""
        bom_item = {
            "id": f"bom-{uuid.uuid4().hex[:8]}",
            "material_id": test_material["id"],
            "material_code": test_material["code"],
            "material_name": test_material["name"],
            "quantity": 3.0,
            "unit": "meter",
            "unit_cost": test_material["unit_price"],
            "total_cost": test_material["unit_price"] * 3.0,
            "notes": "Main fabric for product"
        }
        
        product_data = {
            "code": f"TEST-PRD-BOM-{uuid.uuid4().hex[:6].upper()}",
            "name": "Product with BOM",
            "description": "Test product with bill of materials",
            "lifecycle_stage": "concept",
            "status": "draft",
            "bom": [bom_item]
        }
        
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "bom" in data
        assert len(data["bom"]) == 1
        assert data["bom"][0]["material_id"] == test_material["id"]
        assert data["bom"][0]["quantity"] == 3.0
        print(f"SUCCESS: Product created with BOM, total_cost={data['bom'][0]['total_cost']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_update_product_bom(self, auth_token, test_material):
        """Test updating product BOM"""
        # Create product first
        product_data = {
            "code": f"TEST-PRD-BOM-UPD-{uuid.uuid4().hex[:6].upper()}",
            "name": "Product for BOM Update",
            "lifecycle_stage": "concept",
            "status": "draft",
            "bom": []
        }
        create_response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert create_response.status_code == 200
        product = create_response.json()
        product_id = product["id"]
        
        # Update with BOM
        bom_item = {
            "id": f"bom-{uuid.uuid4().hex[:8]}",
            "material_id": test_material["id"],
            "material_code": test_material["code"],
            "material_name": test_material["name"],
            "quantity": 10.0,
            "unit": "meter",
            "unit_cost": test_material["unit_price"],
            "total_cost": test_material["unit_price"] * 10.0,
            "notes": "Updated BOM for product"
        }
        
        update_data = {
            "code": product["code"],
            "name": product["name"],
            "lifecycle_stage": "development",
            "status": "draft",
            "bom": [bom_item]
        }
        
        update_response = requests.put(f"{BASE_URL}/api/products/{product_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert update_response.status_code == 200
        updated = update_response.json()
        assert len(updated["bom"]) == 1
        assert updated["bom"][0]["quantity"] == 10.0
        print(f"SUCCESS: Product BOM updated, quantity={updated['bom'][0]['quantity']}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert len(fetched["bom"]) == 1
        assert fetched["bom"][0]["quantity"] == 10.0
        print("SUCCESS: Product BOM data persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestProductMeasurements:
    """Product Measurement Chart tests"""
    
    def test_create_product_with_measurements(self, auth_token, test_size):
        """Test creating product with measurement chart"""
        measurement_item = {
            "id": f"meas-{uuid.uuid4().hex[:8]}",
            "size_id": test_size["id"],
            "size_name": test_size["name"],
            "size_code": test_size["code"],
            "measurements": {
                "Chest": 102.0,
                "Waist": 88.0,
                "Hip": 98.0,
                "Length": 74.0,
                "Shoulder": 45.0
            }
        }
        
        product_data = {
            "code": f"TEST-PRD-MEAS-{uuid.uuid4().hex[:6].upper()}",
            "name": "Product with Measurements",
            "description": "Test product with measurement chart",
            "lifecycle_stage": "concept",
            "status": "draft",
            "measurements": [measurement_item]
        }
        
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "measurements" in data
        assert len(data["measurements"]) == 1
        assert data["measurements"][0]["size_id"] == test_size["id"]
        assert data["measurements"][0]["measurements"]["Chest"] == 102.0
        assert data["measurements"][0]["measurements"]["Shoulder"] == 45.0
        print(f"SUCCESS: Product created with measurements")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
    
    def test_update_product_measurements(self, auth_token, test_size):
        """Test updating product measurements"""
        # Create product first
        product_data = {
            "code": f"TEST-PRD-MEAS-UPD-{uuid.uuid4().hex[:6].upper()}",
            "name": "Product for Measurement Update",
            "lifecycle_stage": "concept",
            "status": "draft",
            "measurements": []
        }
        create_response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert create_response.status_code == 200
        product = create_response.json()
        product_id = product["id"]
        
        # Update with measurements
        measurement_item = {
            "id": f"meas-{uuid.uuid4().hex[:8]}",
            "size_id": test_size["id"],
            "size_name": test_size["name"],
            "size_code": test_size["code"],
            "measurements": {
                "Chest": 110.0,
                "Waist": 95.0,
                "Hip": 105.0,
                "Length": 78.0,
                "Sleeve": 65.0
            }
        }
        
        update_data = {
            "code": product["code"],
            "name": product["name"],
            "lifecycle_stage": "development",
            "status": "draft",
            "measurements": [measurement_item]
        }
        
        update_response = requests.put(f"{BASE_URL}/api/products/{product_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert update_response.status_code == 200
        updated = update_response.json()
        assert len(updated["measurements"]) == 1
        assert updated["measurements"][0]["measurements"]["Chest"] == 110.0
        print(f"SUCCESS: Product measurements updated")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert len(fetched["measurements"]) == 1
        assert fetched["measurements"][0]["measurements"]["Chest"] == 110.0
        print("SUCCESS: Product measurement data persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestAssetToProductConversionWithBOMAndMeasurements:
    """Test that BOM and Measurements are preserved when converting Asset to Product"""
    
    def test_convert_asset_preserves_bom_and_measurements(self, auth_token, test_material, test_size):
        """Test that converting asset to product preserves BOM and measurements"""
        # Create asset with BOM and measurements
        bom_item = {
            "id": f"bom-{uuid.uuid4().hex[:8]}",
            "material_id": test_material["id"],
            "material_code": test_material["code"],
            "material_name": test_material["name"],
            "quantity": 4.0,
            "unit": "meter",
            "unit_cost": test_material["unit_price"],
            "total_cost": test_material["unit_price"] * 4.0,
            "notes": "Conversion test"
        }
        
        measurement_item = {
            "id": f"meas-{uuid.uuid4().hex[:8]}",
            "size_id": test_size["id"],
            "size_name": test_size["name"],
            "size_code": test_size["code"],
            "measurements": {
                "Chest": 98.0,
                "Waist": 82.0
            }
        }
        
        asset_data = {
            "code": f"CONV-AST-{uuid.uuid4().hex[:6].upper()}",
            "name": "Asset for Conversion Test",
            "description": "Asset with BOM and measurements to convert",
            "status": "active",
            "bom": [bom_item],
            "measurements": [measurement_item]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert create_response.status_code == 200
        asset = create_response.json()
        asset_id = asset["id"]
        
        # Convert to product
        convert_response = requests.post(f"{BASE_URL}/api/assets/{asset_id}/convert-to-product", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert convert_response.status_code == 200
        product = convert_response.json()
        
        # Verify BOM was preserved
        assert "bom" in product
        assert len(product["bom"]) == 1
        assert product["bom"][0]["material_id"] == test_material["id"]
        assert product["bom"][0]["quantity"] == 4.0
        print(f"SUCCESS: BOM preserved in converted product")
        
        # Verify measurements were preserved
        assert "measurements" in product
        assert len(product["measurements"]) == 1
        assert product["measurements"][0]["size_id"] == test_size["id"]
        assert product["measurements"][0]["measurements"]["Chest"] == 98.0
        print(f"SUCCESS: Measurements preserved in converted product")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        requests.delete(f"{BASE_URL}/api/products/{product['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


# ==================== FIXTURES ====================

@pytest.fixture(scope="session")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def test_material(auth_token):
    """Create a test material for BOM tests"""
    material_data = {
        "code": f"FIX-MAT-{uuid.uuid4().hex[:6].upper()}",
        "name": "Fixture Test Material",
        "description": "Material for BOM testing",
        "material_type": "fabric",
        "composition": "100% Cotton",
        "unit": "meter",
        "unit_price": 12.50,
        "status": "active"
    }
    response = requests.post(f"{BASE_URL}/api/materials", json=material_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    material = response.json()
    yield material
    # Cleanup
    requests.delete(f"{BASE_URL}/api/materials/{material['id']}", headers={
        "Authorization": f"Bearer {auth_token}"
    })


@pytest.fixture
def test_size(auth_token):
    """Create a test size for measurement tests"""
    size_data = {
        "name": f"Test Size {uuid.uuid4().hex[:4]}",
        "code": f"TS{uuid.uuid4().hex[:2].upper()}",
        "category": "apparel",
        "sort_order": 1
    }
    response = requests.post(f"{BASE_URL}/api/sizes", json=size_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    size = response.json()
    yield size
    # Cleanup
    requests.delete(f"{BASE_URL}/api/sizes/{size['id']}", headers={
        "Authorization": f"Bearer {auth_token}"
    })
