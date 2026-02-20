#!/usr/bin/env python3
"""
Backend API Testing for Hotel Breakfast Kiosk Application
Tests all API endpoints for functionality and data validation
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List

class KioskAPITester:
    def __init__(self, base_url="https://luxury-order-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ PASS: {name}")
            if details:
                print(f"   Details: {details}")
        else:
            self.errors.append(f"{name}: {details}")
            print(f"❌ FAIL: {name}")
            print(f"   Error: {details}")

    def test_api_root(self):
        """Test the API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            expected_message = "Kiosk API Ready"
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == expected_message:
                    self.log_test("API Root Endpoint", True, f"Status: {response.status_code}, Message: {data.get('message')}")
                else:
                    self.log_test("API Root Endpoint", False, f"Expected message '{expected_message}', got '{data.get('message')}'")
            else:
                self.log_test("API Root Endpoint", False, f"Expected status 200, got {response.status_code}")
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Connection error: {str(e)}")

    def test_get_categories(self):
        """Test menu categories endpoint"""
        try:
            response = requests.get(f"{self.api_url}/menu/categories", timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                
                # Validate structure
                if isinstance(categories, list) and len(categories) == 4:
                    expected_categories = ["hot-breakfast", "bakery", "healthy", "beverages"]
                    actual_ids = [cat.get("id") for cat in categories]
                    
                    if all(cat_id in actual_ids for cat_id in expected_categories):
                        # Validate each category has required fields
                        all_valid = True
                        for cat in categories:
                            if not all(field in cat for field in ["id", "name", "image"]):
                                all_valid = False
                                break
                        
                        if all_valid:
                            self.log_test("Get Categories", True, f"Retrieved {len(categories)} categories with all required fields")
                        else:
                            self.log_test("Get Categories", False, "Some categories missing required fields (id, name, image)")
                    else:
                        self.log_test("Get Categories", False, f"Expected category IDs {expected_categories}, got {actual_ids}")
                else:
                    self.log_test("Get Categories", False, f"Expected 4 categories, got {len(categories) if isinstance(categories, list) else 'non-list'}")
            else:
                self.log_test("Get Categories", False, f"Expected status 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Categories", False, f"Connection error: {str(e)}")

    def test_get_menu_items_all(self):
        """Test getting all menu items"""
        try:
            response = requests.get(f"{self.api_url}/menu/items", timeout=10)
            
            if response.status_code == 200:
                items = response.json()
                
                if isinstance(items, list) and len(items) == 24:
                    # Validate item structure
                    required_fields = ["id", "name", "description", "price", "image", "category", "available"]
                    all_valid = True
                    
                    for item in items[:3]:  # Check first 3 items
                        if not all(field in item for field in required_fields):
                            all_valid = False
                            break
                    
                    if all_valid:
                        # Check categories distribution
                        categories = {}
                        for item in items:
                            cat = item.get("category")
                            categories[cat] = categories.get(cat, 0) + 1
                        
                        expected_count = 6  # 6 items per category
                        if all(count == expected_count for count in categories.values()):
                            self.log_test("Get All Menu Items", True, f"Retrieved {len(items)} items across {len(categories)} categories")
                        else:
                            self.log_test("Get All Menu Items", False, f"Uneven distribution across categories: {categories}")
                    else:
                        self.log_test("Get All Menu Items", False, "Some items missing required fields")
                else:
                    self.log_test("Get All Menu Items", False, f"Expected 24 items, got {len(items) if isinstance(items, list) else 'non-list'}")
            else:
                self.log_test("Get All Menu Items", False, f"Expected status 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Get All Menu Items", False, f"Connection error: {str(e)}")

    def test_get_menu_items_by_category(self):
        """Test getting menu items filtered by category"""
        categories = ["hot-breakfast", "bakery", "healthy", "beverages"]
        
        for category in categories:
            try:
                response = requests.get(f"{self.api_url}/menu/items", params={"category": category}, timeout=10)
                
                if response.status_code == 200:
                    items = response.json()
                    
                    if isinstance(items, list) and len(items) == 6:
                        # Validate all items belong to the requested category
                        if all(item.get("category") == category for item in items):
                            self.log_test(f"Get Menu Items - {category}", True, f"Retrieved {len(items)} items")
                        else:
                            wrong_cats = [item.get("category") for item in items if item.get("category") != category]
                            self.log_test(f"Get Menu Items - {category}", False, f"Found items from wrong categories: {wrong_cats}")
                    else:
                        self.log_test(f"Get Menu Items - {category}", False, f"Expected 6 items, got {len(items) if isinstance(items, list) else 'non-list'}")
                else:
                    self.log_test(f"Get Menu Items - {category}", False, f"Expected status 200, got {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Get Menu Items - {category}", False, f"Connection error: {str(e)}")

    def test_create_order(self):
        """Test creating an order"""
        try:
            # Test order data
            order_data = {
                "table_number": "12",
                "items": [
                    {
                        "item_id": "1",
                        "name": "Scrambled Eggs",
                        "price": 12.99,
                        "quantity": 2
                    },
                    {
                        "item_id": "7",
                        "name": "Croissant",
                        "price": 5.99,
                        "quantity": 1
                    }
                ],
                "total": 31.97,
                "guest_name": "Test Guest"
            }
            
            response = requests.post(f"{self.api_url}/orders", json=order_data, timeout=10)
            
            if response.status_code == 200:
                order = response.json()
                
                # Validate response structure
                required_fields = ["id", "table_number", "items", "total", "status", "created_at"]
                if all(field in order for field in required_fields):
                    # Validate data integrity
                    if (order.get("table_number") == "12" and 
                        order.get("total") == 31.97 and 
                        len(order.get("items", [])) == 2 and
                        order.get("status") == "pending"):
                        self.log_test("Create Order", True, f"Order created with ID: {order.get('id')[:8]}...")
                        return order.get('id')  # Return order ID for potential future tests
                    else:
                        self.log_test("Create Order", False, "Order data doesn't match input data")
                else:
                    self.log_test("Create Order", False, f"Missing required fields in response: {required_fields}")
            else:
                self.log_test("Create Order", False, f"Expected status 200, got {response.status_code}")
                if hasattr(response, 'text'):
                    print(f"   Response: {response.text}")
                    
        except Exception as e:
            self.log_test("Create Order", False, f"Connection error: {str(e)}")

    def test_get_branding(self):
        """Test branding configuration endpoint"""
        try:
            response = requests.get(f"{self.api_url}/config/branding", timeout=10)
            
            if response.status_code == 200:
                branding = response.json()
                
                # Validate structure
                required_fields = ["primary_color", "accent_color", "restaurant_name"]
                if all(field in branding for field in required_fields):
                    # Validate default values
                    expected_values = {
                        "primary_color": "#1A1A1A",
                        "accent_color": "#C5A059", 
                        "restaurant_name": "Hotel Lumiere"
                    }
                    
                    all_match = True
                    for field, expected in expected_values.items():
                        if branding.get(field) != expected:
                            all_match = False
                            break
                    
                    if all_match:
                        self.log_test("Get Branding Config", True, f"Retrieved branding: {branding.get('restaurant_name')}")
                    else:
                        self.log_test("Get Branding Config", False, f"Branding values don't match expected defaults")
                else:
                    self.log_test("Get Branding Config", False, f"Missing required fields: {required_fields}")
            else:
                self.log_test("Get Branding Config", False, f"Expected status 200, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Branding Config", False, f"Connection error: {str(e)}")

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        invalid_endpoints = [
            "/api/nonexistent",
            "/api/menu/invalid",
            "/api/orders/123"  # GET orders by ID not implemented
        ]
        
        for endpoint in invalid_endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                if response.status_code in [404, 405, 422]:  # Expected error codes
                    self.log_test(f"Invalid Endpoint {endpoint}", True, f"Properly returned {response.status_code}")
                else:
                    self.log_test(f"Invalid Endpoint {endpoint}", False, f"Expected 404/405/422, got {response.status_code}")
            except Exception as e:
                self.log_test(f"Invalid Endpoint {endpoint}", False, f"Connection error: {str(e)}")

    def run_all_tests(self):
        """Run the complete test suite"""
        print("🧪 Starting Hotel Kiosk Backend API Tests")
        print(f"🔗 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_api_root()
        self.test_get_categories()
        self.test_get_menu_items_all()
        self.test_get_menu_items_by_category()
        self.test_create_order()
        self.test_get_branding()
        self.test_invalid_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.errors:
            print(f"\n❌ Failed Tests ({len(self.errors)}):")
            for i, error in enumerate(self.errors, 1):
                print(f"  {i}. {error}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = KioskAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)