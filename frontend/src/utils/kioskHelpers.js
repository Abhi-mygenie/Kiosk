import axios from 'axios';

// Treat price of 1 as 0 (complimentary item indicator)
export const normalizePrice = (price) => {
  return price === 1 ? 0 : price;
};

// Create axios instance with auth interceptor
export const createAuthAxios = (token) => {
  const instance = axios.create();
  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
};
