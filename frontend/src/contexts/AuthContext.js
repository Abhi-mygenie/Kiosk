import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext();

// Demo mode sample data
const DEMO_CATEGORIES = [
  { id: 'cat-1', name: 'Breakfast', description: 'Start your day right', image: null },
  { id: 'cat-2', name: 'Beverages', description: 'Hot & cold drinks', image: null },
  { id: 'cat-3', name: 'Snacks', description: 'Light bites', image: null },
  { id: 'cat-4', name: 'Main Course', description: 'Hearty meals', image: null }
];

const DEMO_MENU_ITEMS = [
  { id: 'item-1', name: 'Classic Eggs Benedict', price: 350, category: 'cat-1', description: 'Poached eggs on English muffin with hollandaise', image: 'https://images.unsplash.com/photo-1608039829572-56f46c0f3fcd?w=400', is_veg: false, allergens: ['Eggs', 'Gluten'], calories: 450, variations: [] },
  { id: 'item-2', name: 'Avocado Toast', price: 280, category: 'cat-1', description: 'Smashed avocado on sourdough with cherry tomatoes', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', is_veg: true, allergens: ['Gluten'], calories: 320, variations: [] },
  { id: 'item-3', name: 'Pancake Stack', price: 320, category: 'cat-1', description: 'Fluffy pancakes with maple syrup and berries', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', is_veg: true, allergens: ['Gluten', 'Dairy'], calories: 520, variations: [] },
  { id: 'item-4', name: 'Fresh Orange Juice', price: 150, category: 'cat-2', description: 'Freshly squeezed orange juice', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', is_veg: true, allergens: [], calories: 110, variations: [] },
  { id: 'item-5', name: 'Cappuccino', price: 180, category: 'cat-2', description: 'Italian espresso with steamed milk foam', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400', is_veg: true, allergens: ['Dairy'], calories: 80, variations: [] },
  { id: 'item-6', name: 'Green Smoothie', price: 220, category: 'cat-2', description: 'Spinach, banana, apple, and ginger', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400', is_veg: true, allergens: [], calories: 180, variations: [] },
  { id: 'item-7', name: 'Croissant', price: 120, category: 'cat-3', description: 'Buttery French pastry', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400', is_veg: true, allergens: ['Gluten', 'Dairy'], calories: 280, variations: [] },
  { id: 'item-8', name: 'Fruit Bowl', price: 250, category: 'cat-3', description: 'Seasonal fresh fruits with honey yogurt', image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400', is_veg: true, allergens: ['Dairy'], calories: 200, variations: [] },
  { id: 'item-9', name: 'Grilled Chicken Salad', price: 420, category: 'cat-4', description: 'Mixed greens with grilled chicken and vinaigrette', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', is_veg: false, allergens: [], calories: 380, variations: [] },
  { id: 'item-10', name: 'Vegetable Pasta', price: 380, category: 'cat-4', description: 'Penne with seasonal vegetables in tomato sauce', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', is_veg: true, allergens: ['Gluten'], calories: 450, variations: [] }
];

const DEMO_TABLES = [
  { id: 'table-1', table_number: '1', section: 'Poolside' },
  { id: 'table-2', table_number: '2', section: 'Poolside' },
  { id: 'table-3', table_number: '3', section: 'Garden' },
  { id: 'table-4', table_number: '4', section: 'Garden' },
  { id: 'table-5', table_number: '5', section: 'Indoor' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
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
    const storedDemoMode = localStorage.getItem('kiosk_demo_mode');
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        setIsDemoMode(storedDemoMode === 'true');
        
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
        localStorage.removeItem('kiosk_demo_mode');
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

  // Demo mode login - no real API calls, uses sample data
  const loginDemo = async () => {
    try {
      setLoginProgress({ isLoggingIn: true, currentStep: 'Starting Demo...', steps: [] });
      
      // Simulate loading steps with delays
      updateProgress('Authenticating', 'loading');
      await new Promise(resolve => setTimeout(resolve, 400));
      updateProgress('Authenticating', 'done');
      
      updateProgress('Loading Theme', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress('Loading Theme', 'done');
      
      updateProgress('Loading Categories', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress('Loading Categories', 'done');
      
      updateProgress('Loading Menu Items', 'loading');
      await new Promise(resolve => setTimeout(resolve, 400));
      updateProgress('Loading Menu Items', 'done');
      
      updateProgress('Loading Tables', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      updateProgress('Loading Tables', 'done');
      
      updateProgress('Finalizing', 'loading');
      
      const demoUserData = {
        email: 'demo@kiosk.local',
        token: 'demo-token-' + Date.now(),
        roleName: 'Demo User',
        roles: ['demo'],
        loginTime: new Date().toISOString(),
        isDemo: true
      };
      
      const demoMenuData = {
        categories: DEMO_CATEGORIES,
        menuItems: DEMO_MENU_ITEMS,
        tables: DEMO_TABLES
      };
      
      setUser(demoUserData);
      setMenuData(demoMenuData);
      setBranding(null);
      setIsAuthenticated(true);
      setIsDemoMode(true);
      
      localStorage.setItem('kiosk_user', JSON.stringify(demoUserData));
      localStorage.setItem('kiosk_menu_data', JSON.stringify(demoMenuData));
      localStorage.setItem('kiosk_demo_mode', 'true');
      
      updateProgress('Finalizing', 'done');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLoginProgress({ isLoggingIn: false, currentStep: '', steps: [] });
      return demoUserData;
    } catch (error) {
      setLoginProgress({ isLoggingIn: false, currentStep: '', steps: [] });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setMenuData({ categories: [], menuItems: [], tables: [] });
    setBranding(null);
    setIsAuthenticated(false);
    setIsDemoMode(false);
    localStorage.removeItem('kiosk_user');
    localStorage.removeItem('kiosk_menu_data');
    localStorage.removeItem('kiosk_branding');
    localStorage.removeItem('kiosk_demo_mode');
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
