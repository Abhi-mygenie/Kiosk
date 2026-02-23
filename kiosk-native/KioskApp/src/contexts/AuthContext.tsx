import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, menuAPI, tablesAPI, brandingAPI } from '../services/api';

interface MenuData {
  categories: any[];
  menuItems: any[];
  tables: any[];
}

interface LoginStep {
  step: string;
  status: 'pending' | 'loading' | 'done';
}

interface LoginProgress {
  isLoggingIn: boolean;
  currentStep: string;
  steps: LoginStep[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  menuData: MenuData;
  branding: any | null;
  loginProgress: LoginProgress;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMenuData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuData>({
    categories: [],
    menuItems: [],
    tables: [],
  });
  const [branding, setBranding] = useState<any | null>(null);
  const [loginProgress, setLoginProgress] = useState<LoginProgress>({
    isLoggingIn: false,
    currentStep: '',
    steps: [],
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('pos_token');
      const storedMenuData = await AsyncStorage.getItem('menu_data');
      const storedBranding = await AsyncStorage.getItem('branding_data');
      
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
        
        // Restore cached menu data
        if (storedMenuData) {
          setMenuData(JSON.parse(storedMenuData));
        }
        
        // Restore cached branding
        if (storedBranding) {
          setBranding(JSON.parse(storedBranding));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update login progress
  const updateProgress = (step: string, status: 'pending' | 'loading' | 'done') => {
    setLoginProgress(prev => ({
      ...prev,
      currentStep: step,
      steps: [...prev.steps.filter(s => s.step !== step), { step, status }],
    }));
  };

  const login = async (email: string, password: string) => {
    try {
      setLoginProgress({ isLoggingIn: true, currentStep: 'Authenticating...', steps: [] });

      // Step 1: Authenticate
      updateProgress('Authenticating', 'loading');
      const response = await authAPI.login(email, password);
      const newToken = response.token;
      updateProgress('Authenticating', 'done');
      
      // Temporarily set token for API calls
      await AsyncStorage.setItem('pos_token', newToken);

      // Step 2: Fetch branding
      updateProgress('Loading Theme', 'loading');
      let fetchedBranding = null;
      try {
        fetchedBranding = await brandingAPI.getConfig();
      } catch (e) {
        console.warn('Failed to fetch branding, using defaults');
      }
      updateProgress('Loading Theme', 'done');

      // Step 3: Fetch categories
      updateProgress('Loading Categories', 'loading');
      const categories = await menuAPI.getCategories();
      updateProgress('Loading Categories', 'done');

      // Step 4: Fetch menu items
      updateProgress('Loading Menu Items', 'loading');
      const menuItems = await menuAPI.getItems();
      updateProgress('Loading Menu Items', 'done');

      // Step 5: Fetch tables
      updateProgress('Loading Tables', 'loading');
      const tablesResponse = await tablesAPI.getTables();
      updateProgress('Loading Tables', 'done');

      const fetchedMenuData: MenuData = {
        categories,
        menuItems,
        tables: tablesResponse.tables || [],
      };

      // Step 6: Store everything
      updateProgress('Finalizing', 'loading');
      await AsyncStorage.setItem('menu_data', JSON.stringify(fetchedMenuData));
      if (fetchedBranding) {
        await AsyncStorage.setItem('branding_data', JSON.stringify(fetchedBranding));
      }
      
      setToken(newToken);
      setMenuData(fetchedMenuData);
      setBranding(fetchedBranding);
      setIsAuthenticated(true);
      updateProgress('Finalizing', 'done');

      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLoginProgress({ isLoggingIn: false, currentStep: '', steps: [] });
    } catch (error) {
      setLoginProgress({ isLoggingIn: false, currentStep: '', steps: [] });
      throw error;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('pos_token');
    await AsyncStorage.removeItem('menu_data');
    await AsyncStorage.removeItem('branding_data');
    setToken(null);
    setMenuData({ categories: [], menuItems: [], tables: [] });
    setBranding(null);
    setIsAuthenticated(false);
  };

  const refreshMenuData = async () => {
    if (!token) return;
    
    const [categories, menuItems, tablesResponse] = await Promise.all([
      menuAPI.getCategories(),
      menuAPI.getItems(),
      tablesAPI.getTables(),
    ]);

    const fetchedMenuData: MenuData = {
      categories,
      menuItems,
      tables: tablesResponse.tables || [],
    };
    
    setMenuData(fetchedMenuData);
    await AsyncStorage.setItem('menu_data', JSON.stringify(fetchedMenuData));
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      token, 
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
