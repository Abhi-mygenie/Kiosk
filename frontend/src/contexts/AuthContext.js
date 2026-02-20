import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const login = async (username, password) => {
    // TODO: Replace with actual POS API call
    // For now, mock authentication
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock validation - accept any non-empty credentials for now
        if (username && password) {
          const userData = {
            username,
            loginTime: new Date().toISOString(),
            // Will be populated from POS API later:
            // outletId, outletName, permissions, etc.
          };
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('kiosk_user', JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error('Username and password are required'));
        }
      }, 800); // Simulate API delay
    });
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
