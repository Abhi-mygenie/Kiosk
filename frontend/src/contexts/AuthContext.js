import React, { createContext, useContext, useState, useEffect } from 'react';
import { readObject, safeMenuData } from '@/utils/safeRead';
import { createAuthAxios, publicAxios } from '@/utils/kioskHelpers';

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

  // Check for existing session on mount.
  // Uses safeRead helpers so a poisoned localStorage value never crashes
  // the boot — at worst the kiosk falls back to a logged-out empty state.
  useEffect(() => {
    const storedUser = readObject('kiosk_user');
    const storedMenuData = readObject('kiosk_menu_data');
    const storedBranding = readObject('kiosk_branding');

    if (storedUser && typeof storedUser.token === 'string') {
      setUser(storedUser);
      setIsAuthenticated(true);

      // safeMenuData guarantees categories/menuItems/tables are arrays.
      // If the stored shape is garbage, this returns the empty shape rather
      // than crashing any downstream .map / .filter.
      setMenuData(safeMenuData(storedMenuData));

      if (storedBranding) {
        setBranding(storedBranding);
      }
    } else if (storedUser) {
      // Token shape invalid — purge so next launch is clean
      localStorage.removeItem('kiosk_user');
      localStorage.removeItem('kiosk_menu_data');
      localStorage.removeItem('kiosk_branding');
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
      
      // Step 1: Authenticate (publicAxios enforces JSON content-type)
      updateProgress('Authenticating', 'loading');
      const response = await publicAxios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      updateProgress('Authenticating', 'done');

      const data = response.data;
      if (!data || typeof data.token !== 'string' || !data.token) {
        throw new Error('Login succeeded but response is missing a valid token');
      }
      const userData = {
        email,
        token: data.token,
        roleName: data.role_name,
        roles: data.role || [],
        loginTime: new Date().toISOString()
      };

      // Authenticated axios with both Bearer header AND JSON-only response guard.
      const authAxios = createAuthAxios(data.token);

      // Step 2: Fetch branding (optional — fallback to null on any failure)
      updateProgress('Loading Theme', 'loading');
      let fetchedBranding = null;
      try {
        const brandingRes = await publicAxios.get(`${API_URL}/api/config/branding`);
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

      // Shape-validate everything before committing to state.
      // safeMenuData guarantees three arrays; the JSON interceptor already
      // rejected anything that isn't application/json — so any wrong shape
      // here is a backend schema bug, not a transport bug.
      const fetchedMenuData = safeMenuData({
        categories: catRes.data,
        menuItems: itemsRes.data,
        tables: tablesRes.data?.tables,
      });

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
      if (error.isNonJsonApiResponse) {
        throw new Error('Backend returned an unexpected response. Please contact support.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 503) {
        throw new Error('Unable to connect to server. Please try again.');
      } else {
        throw new Error(error.response?.data?.detail || error.message || 'Login failed. Please try again.');
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
    const authAxios = createAuthAxios(user.token);

    try {
      const [catRes, itemsRes, tablesRes] = await Promise.all([
        authAxios.get(`${API_URL}/api/menu/categories`),
        authAxios.get(`${API_URL}/api/menu/items`),
        authAxios.get(`${API_URL}/api/tables`)
      ]);

      const fetchedMenuData = safeMenuData({
        categories: catRes.data,
        menuItems: itemsRes.data,
        tables: tablesRes.data?.tables,
      });

      setMenuData(fetchedMenuData);
      localStorage.setItem('kiosk_menu_data', JSON.stringify(fetchedMenuData));
    } catch (e) {
      // Leave previous menuData in place — better stale than empty mid-shift
      console.warn('refreshMenuData failed:', e?.message || e);
    }
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
