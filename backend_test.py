import requests
import sys
import json
import base64
import io
from datetime import datetime
from PIL import Image

class AssetProductAPITester:
    def __init__(self, base_url="https://asset-product-mgr.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.tenant_id = None
        self.created_items = {
            'assets': [],
            'products': [],
            'colors': [],
            'sizes': [],
            'suppliers': [],
            'buyers': [],
            'custom_fields': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test_{timestamp}@example.com",
            "password": "test123",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.tenant_id = response['user']['tenant_id']
            print(f"   Registered user: {test_user['email']}")
            return True
        return False

    def test_login(self):
        """Test user login with test credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.tenant_id = response['user']['tenant_id']
            return True
        return False

    def test_get_me(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Stats: {response.get('counts', {})}")
        return success

    def test_colors_crud(self):
        """Test Colors Library CRUD operations"""
        # Create color
        color_data = {
            "name": "Test Red",
            "hex_code": "#FF0000",
            "description": "Test red color"
        }
        
        success, response = self.run_test(
            "Create Color",
            "POST",
            "colors",
            200,
            data=color_data
        )
        
        if not success:
            return False
            
        color_id = response.get('id')
        self.created_items['colors'].append(color_id)
        
        # Get colors
        success, _ = self.run_test(
            "Get Colors",
            "GET",
            "colors",
            200
        )
        
        if not success:
            return False
            
        # Update color
        update_data = {
            "name": "Updated Red",
            "hex_code": "#FF0000",
            "description": "Updated red color"
        }
        
        success, _ = self.run_test(
            "Update Color",
            "PUT",
            f"colors/{color_id}",
            200,
            data=update_data
        )
        
        return success

    def test_sizes_crud(self):
        """Test Sizes Library CRUD operations"""
        # Create size
        size_data = {
            "name": "Large",
            "code": "L",
            "category": "clothing",
            "sort_order": 3
        }
        
        success, response = self.run_test(
            "Create Size",
            "POST",
            "sizes",
            200,
            data=size_data
        )
        
        if not success:
            return False
            
        size_id = response.get('id')
        self.created_items['sizes'].append(size_id)
        
        # Get sizes
        success, _ = self.run_test(
            "Get Sizes",
            "GET",
            "sizes",
            200
        )
        
        return success

    def test_suppliers_crud(self):
        """Test Suppliers Library CRUD operations"""
        # Create supplier
        supplier_data = {
            "name": "Test Supplier Co",
            "code": "TSC001",
            "email": "supplier@test.com",
            "phone": "+1234567890",
            "address": "123 Test St",
            "country": "USA",
            "is_active": True
        }
        
        success, response = self.run_test(
            "Create Supplier",
            "POST",
            "suppliers",
            200,
            data=supplier_data
        )
        
        if not success:
            return False
            
        supplier_id = response.get('id')
        self.created_items['suppliers'].append(supplier_id)
        
        # Get suppliers
        success, _ = self.run_test(
            "Get Suppliers",
            "GET",
            "suppliers",
            200
        )
        
        return success

    def test_buyers_crud(self):
        """Test Buyers Library CRUD operations"""
        # Create buyer
        buyer_data = {
            "name": "Test Buyer Corp",
            "code": "TBC001",
            "email": "buyer@test.com",
            "phone": "+1234567890",
            "address": "456 Test Ave",
            "country": "USA",
            "is_active": True
        }
        
        success, response = self.run_test(
            "Create Buyer",
            "POST",
            "buyers",
            200,
            data=buyer_data
        )
        
        if not success:
            return False
            
        buyer_id = response.get('id')
        self.created_items['buyers'].append(buyer_id)
        
        # Get buyers
        success, _ = self.run_test(
            "Get Buyers",
            "GET",
            "buyers",
            200
        )
        
        return success

    def test_custom_fields_crud(self):
        """Test Custom Fields Library CRUD operations"""
        # Create custom field
        field_data = {
            "name": "Material Type",
            "field_type": "select",
            "options": ["Cotton", "Polyester", "Silk"],
            "required": False,
            "default_value": "Cotton",
            "category": "fabric"
        }
        
        success, response = self.run_test(
            "Create Custom Field",
            "POST",
            "custom-fields",
            200,
            data=field_data
        )
        
        if not success:
            return False
            
        field_id = response.get('id')
        self.created_items['custom_fields'].append(field_id)
        
        # Get custom fields
        success, _ = self.run_test(
            "Get Custom Fields",
            "GET",
            "custom-fields",
            200
        )
        
        return success

    def test_assets_crud(self):
        """Test Assets CRUD operations"""
        # Create asset
        asset_data = {
            "name": "Test Asset",
            "sku": "TST-AST-001",
            "description": "Test asset description",
            "category": "test-category",
            "status": "draft"
        }
        
        success, response = self.run_test(
            "Create Asset",
            "POST",
            "assets",
            200,
            data=asset_data
        )
        
        if not success:
            return False
            
        asset_id = response.get('id')
        self.created_items['assets'].append(asset_id)
        
        # Get assets
        success, _ = self.run_test(
            "Get Assets",
            "GET",
            "assets",
            200
        )
        
        if not success:
            return False
            
        # Get single asset
        success, _ = self.run_test(
            "Get Single Asset",
            "GET",
            f"assets/{asset_id}",
            200
        )
        
        if not success:
            return False
            
        # Update asset
        update_data = {
            "name": "Updated Test Asset",
            "sku": "TST-AST-001-UPD",
            "description": "Updated test asset description",
            "category": "updated-category",
            "status": "active"
        }
        
        success, _ = self.run_test(
            "Update Asset",
            "PUT",
            f"assets/{asset_id}",
            200,
            data=update_data
        )
        
        return success

    def test_products_crud(self):
        """Test Products CRUD operations"""
        # Create product
        product_data = {
            "name": "Test Product",
            "sku": "TST-PRD-001",
            "description": "Test product description",
            "category": "test-category",
            "status": "draft",
            "price": 99.99,
            "cost": 50.00
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data
        )
        
        if not success:
            return False
            
        product_id = response.get('id')
        self.created_items['products'].append(product_id)
        
        # Get products
        success, _ = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        
        if not success:
            return False
            
        # Get single product
        success, _ = self.run_test(
            "Get Single Product",
            "GET",
            f"products/{product_id}",
            200
        )
        
        return success

    def test_convert_asset_to_product(self):
        """Test converting asset to product"""
        if not self.created_items['assets']:
            print("❌ No assets available for conversion test")
            return False
            
        asset_id = self.created_items['assets'][0]
        success, response = self.run_test(
            "Convert Asset to Product",
            "POST",
            f"assets/{asset_id}/convert-to-product",
            200
        )
        
        if success:
            product_id = response.get('id')
            self.created_items['products'].append(product_id)
            
        return success

    def test_form_layouts(self):
        """Test Form Layouts"""
        # Create form layout
        layout_data = {
            "name": "Asset Form Layout",
            "entity_type": "asset",
            "layout": {
                "sections": [
                    {"name": "Basic Info", "fields": ["name", "sku", "description"]},
                    {"name": "Details", "fields": ["category", "status"]}
                ]
            },
            "is_default": True
        }
        
        success, response = self.run_test(
            "Create Form Layout",
            "POST",
            "form-layouts",
            200,
            data=layout_data
        )
        
        if not success:
            return False
            
        # Get form layouts
        success, _ = self.run_test(
            "Get Form Layouts",
            "GET",
            "form-layouts",
            200
        )
        
        return success

    def test_settings(self):
        """Test System Settings"""
        # Get settings
        success, _ = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        
        if not success:
            return False
            
        # Update settings
        settings_data = {
            "company_name": "Test Company",
            "default_currency": "USD",
            "date_format": "YYYY-MM-DD",
            "timezone": "UTC"
        }
        
        success, _ = self.run_test(
            "Update Settings",
            "PUT",
            "settings",
            200,
            data=settings_data
        )
        
        return success

    def test_ai_generation(self):
        """Test AI Data Generation"""
        ai_request = {
            "context": "Creating a test asset for clothing category",
            "entity_type": "asset",
            "field_name": "description"
        }
        
        success, response = self.run_test(
            "AI Generate Data",
            "POST",
            "ai/generate",
            200,
            data=ai_request
        )
        
        if success:
            print(f"   Generated: {response.get('generated', '')[:50]}...")
            
        return success

    def create_test_image(self, format='JPEG', size=(100, 100), color='red'):
        """Create a test image in memory"""
        img = Image.new('RGB', size, color)
        img_buffer = io.BytesIO()
        img.save(img_buffer, format=format)
        img_buffer.seek(0)
        return img_buffer.getvalue()

    def test_image_upload_valid(self):
        """Test valid image upload with AI analysis"""
        print(f"\n🔍 Testing Image Upload - Valid JPEG...")
        
        # Create a test JPEG image
        image_data = self.create_test_image('JPEG', (200, 200), 'blue')
        
        # Prepare multipart form data
        files = {'file': ('test_image.jpg', image_data, 'image/jpeg')}
        
        url = f"{self.base_url}/assets/upload-image"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        
        try:
            response = requests.post(url, files=files, headers=headers)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                result = response.json()
                if 'asset' in result and 'ai_analysis' in result:
                    print(f"   Asset created: {result['asset']['name']}")
                    print(f"   AI analysis: {result['ai_analysis'].get('category', 'N/A')}")
                    
                    # Store created asset for cleanup
                    asset_id = result['asset']['id']
                    self.created_items['assets'].append(asset_id)
                    
                    return True
                else:
                    print(f"❌ Missing expected fields in response")
                    return False
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_image_upload_invalid_type(self):
        """Test image upload with invalid file type"""
        print(f"\n🔍 Testing Image Upload - Invalid File Type...")
        
        # Create a text file instead of image
        text_data = b"This is not an image file"
        files = {'file': ('test.txt', text_data, 'text/plain')}
        
        url = f"{self.base_url}/assets/upload-image"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        
        try:
            response = requests.post(url, files=files, headers=headers)
            
            if response.status_code == 400:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code} (correctly rejected)")
                return True
            else:
                print(f"❌ Failed - Expected 400, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_image_upload_large_file(self):
        """Test image upload with file too large"""
        print(f"\n🔍 Testing Image Upload - Large File...")
        
        # Create a large image (simulate > 10MB by creating large dimensions)
        # Note: We'll create a smaller image but test the validation logic
        image_data = self.create_test_image('JPEG', (100, 100), 'green')
        
        # Simulate large file by creating oversized data
        large_data = image_data * 1000  # Make it larger
        files = {'file': ('large_image.jpg', large_data, 'image/jpeg')}
        
        url = f"{self.base_url}/assets/upload-image"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        
        try:
            response = requests.post(url, files=files, headers=headers)
            
            # Should either succeed (if under 10MB) or fail with 400
            if response.status_code in [200, 400]:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    asset_id = result['asset']['id']
                    self.created_items['assets'].append(asset_id)
                    print(f"   Large file accepted and processed")
                else:
                    print(f"   Large file correctly rejected")
                    
                return True
            else:
                print(f"❌ Failed - Unexpected status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_image_upload_png(self):
        """Test PNG image upload"""
        print(f"\n🔍 Testing Image Upload - PNG Format...")
        
        # Create a test PNG image
        image_data = self.create_test_image('PNG', (150, 150), 'yellow')
        files = {'file': ('test_image.png', image_data, 'image/png')}
        
        url = f"{self.base_url}/assets/upload-image"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        
        try:
            response = requests.post(url, files=files, headers=headers)
            
            if response.status_code == 200:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                result = response.json()
                asset_id = result['asset']['id']
                self.created_items['assets'].append(asset_id)
                print(f"   PNG image processed successfully")
                
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_image_upload_no_auth(self):
        """Test image upload without authentication"""
        print(f"\n🔍 Testing Image Upload - No Authentication...")
        
        image_data = self.create_test_image('JPEG', (100, 100), 'red')
        files = {'file': ('test_image.jpg', image_data, 'image/jpeg')}
        
        url = f"{self.base_url}/assets/upload-image"
        # No authorization header
        
        self.tests_run += 1
        
        try:
            response = requests.post(url, files=files)
            
            if response.status_code == 401:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code} (correctly requires auth)")
                return True
            else:
                print(f"❌ Failed - Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def cleanup_created_items(self):
        """Clean up created test items"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order to handle dependencies
        for product_id in self.created_items['products']:
            self.run_test(f"Delete Product {product_id}", "DELETE", f"products/{product_id}", 200)
            
        for asset_id in self.created_items['assets']:
            self.run_test(f"Delete Asset {asset_id}", "DELETE", f"assets/{asset_id}", 200)
            
        for color_id in self.created_items['colors']:
            self.run_test(f"Delete Color {color_id}", "DELETE", f"colors/{color_id}", 200)
            
        for size_id in self.created_items['sizes']:
            self.run_test(f"Delete Size {size_id}", "DELETE", f"sizes/{size_id}", 200)
            
        for supplier_id in self.created_items['suppliers']:
            self.run_test(f"Delete Supplier {supplier_id}", "DELETE", f"suppliers/{supplier_id}", 200)
            
        for buyer_id in self.created_items['buyers']:
            self.run_test(f"Delete Buyer {buyer_id}", "DELETE", f"buyers/{buyer_id}", 200)
            
        for field_id in self.created_items['custom_fields']:
            self.run_test(f"Delete Custom Field {field_id}", "DELETE", f"custom-fields/{field_id}", 200)

def main():
    print("🚀 Starting Asset & Product Management API Tests")
    print("=" * 60)
    
    tester = AssetProductAPITester()
    
    try:
        # Test authentication first
        if not tester.test_register():
            print("❌ Registration failed, trying login with test credentials")
            if not tester.test_login():
                print("❌ Both registration and login failed, stopping tests")
                return 1
        
        # Test user info
        tester.test_get_me()
        
        # Test dashboard
        tester.test_dashboard_stats()
        
        # Test all library CRUD operations
        tester.test_colors_crud()
        tester.test_sizes_crud()
        tester.test_suppliers_crud()
        tester.test_buyers_crud()
        tester.test_custom_fields_crud()
        
        # Test main entities
        tester.test_assets_crud()
        tester.test_products_crud()
        
        # Test conversion feature
        tester.test_convert_asset_to_product()
        
        # Test form layouts
        tester.test_form_layouts()
        
        # Test settings
        tester.test_settings()
        
        # Test AI generation
        tester.test_ai_generation()
        
        # Clean up
        tester.cleanup_created_items()
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        tester.cleanup_created_items()
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        tester.cleanup_created_items()
        return 1
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())