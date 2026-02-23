import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cached menu data - fetched once at login
  const [menuData, setMenuData] = useState({
    categories: [],
    menuItems: [],
    tables: []
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('kiosk_user');
    const storedMenuData = localStorage.getItem('kiosk_menu_data');
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Restore cached menu data
        if (storedMenuData) {
          setMenuData(JSON.parse(storedMenuData));
        }
      } catch (e) {
        localStorage.removeItem('kiosk_user');
        localStorage.removeItem('kiosk_menu_data');
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch menu data with auth token
  const fetchMenuData = async (token) => {
    const authAxios = axios.create({
      headers: { Authorization: `Bearer ${token}` }
    });

    const [catRes, itemsRes, tablesRes] = await Promise.all([
      authAxios.get(`${API_URL}/api/menu/categories`),
      authAxios.get(`${API_URL}/api/menu/items`),
      authAxios.get(`${API_URL}/api/tables`)
    ]);

    return {
      categories: catRes.data,
      menuItems: itemsRes.data,
      tables: tablesRes.data.tables || []
    };
  };

  const login = async (email, password) => {
    try {
      // Step 1: Authenticate
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      const data = response.data;
      const userData = {
        email,
        token: data.token,
        roleName: data.role_name,
        roles: data.role || [],
        loginTime: new Date().toISOString()
      };

      // Step 2: Fetch and cache menu data immediately after login
      const fetchedMenuData = await fetchMenuData(data.token);

      // Step 3: Store everything
      setUser(userData);
      setMenuData(fetchedMenuData);
      setIsAuthenticated(true);
      
      localStorage.setItem('kiosk_user', JSON.stringify(userData));
      localStorage.setItem('kiosk_menu_data', JSON.stringify(fetchedMenuData));
      
      return userData;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 503) {
        throw new Error('Unable to connect to server. Please try again.');
      } else {
        throw new Error(error.response?.data?.detail || 'Login failed. Please try again.');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setMenuData({ categories: [], menuItems: [], tables: [] });
    setIsAuthenticated(false);
    localStorage.removeItem('kiosk_user');
    localStorage.removeItem('kiosk_menu_data');
  };

  // Function to refresh menu data (manual refresh if needed)
  const refreshMenuData = async () => {
    if (!user?.token) return;
    const fetchedMenuData = await fetchMenuData(user.token);
    setMenuData(fetchedMenuData);
    localStorage.setItem('kiosk_menu_data', JSON.stringify(fetchedMenuData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      menuData,
      login,
      logout,
      refreshMenuData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
