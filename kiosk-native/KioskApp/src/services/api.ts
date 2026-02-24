import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - same as web version
const API_BASE_URL = 'https://kiosk-ordering.preview.emergentagent.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Menu API
export const menuAPI = {
  getCategories: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  },
  getItems: async (category?: string) => {
    const params = category ? { category } : {};
    const response = await api.get('/menu/items', { params });
    return response.data;
  },
};

// Tables API
export const tablesAPI = {
  getTables: async () => {
    const response = await api.get('/tables');
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  createOrder: async (orderData: any) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
};

// Branding API
export const brandingAPI = {
  getConfig: async () => {
    const response = await api.get('/config/branding');
    return response.data;
  },
};

export default api;
