import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('kiosk_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('kiosk_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
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

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('kiosk_user', JSON.stringify(userData));
      
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
    setIsAuthenticated(false);
    localStorage.removeItem('kiosk_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout
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
