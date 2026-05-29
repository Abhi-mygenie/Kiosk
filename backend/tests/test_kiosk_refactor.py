"""
Test suite for Kiosk App - After Refactor
Tests the core functionality after KioskPage.js refactoring from 1356 to 404 lines
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
HYATT_CREDS = {
    "email": "manager@hyattcandolim.com",
    "password": "Qplazm@10"
}

KUNAFA_CREDS = {
    "email": "owner@kunafamahal.com",
    "password": "Qplazm@10"
}


@pytest.fixture(scope="module")
def hyatt_token():
    """Get token for Hyatt account (has tables)"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=HYATT_CREDS,
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def kunafa_token():
    """Get token for Kunafa Mahal account (no tables)"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=KUNAFA_CREDS,
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


class TestAPIHealth:
    """Health check tests - run first"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        assert response.json().get("message") == "Kiosk API Ready"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_hyatt_success(self):
        """Test Hyatt login returns token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=HYATT_CREDS,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert len(data["token"]) > 0
    
    def test_login_kunafa_success(self):
        """Test Kunafa Mahal login returns token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=KUNAFA_CREDS,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpass"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401


class TestMenuEndpoints:
    """Menu API tests - requires authentication"""
    
    def test_menu_categories_requires_auth(self):
        """Test categories endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/menu/categories")
        assert response.status_code == 401
    
    def test_menu_items_requires_auth(self):
        """Test menu items endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/menu/items")
        assert response.status_code == 401
    
    def test_hyatt_categories(self, hyatt_token):
        """Test Hyatt has 5 categories (Dosa, Egg Preparation, Pancakes, Parathas, Waffle)"""
        response = requests.get(
            f"{BASE_URL}/api/menu/categories",
            headers={"Authorization": f"Bearer {hyatt_token}"}
        )
        assert response.status_code == 200
        categories = response.json()
        assert len(categories) >= 5, f"Expected at least 5 categories, got {len(categories)}"
        
        # Verify structure
        for cat in categories:
            assert "id" in cat
            assert "name" in cat
    
    def test_hyatt_menu_items(self, hyatt_token):
        """Test Hyatt menu items returned"""
        response = requests.get(
            f"{BASE_URL}/api/menu/items",
            headers={"Authorization": f"Bearer {hyatt_token}"}
        )
        assert response.status_code == 200
        items = response.json()
        assert len(items) >= 40, f"Expected at least 40 items, got {len(items)}"
        
        # Verify item structure
        if items:
            item = items[0]
            assert "id" in item
            assert "name" in item
            assert "price" in item
            assert "category" in item
    
    def test_kunafa_categories(self, kunafa_token):
        """Test Kunafa Mahal has categories"""
        response = requests.get(
            f"{BASE_URL}/api/menu/categories",
            headers={"Authorization": f"Bearer {kunafa_token}"}
        )
        assert response.status_code == 200
        categories = response.json()
        assert len(categories) >= 10, f"Expected at least 10 categories, got {len(categories)}"
    
    def test_kunafa_menu_items(self, kunafa_token):
        """Test Kunafa Mahal has menu items"""
        response = requests.get(
            f"{BASE_URL}/api/menu/items",
            headers={"Authorization": f"Bearer {kunafa_token}"}
        )
        assert response.status_code == 200
        items = response.json()
        assert len(items) >= 70, f"Expected at least 70 items, got {len(items)}"


class TestTablesEndpoint:
    """Tables API tests - key feature for Optional Tables"""
    
    def test_tables_requires_auth(self):
        """Test tables endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/tables")
        assert response.status_code == 401
    
    def test_hyatt_has_tables(self, hyatt_token):
        """Test Hyatt returns tables (90+)"""
        response = requests.get(
            f"{BASE_URL}/api/tables",
            headers={"Authorization": f"Bearer {hyatt_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "tables" in data
        assert len(data["tables"]) >= 90, f"Expected 90+ tables, got {len(data['tables'])}"
    
    def test_kunafa_has_no_tables(self, kunafa_token):
        """Test Kunafa Mahal returns empty tables array (not 503 error)"""
        response = requests.get(
            f"{BASE_URL}/api/tables",
            headers={"Authorization": f"Bearer {kunafa_token}"}
        )
        assert response.status_code == 200, f"Should return 200, not {response.status_code}"
        data = response.json()
        assert "tables" in data
        assert len(data["tables"]) == 0, f"Expected 0 tables, got {len(data['tables'])}"


class TestOrderPlacement:
    """Order placement tests"""
    
    def test_place_order_hyatt(self, hyatt_token):
        """Test order placement for Hyatt (with table)"""
        # First get a menu item
        items_response = requests.get(
            f"{BASE_URL}/api/menu/items",
            headers={"Authorization": f"Bearer {hyatt_token}"}
        )
        assert items_response.status_code == 200
        items = items_response.json()
        assert len(items) > 0
        
        test_item = items[0]
        
        order_data = {
            "table_number": "1",
            "table_id": None,
            "items": [{
                "item_id": test_item["id"],
                "name": test_item["name"],
                "price": test_item.get("price", 0),
                "quantity": 1,
                "variations": [],
                "grouped_variations": {},
                "special_instructions": "Test order from pytest"
            }],
            "subtotal": test_item.get("price", 0),
            "discount": 0,
            "cgst": 0,
            "sgst": 0,
            "total": test_item.get("price", 0)
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_data,
            headers={
                "Authorization": f"Bearer {hyatt_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code in [200, 201], f"Order failed: {response.text}"
        data = response.json()
        # Order should return an ID (from POS or internal)
        assert "id" in data or "pos_order_id" in data
    
    def test_place_order_kunafa_no_table(self, kunafa_token):
        """Test order placement for Kunafa Mahal (no table required)"""
        # First get a menu item
        items_response = requests.get(
            f"{BASE_URL}/api/menu/items",
            headers={"Authorization": f"Bearer {kunafa_token}"}
        )
        assert items_response.status_code == 200
        items = items_response.json()
        assert len(items) > 0
        
        test_item = items[0]
        
        order_data = {
            "table_number": "",  # No table for Kunafa Mahal
            "table_id": None,
            "items": [{
                "item_id": test_item["id"],
                "name": test_item["name"],
                "price": test_item.get("price", 0),
                "quantity": 1,
                "variations": [],
                "grouped_variations": {},
                "special_instructions": None
            }],
            "subtotal": test_item.get("price", 0),
            "discount": 0,
            "cgst": 0,
            "sgst": 0,
            "total": test_item.get("price", 0)
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_data,
            headers={
                "Authorization": f"Bearer {kunafa_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code in [200, 201], f"Order failed: {response.text}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
