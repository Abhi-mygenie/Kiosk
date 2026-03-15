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
  
  // Cached branding - fetched once at login
  const [branding, setBranding] = useState(null);
  
  // Login progress tracking
  const [loginProgress, setLoginProgress] = useState({
    isLoggingIn: false,
    currentStep: '',
    steps: []
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('kiosk_user');
    const storedMenuData = localStorage.getItem('kiosk_menu_data');
    const storedBranding = localStorage.getItem('kiosk_branding');
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Restore cached menu data
        if (storedMenuData) {
          setMenuData(JSON.parse(storedMenuData));
        }
        
        // Restore cached branding
        if (storedBranding) {
          setBranding(JSON.parse(storedBranding));
        }
      } catch (e) {
        localStorage.removeItem('kiosk_user');
        localStorage.removeItem('kiosk_menu_data');
        localStorage.removeItem('kiosk_branding');
      }
    }
    setIsLoading(false);
  }, []);

  // Update login progress
  const updateProgress = (step, status) => {
    setLoginProgress(prev => ({
      ...prev,
      currentStep: step,
      steps: [...prev.steps.filter(s => s.step !== step), { step, status }]
    }));
  };

  const login = async (email, password) => {
    try {
      setLoginProgress({ isLoggingIn: true, currentStep: 'Authenticating...', steps: [] });
      
      // Step 1: Authenticate
      updateProgress('Authenticating', 'loading');
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      updateProgress('Authenticating', 'done');

      const data = response.data;
      const userData = {
        email,
        token: data.token,
        roleName: data.role_name,
        roles: data.role || [],
        loginTime: new Date().toISOString()
      };

      const authAxios = axios.create({
        headers: { Authorization: `Bearer ${data.token}` }
      });

      // Step 2: Fetch branding
      updateProgress('Loading Theme', 'loading');
      let fetchedBranding = null;
      try {
        const brandingRes = await axios.get(`${API_URL}/api/config/branding`);
        fetchedBranding = brandingRes.data;
      } catch (e) {
        console.warn('Failed to fetch branding, using defaults');
      }
      updateProgress('Loading Theme', 'done');

      // Step 3: Fetch categories
      updateProgress('Loading Categories', 'loading');
      const catRes = await authAxios.get(`${API_URL}/api/menu/categories`);
      updateProgress('Loading Categories', 'done');

      // Step 4: Fetch menu items
      updateProgress('Loading Menu Items', 'loading');
      const itemsRes = await authAxios.get(`${API_URL}/api/menu/items`);
      updateProgress('Loading Menu Items', 'done');

      // Step 5: Fetch tables
      updateProgress('Loading Tables', 'loading');
      const tablesRes = await authAxios.get(`${API_URL}/api/tables`);
      updateProgress('Loading Tables', 'done');

      const fetchedMenuData = {
        categories: catRes.data,
        menuItems: itemsRes.data,
        tables: tablesRes.data.tables || []
      };

      // Step 6: Store everything
      updateProgress('Finalizing', 'loading');
      setUser(userData);
      setMenuData(fetchedMenuData);
      setBranding(fetchedBranding);
      setIsAuthenticated(true);
      
      localStorage.setItem('kiosk_user', JSON.stringify(userData));
      localStorage.setItem('kiosk_menu_data', JSON.stringify(fetchedMenuData));
      if (fetchedBranding) {
        localStorage.setItem('kiosk_branding', JSON.stringify(fetchedBranding));
      }
      updateProgress('Finalizing', 'done');
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLoginProgress({ isLoggingIn: false, currentStep: '', steps: [] });
      return userData;
    } catch (error) {
      setLoginProgress({ isLoggingIn: false, currentStep: '', steps: [] });
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
    setBranding(null);
    setIsAuthenticated(false);
    localStorage.removeItem('kiosk_user');
    localStorage.removeItem('kiosk_menu_data');
    localStorage.removeItem('kiosk_branding');
  };

  // Function to refresh menu data (manual refresh if needed)
  const refreshMenuData = async () => {
    if (!user?.token) return;
    const authAxios = axios.create({
      headers: { Authorization: `Bearer ${user.token}` }
    });
    
    const [catRes, itemsRes, tablesRes] = await Promise.all([
      authAxios.get(`${API_URL}/api/menu/categories`),
      authAxios.get(`${API_URL}/api/menu/items`),
      authAxios.get(`${API_URL}/api/tables`)
    ]);
    
    const fetchedMenuData = {
      categories: catRes.data,
      menuItems: itemsRes.data,
      tables: tablesRes.data.tables || []
    };
    
    setMenuData(fetchedMenuData);
    localStorage.setItem('kiosk_menu_data', JSON.stringify(fetchedMenuData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      menuData,
      branding,
      loginProgress,
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
