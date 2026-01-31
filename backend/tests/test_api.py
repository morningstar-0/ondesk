"""
Backend API Tests for Asset & Product Management System
Tests: Auth, Dashboard, Assets, Products, Materials, Libraries (Colors, Sizes, Suppliers, Buyers)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://inventoai-1.preview.emergentagent.com')

# Test credentials from review request
TEST_EMAIL = "testfix@example.com"
TEST_PASSWORD = "test123"


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_register_duplicate_email(self):
        """Test registration with existing email fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": "test123",
            "name": "Duplicate User"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_auth_me_with_token(self, auth_token):
        """Test /auth/me endpoint with valid token"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "tenant" in data
        assert data["user"]["email"] == TEST_EMAIL
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token fails"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]


class TestDashboard:
    """Dashboard stats endpoint tests"""
    
    def test_dashboard_stats(self, auth_token):
        """Test dashboard stats endpoint returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify counts structure
        assert "counts" in data
        counts = data["counts"]
        assert "assets" in counts
        assert "products" in counts
        assert "materials" in counts
        assert "suppliers" in counts
        assert "buyers" in counts
        assert "colors" in counts
        assert "sizes" in counts
        
        # Verify all counts are integers
        for key, value in counts.items():
            assert isinstance(value, int), f"{key} should be integer"
        
        # Verify recent items arrays
        assert "recent_assets" in data
        assert "recent_products" in data
        assert isinstance(data["recent_assets"], list)
        assert isinstance(data["recent_products"], list)
    
    def test_dashboard_stats_unauthorized(self):
        """Test dashboard stats without auth fails"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code in [401, 403]


class TestAssets:
    """Assets CRUD endpoint tests"""
    
    def test_get_assets_list(self, auth_token):
        """Test GET /api/assets returns list"""
        response = requests.get(f"{BASE_URL}/api/assets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_asset(self, auth_token):
        """Test POST /api/assets creates new asset"""
        asset_data = {
            "code": f"TEST-AST-{uuid.uuid4().hex[:6].upper()}",
            "name": "Test Asset",
            "description": "Test asset description",
            "status": "draft",
            "tags": ["test", "automated"]
        }
        response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["code"] == asset_data["code"]
        assert data["name"] == asset_data["name"]
        assert data["status"] == "draft"
        return data["id"]
    
    def test_get_asset_by_id(self, auth_token, created_asset_id):
        """Test GET /api/assets/{id} returns specific asset"""
        response = requests.get(f"{BASE_URL}/api/assets/{created_asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_asset_id
    
    def test_update_asset(self, auth_token, created_asset_id):
        """Test PUT /api/assets/{id} updates asset"""
        update_data = {
            "code": f"TEST-AST-{uuid.uuid4().hex[:6].upper()}",
            "name": "Updated Test Asset",
            "description": "Updated description",
            "status": "active"
        }
        response = requests.put(f"{BASE_URL}/api/assets/{created_asset_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Test Asset"
        assert data["status"] == "active"
    
    def test_delete_asset(self, auth_token, created_asset_id):
        """Test DELETE /api/assets/{id} removes asset"""
        response = requests.delete(f"{BASE_URL}/api/assets/{created_asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/assets/{created_asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_response.status_code == 404
    
    def test_assets_unauthorized(self):
        """Test assets endpoint without auth fails"""
        response = requests.get(f"{BASE_URL}/api/assets")
        assert response.status_code in [401, 403]


class TestProducts:
    """Products CRUD endpoint tests"""
    
    def test_get_products_list(self, auth_token):
        """Test GET /api/products returns list"""
        response = requests.get(f"{BASE_URL}/api/products", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_product(self, auth_token):
        """Test POST /api/products creates new product"""
        product_data = {
            "code": f"TEST-PRD-{uuid.uuid4().hex[:6].upper()}",
            "name": "Test Product",
            "description": "Test product description",
            "lifecycle_stage": "concept",
            "status": "draft",
            "tags": ["test", "automated"]
        }
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["code"] == product_data["code"]
        assert data["name"] == product_data["name"]
        assert data["lifecycle_stage"] == "concept"
        return data["id"]
    
    def test_get_product_by_id(self, auth_token, created_product_id):
        """Test GET /api/products/{id} returns specific product"""
        response = requests.get(f"{BASE_URL}/api/products/{created_product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_product_id
    
    def test_update_product(self, auth_token, created_product_id):
        """Test PUT /api/products/{id} updates product"""
        update_data = {
            "code": f"TEST-PRD-{uuid.uuid4().hex[:6].upper()}",
            "name": "Updated Test Product",
            "description": "Updated description",
            "lifecycle_stage": "development",
            "status": "active"
        }
        response = requests.put(f"{BASE_URL}/api/products/{created_product_id}", json=update_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Test Product"
        assert data["lifecycle_stage"] == "development"
    
    def test_delete_product(self, auth_token, created_product_id):
        """Test DELETE /api/products/{id} removes product"""
        response = requests.delete(f"{BASE_URL}/api/products/{created_product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/products/{created_product_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert get_response.status_code == 404


class TestMaterials:
    """Materials CRUD endpoint tests"""
    
    def test_get_materials_list(self, auth_token):
        """Test GET /api/materials returns list"""
        response = requests.get(f"{BASE_URL}/api/materials", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_material(self, auth_token):
        """Test POST /api/materials creates new material"""
        material_data = {
            "code": f"TEST-MAT-{uuid.uuid4().hex[:6].upper()}",
            "name": "Test Material",
            "description": "Test material description",
            "material_type": "fabric",
            "composition": "100% Cotton",
            "unit": "meter",
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
        return data["id"]
    
    def test_get_material_by_id(self, auth_token, created_material_id):
        """Test GET /api/materials/{id} returns specific material"""
        response = requests.get(f"{BASE_URL}/api/materials/{created_material_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_material_id


class TestAssetToProductConversion:
    """Asset to Product conversion tests"""
    
    def test_convert_asset_to_product(self, auth_token):
        """Test POST /api/assets/{id}/convert-to-product"""
        # First create an asset
        asset_data = {
            "code": f"CONV-AST-{uuid.uuid4().hex[:6].upper()}",
            "name": "Asset to Convert",
            "description": "This asset will be converted to product",
            "status": "active",
            "tags": ["conversion", "test"]
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
        
        # Verify product was created with asset data
        assert "id" in product
        assert product["source_asset_id"] == asset_id
        assert product["name"] == asset_data["name"]
        assert "PRD-" in product["code"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        requests.delete(f"{BASE_URL}/api/products/{product['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestColorsLibrary:
    """Colors library CRUD tests"""
    
    def test_get_colors_list(self, auth_token):
        """Test GET /api/colors returns list"""
        response = requests.get(f"{BASE_URL}/api/colors", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_color(self, auth_token):
        """Test POST /api/colors creates new color"""
        color_data = {
            "name": f"Test Color {uuid.uuid4().hex[:4]}",
            "hex_code": "#FF5733",
            "description": "Test color description"
        }
        response = requests.post(f"{BASE_URL}/api/colors", json=color_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == color_data["name"]
        assert data["hex_code"] == color_data["hex_code"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/colors/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestSizesLibrary:
    """Sizes library CRUD tests"""
    
    def test_get_sizes_list(self, auth_token):
        """Test GET /api/sizes returns list"""
        response = requests.get(f"{BASE_URL}/api/sizes", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_size(self, auth_token):
        """Test POST /api/sizes creates new size"""
        size_data = {
            "name": f"Test Size {uuid.uuid4().hex[:4]}",
            "code": f"TS{uuid.uuid4().hex[:2].upper()}",
            "category": "apparel",
            "sort_order": 1
        }
        response = requests.post(f"{BASE_URL}/api/sizes", json=size_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == size_data["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/sizes/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestSuppliersLibrary:
    """Suppliers library CRUD tests"""
    
    def test_get_suppliers_list(self, auth_token):
        """Test GET /api/suppliers returns list"""
        response = requests.get(f"{BASE_URL}/api/suppliers", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_supplier(self, auth_token):
        """Test POST /api/suppliers creates new supplier"""
        supplier_data = {
            "name": f"Test Supplier {uuid.uuid4().hex[:4]}",
            "code": f"SUP{uuid.uuid4().hex[:4].upper()}",
            "email": "supplier@test.com",
            "phone": "+1234567890",
            "country": "USA",
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/suppliers", json=supplier_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == supplier_data["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/suppliers/{data['id']}", headers={
            "Authorization": f"Bearer {auth_token}"
        })


class TestBuyersLibrary:
    """Buyers library CRUD tests"""
    
    def test_get_buyers_list(self, auth_token):
        """Test GET /api/buyers returns list"""
        response = requests.get(f"{BASE_URL}/api/buyers", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_buyer(self, auth_token):
        """Test POST /api/buyers creates new buyer"""
        buyer_data = {
            "name": f"Test Buyer {uuid.uuid4().hex[:4]}",
            "code": f"BUY{uuid.uuid4().hex[:4].upper()}",
            "email": "buyer@test.com",
            "phone": "+1234567890",
            "country": "UK",
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/buyers", json=buyer_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == buyer_data["name"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/buyers/{data['id']}", headers={
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
def created_asset_id(auth_token):
    """Create an asset for testing and cleanup after"""
    asset_data = {
        "code": f"FIX-AST-{uuid.uuid4().hex[:6].upper()}",
        "name": "Fixture Test Asset",
        "description": "Asset created by fixture",
        "status": "draft"
    }
    response = requests.post(f"{BASE_URL}/api/assets", json=asset_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    asset_id = response.json()["id"]
    yield asset_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/assets/{asset_id}", headers={
        "Authorization": f"Bearer {auth_token}"
    })


@pytest.fixture
def created_product_id(auth_token):
    """Create a product for testing and cleanup after"""
    product_data = {
        "code": f"FIX-PRD-{uuid.uuid4().hex[:6].upper()}",
        "name": "Fixture Test Product",
        "description": "Product created by fixture",
        "lifecycle_stage": "concept",
        "status": "draft"
    }
    response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    product_id = response.json()["id"]
    yield product_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/products/{product_id}", headers={
        "Authorization": f"Bearer {auth_token}"
    })


@pytest.fixture
def created_material_id(auth_token):
    """Create a material for testing and cleanup after"""
    material_data = {
        "code": f"FIX-MAT-{uuid.uuid4().hex[:6].upper()}",
        "name": "Fixture Test Material",
        "description": "Material created by fixture",
        "material_type": "fabric",
        "status": "active"
    }
    response = requests.post(f"{BASE_URL}/api/materials", json=material_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    material_id = response.json()["id"]
    yield material_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/materials/{material_id}", headers={
        "Authorization": f"Bearer {auth_token}"
    })
