"""
Test Optional Tables Feature
Tests that restaurants with 0 tables configured in POS can use the kiosk without table selection.
Tests both Kunafa Mahal (no tables) and Hyatt (has tables).
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
KUNAFA_MAHAL_CREDS = {
    "email": "owner@kunafamahal.com",
    "password": "Qplazm@10"
}

HYATT_CREDS = {
    "email": "manager@hyattcandolim.com",
    "password": "Qplazm@10"
}


class TestKunafaMahalNoTables:
    """Test suite for Kunafa Mahal restaurant which has NO tables configured"""
    
    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Login and get token for Kunafa Mahal"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=KUNAFA_MAHAL_CREDS)
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed for Kunafa Mahal: {response.status_code} - {response.text}")
    
    def test_kunafa_login_success(self):
        """Test that Kunafa Mahal owner can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=KUNAFA_MAHAL_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert len(data["token"]) > 0, "Token is empty"
        print(f"✓ Kunafa Mahal login successful, got token")
    
    def test_kunafa_tables_returns_empty_list_not_503(self):
        """
        CRITICAL: /api/tables must return {tables:[], source:'pos'} for no-tables restaurant
        Previously this was returning 503 error which broke the kiosk
        """
        response = requests.get(f"{BASE_URL}/api/tables", headers=self.headers)
        
        # Must NOT be 503
        assert response.status_code != 503, f"API returned 503! Should return 200 with empty list"
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "tables" in data, "Response must have 'tables' key"
        assert data["tables"] == [], f"Expected empty list, got: {data['tables']}"
        assert data.get("source") == "pos", f"Expected source='pos', got: {data.get('source')}"
        
        print(f"✓ Kunafa Mahal tables API returns {{tables:[], source:'pos'}} correctly")
    
    def test_kunafa_menu_categories_work(self):
        """Test that menu categories can still be fetched"""
        response = requests.get(f"{BASE_URL}/api/menu/categories", headers=self.headers)
        assert response.status_code == 200, f"Categories failed: {response.status_code}: {response.text}"
        
        categories = response.json()
        assert isinstance(categories, list), "Categories should be a list"
        print(f"✓ Kunafa Mahal has {len(categories)} categories")
    
    def test_kunafa_menu_items_work(self):
        """Test that menu items can still be fetched"""
        response = requests.get(f"{BASE_URL}/api/menu/items", headers=self.headers)
        assert response.status_code == 200, f"Menu items failed: {response.status_code}: {response.text}"
        
        items = response.json()
        assert isinstance(items, list), "Items should be a list"
        print(f"✓ Kunafa Mahal has {len(items)} menu items")


class TestHyattWithTables:
    """Test suite for Hyatt restaurant which HAS tables configured"""
    
    @pytest.fixture(autouse=True)
    def setup(self, request):
        """Login and get token for Hyatt"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HYATT_CREDS)
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed for Hyatt: {response.status_code} - {response.text}")
    
    def test_hyatt_login_success(self):
        """Test that Hyatt manager can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=HYATT_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        print(f"✓ Hyatt login successful")
    
    def test_hyatt_tables_returns_tables_list(self):
        """Test that /api/tables returns a list of tables for Hyatt"""
        response = requests.get(f"{BASE_URL}/api/tables", headers=self.headers)
        
        assert response.status_code == 200, f"Tables API failed: {response.status_code}: {response.text}"
        
        data = response.json()
        assert "tables" in data, "Response must have 'tables' key"
        assert isinstance(data["tables"], list), "Tables must be a list"
        assert len(data["tables"]) > 0, f"Hyatt should have tables, got empty list"
        assert data.get("source") == "pos", f"Expected source='pos', got: {data.get('source')}"
        
        # Verify table structure
        first_table = data["tables"][0]
        assert "id" in first_table, "Table must have 'id'"
        assert "table_no" in first_table, "Table must have 'table_no'"
        
        print(f"✓ Hyatt has {len(data['tables'])} tables configured")
        
        # The requirement says 102 tables
        if len(data["tables"]) >= 100:
            print(f"✓ Confirmed Hyatt has {len(data['tables'])} tables (expected ~102)")
    
    def test_hyatt_menu_categories_work(self):
        """Test that menu categories can still be fetched"""
        response = requests.get(f"{BASE_URL}/api/menu/categories", headers=self.headers)
        assert response.status_code == 200, f"Categories failed: {response.status_code}: {response.text}"
        
        categories = response.json()
        assert isinstance(categories, list), "Categories should be a list"
        assert len(categories) > 0, "Hyatt should have categories"
        print(f"✓ Hyatt has {len(categories)} categories")


class TestAPIUnauthorized:
    """Test that APIs properly reject unauthorized requests"""
    
    def test_tables_requires_auth(self):
        """Tables endpoint must require authorization"""
        response = requests.get(f"{BASE_URL}/api/tables")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Tables API properly requires authorization")
    
    def test_menu_requires_auth(self):
        """Menu endpoint must require authorization"""
        response = requests.get(f"{BASE_URL}/api/menu/categories")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Menu API properly requires authorization")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
