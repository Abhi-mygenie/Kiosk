"""
Test Security Fixes and Environment Variable Configuration
- Tests login flow
- Tests POS API proxied endpoints (categories, tables)
- Verifies environment variables are loaded correctly
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
TEST_EMAIL = "manager@hyattcandolim.com"
TEST_PASSWORD = "Qplazm@10"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token from login endpoint"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestAuthEndpoint:
    """Test /api/auth/login - verifies POS_API_BASE_URL env var works"""
    
    def test_login_success(self, api_client):
        """Test successful login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        # Status assertion
        assert response.status_code == 200
        
        # Data assertions
        data = response.json()
        assert "token" in data
        assert data["token"] is not None
        assert len(data["token"]) > 0
        assert "role_name" in data
        assert data["role_name"] == "Manager"
        assert "role" in data
        assert isinstance(data["role"], list)
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401


class TestMenuCategoriesEndpoint:
    """Test /api/menu/categories - verifies POS_API_V2_URL env var works"""
    
    def test_categories_requires_auth(self, api_client):
        """Test categories endpoint requires authorization"""
        response = api_client.get(f"{BASE_URL}/api/menu/categories")
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_categories_returns_data(self, api_client, auth_token):
        """Test categories returns data when authenticated"""
        response = api_client.get(
            f"{BASE_URL}/api/menu/categories",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Status assertion
        assert response.status_code == 200
        
        # Data assertions
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Validate structure of first category
        first_category = data[0]
        assert "id" in first_category
        assert "name" in first_category
        assert "image" in first_category


class TestTablesEndpoint:
    """Test /api/tables - verifies POS_API_V2_URL env var works"""
    
    def test_tables_requires_auth(self, api_client):
        """Test tables endpoint requires authorization"""
        response = api_client.get(f"{BASE_URL}/api/tables")
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_tables_returns_data(self, api_client, auth_token):
        """Test tables returns data when authenticated"""
        response = api_client.get(
            f"{BASE_URL}/api/tables",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Status assertion
        assert response.status_code == 200
        
        # Data assertions
        data = response.json()
        assert "tables" in data
        assert "source" in data
        assert data["source"] == "pos"
        
        tables = data["tables"]
        assert isinstance(tables, list)
        assert len(tables) > 0
        
        # Validate structure of first table
        first_table = tables[0]
        assert "id" in first_table
        assert "table_no" in first_table


class TestMenuItemsEndpoint:
    """Test /api/menu/items - verifies menu items load correctly"""
    
    def test_menu_items_requires_auth(self, api_client):
        """Test menu items endpoint requires authorization"""
        response = api_client.get(f"{BASE_URL}/api/menu/items")
        
        assert response.status_code == 401
    
    def test_menu_items_returns_data(self, api_client, auth_token):
        """Test menu items returns data when authenticated"""
        response = api_client.get(
            f"{BASE_URL}/api/menu/items",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Status assertion
        assert response.status_code == 200
        
        # Data assertions
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Validate structure of first item
        first_item = data[0]
        assert "id" in first_item
        assert "name" in first_item
        assert "price" in first_item
        assert "category" in first_item


class TestRootEndpoint:
    """Test root API endpoint"""
    
    def test_api_root(self, api_client):
        """Test API root returns ready message"""
        response = api_client.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Kiosk API Ready"
