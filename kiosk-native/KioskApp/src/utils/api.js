// API Configuration
import axios from 'axios';

// API Base URL - Update this for production
export const API_BASE_URL = 'https://kiosk-android-dev.preview.emergentagent.com';
export const API_URL = `${API_BASE_URL}/api`;

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create authenticated axios instance
export const createAuthClient = (token) => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return instance;
};

export default apiClient;
