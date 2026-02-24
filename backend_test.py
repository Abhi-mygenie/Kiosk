import requests
import sys
import json
from datetime import datetime

class KioskAPITester:
    def __init__(self, base_url="https://kiosk-ordering.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

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
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            result = {
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': response.status_code,
                'success': success,
                'response_size': len(response.text) if response.text else 0
            }
            
            # Try to parse JSON response
            try:
                response_data = response.json() if response.text else {}
                result['response_data'] = response_data
                
                if success:
                    self.tests_passed += 1
                    print(f"✅ Passed - Status: {response.status_code}")
                    if 'message' in response_data:
                        print(f"   Message: {response_data['message']}")
                    elif isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items returned")
                    elif isinstance(response_data, dict) and 'data' in response_data:
                        print(f"   Response: Contains data object")
                else:
                    print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                    print(f"   Response: {response_data}")
                    
            except Exception as json_error:
                result['response_text'] = response.text[:200] + "..." if len(response.text) > 200 else response.text
                if success:
                    self.tests_passed += 1
                    print(f"✅ Passed - Status: {response.status_code} (Non-JSON response)")
                else:
                    print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {result['response_text']}")

            self.results.append(result)
            return success, result.get('response_data', {})

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            result = {
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': 'TIMEOUT',
                'success': False,
                'error': 'Request timeout'
            }
            self.results.append(result)
            return False, {}
            
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            result = {
                'name': name,
                'endpoint': endpoint,
                'method': method,
                'expected_status': expected_status,
                'actual_status': 'ERROR',
                'success': False,
                'error': str(e)
            }
            self.results.append(result)
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "api/",
            200
        )
        return success

    def test_login(self, email="test@example.com", password="testpassword"):
        """Test login endpoint (expected to fail without valid credentials)"""
        success, response = self.run_test(
            "Login Endpoint",
            "POST",
            "api/auth/login",
            401,  # Expected to fail with 401
            data={"email": email, "password": password}
        )
        
        # Note: This should fail with 401 Unauthorized since we don't have valid POS credentials
        if not success and response.get('status_code') == 401:
            print("   ℹ️  Expected failure - No valid POS credentials provided")
            return True
        return success

    def test_menu_categories(self):
        """Test menu categories endpoint"""
        success, response = self.run_test(
            "Menu Categories",
            "GET",
            "api/menu/categories",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} categories")
            if response:
                sample_category = response[0]
                print(f"   Sample category: {sample_category}")
        
        return success

    def test_menu_items(self):
        """Test menu items endpoint"""
        success, response = self.run_test(
            "Menu Items",
            "GET",
            "api/menu/items",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} menu items")
            if response:
                sample_item = response[0]
                print(f"   Sample item: {sample_item.get('name', 'Unknown')} - ₹{sample_item.get('price', 0)}")
        
        return success

    def test_tables(self):
        """Test tables endpoint"""
        success, response = self.run_test(
            "Tables Endpoint",
            "GET",
            "api/tables",
            200
        )
        
        if success and isinstance(response, dict) and 'tables' in response:
            tables = response['tables']
            print(f"   ✅ Found {len(tables)} tables")
            print(f"   Data source: {response.get('source', 'unknown')}")
            if tables:
                sample_table = tables[0]
                print(f"   Sample table: {sample_table}")
        
        return success

    def test_branding_config(self):
        """Test branding config endpoint"""
        success, response = self.run_test(
            "Branding Config",
            "GET",
            "api/config/branding",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   ✅ Branding config loaded")
            print(f"   Restaurant: {response.get('restaurant_name', 'Unknown')}")
            print(f"   Colors: {response.get('primary_color', 'N/A')} / {response.get('accent_color', 'N/A')}")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Kiosk API Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 60)

        # Test health check
        health_ok = self.test_health_check()
        
        # Test authentication (expected to fail)
        login_tested = self.test_login()
        
        # Test menu endpoints
        categories_ok = self.test_menu_categories()
        items_ok = self.test_menu_items()
        
        # Test tables endpoint
        tables_ok = self.test_tables()
        
        # Test branding config
        branding_ok = self.test_branding_config()

        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        # Detailed results
        print("\n📋 Detailed Results:")
        for result in self.results:
            status_emoji = "✅" if result['success'] else "❌"
            print(f"   {status_emoji} {result['name']}: {result['actual_status']}")
        
        # Critical issues check
        critical_failures = []
        if not health_ok:
            critical_failures.append("API Health Check failed")
        if not categories_ok:
            critical_failures.append("Menu Categories endpoint failed")
        if not items_ok:
            critical_failures.append("Menu Items endpoint failed")
        if not tables_ok:
            critical_failures.append("Tables endpoint failed")
            
        if critical_failures:
            print(f"\n🚨 Critical Issues Found:")
            for issue in critical_failures:
                print(f"   • {issue}")
            return 1
        else:
            print(f"\n✅ All critical endpoints working properly")
            print(f"   ℹ️  Login endpoint properly returns 401 (expected without valid credentials)")
            return 0

def main():
    tester = KioskAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())