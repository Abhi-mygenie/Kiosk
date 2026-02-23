import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ThemeProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    primary_color: '#1A1A1A',
    accent_color: '#C5A059',
    restaurant_name: 'Hotel Lumiere'
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await axios.get(`${API}/config/branding`);
        setBranding(response.data);
        
        // Apply dynamic colors to CSS variables
        const root = document.documentElement;
        // Convert hex to HSL for CSS variables
        const primaryHsl = hexToHSL(response.data.primary_color);
        const accentHsl = hexToHSL(response.data.accent_color);
        
        root.style.setProperty('--primary', primaryHsl);
        root.style.setProperty('--accent', accentHsl);
      } catch (error) {
        console.error('Failed to fetch branding:', error);
      }
    };

    fetchBranding();
  }, []);

  const hexToHSL = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };

  return (
    <ThemeContext.Provider value={{ branding }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};