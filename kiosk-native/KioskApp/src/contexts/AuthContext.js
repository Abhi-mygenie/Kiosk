// AuthContext - Authentication state management
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';
import { API_URL, createAuthClient } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cached menu data - fetched once at login
  const [menuData, setMenuData] = useState({
    categories: [],
    menuItems: [],
    tables: [],
  });

  // Cached branding - fetched once at login
  const [branding, setBranding] = useState(null);

  // Login progress tracking
  const [loginProgress, setLoginProgress] = useState({
    isLoggingIn: false,
    currentStep: '',
    steps: [],
  });

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const storedUser = await storage.getUser();
      const storedMenuData = await storage.getMenuData();
      const storedBranding = await storage.getBranding();

      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);

        if (storedMenuData) {
          setMenuData(storedMenuData);
        }

        if (storedBranding) {
          setBranding(storedBranding);
        }
      }
    } catch (e) {
      console.error('Error checking session:', e);
      await storage.clearAll();
    } finally {
      setIsLoading(false);
    }
  };

  // Update login progress
  const updateProgress = (step, status) => {
    setLoginProgress(prev => ({
      ...prev,
      currentStep: step,
      steps: [...prev.steps.filter(s => s.step !== step), { step, status }],
    }));
  };

  const login = async (email, password) => {
    try {
      setLoginProgress({ isLoggingIn: true, currentStep: 'Authenticating...', steps: [] });

      // Step 1: Authenticate
      updateProgress('Authenticating', 'loading');
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      updateProgress('Authenticating', 'done');

      const data = response.data;
      const userData = {
        email,
        token: data.token,
        roleName: data.role_name,
        roles: data.role || [],
        loginTime: new Date().toISOString(),
      };

      const authAxios = createAuthClient(data.token);

      // Step 2: Fetch branding
      updateProgress('Loading Theme', 'loading');
      let fetchedBranding = null;
      try {
        const brandingRes = await axios.get(`${API_URL}/config/branding`);
        fetchedBranding = brandingRes.data;
      } catch (e) {
        console.warn('Failed to fetch branding, using defaults');
      }
      updateProgress('Loading Theme', 'done');

      // Step 3: Fetch categories
      updateProgress('Loading Categories', 'loading');
      const catRes = await authAxios.get(`${API_URL}/menu/categories`);
      updateProgress('Loading Categories', 'done');

      // Step 4: Fetch menu items
      updateProgress('Loading Menu Items', 'loading');
      const itemsRes = await authAxios.get(`${API_URL}/menu/items`);
      updateProgress('Loading Menu Items', 'done');

      // Step 5: Fetch tables
      updateProgress('Loading Tables', 'loading');
      const tablesRes = await authAxios.get(`${API_URL}/tables`);
      updateProgress('Loading Tables', 'done');

      const fetchedMenuData = {
        categories: catRes.data,
        menuItems: itemsRes.data,
        tables: tablesRes.data.tables || [],
      };

      // Step 6: Store everything
      updateProgress('Finalizing', 'loading');
      setUser(userData);
      setMenuData(fetchedMenuData);
      setBranding(fetchedBranding);
      setIsAuthenticated(true);

      await storage.setUser(userData);
      await storage.setMenuData(fetchedMenuData);
      if (fetchedBranding) {
        await storage.setBranding(fetchedBranding);
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

  const logout = async () => {
    setUser(null);
    setMenuData({ categories: [], menuItems: [], tables: [] });
    setBranding(null);
    setIsAuthenticated(false);
    await storage.clearAll();
  };

  // Function to refresh menu data (manual refresh if needed)
  const refreshMenuData = async () => {
    if (!user?.token) return;
    const authAxios = createAuthClient(user.token);

    const [catRes, itemsRes, tablesRes] = await Promise.all([
      authAxios.get(`${API_URL}/menu/categories`),
      authAxios.get(`${API_URL}/menu/items`),
      authAxios.get(`${API_URL}/tables`),
    ]);

    const fetchedMenuData = {
      categories: catRes.data,
      menuItems: itemsRes.data,
      tables: tablesRes.data.tables || [],
    };

    setMenuData(fetchedMenuData);
    await storage.setMenuData(fetchedMenuData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        menuData,
        branding,
        loginProgress,
        login,
        logout,
        refreshMenuData,
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

export default AuthContext;
