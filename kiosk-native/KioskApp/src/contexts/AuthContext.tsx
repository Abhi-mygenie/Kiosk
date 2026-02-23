import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, menuAPI, tablesAPI } from '../services/api';

interface MenuData {
  categories: any[];
  menuItems: any[];
  tables: any[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  menuData: MenuData;
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('pos_token');
      const storedMenuData = await AsyncStorage.getItem('menu_data');
      
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
        
        // Restore cached menu data
        if (storedMenuData) {
          setMenuData(JSON.parse(storedMenuData));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuData = async (authToken: string): Promise<MenuData> => {
    // Temporarily set token for API calls
    await AsyncStorage.setItem('pos_token', authToken);
    
    const [categories, menuItems, tablesResponse] = await Promise.all([
      menuAPI.getCategories(),
      menuAPI.getItems(),
      tablesAPI.getTables(),
    ]);

    return {
      categories,
      menuItems,
      tables: tablesResponse.tables || [],
    };
  };

  const login = async (email: string, password: string) => {
    // Step 1: Authenticate
    const response = await authAPI.login(email, password);
    const newToken = response.token;
    
    // Step 2: Fetch and cache menu data immediately after login
    const fetchedMenuData = await fetchMenuData(newToken);
    
    // Step 3: Store everything
    await AsyncStorage.setItem('pos_token', newToken);
    await AsyncStorage.setItem('menu_data', JSON.stringify(fetchedMenuData));
    
    setToken(newToken);
    setMenuData(fetchedMenuData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('pos_token');
    await AsyncStorage.removeItem('menu_data');
    setToken(null);
    setMenuData({ categories: [], menuItems: [], tables: [] });
    setIsAuthenticated(false);
  };

  const refreshMenuData = async () => {
    if (!token) return;
    const fetchedMenuData = await fetchMenuData(token);
    setMenuData(fetchedMenuData);
    await AsyncStorage.setItem('menu_data', JSON.stringify(fetchedMenuData));
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      token, 
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
