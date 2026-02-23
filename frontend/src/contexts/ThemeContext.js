import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Convert hex to HSL string for CSS variables
const hexToHSL = (hex) => {
  if (!hex) return '0 0% 0%';
  hex = hex.replace('#', '');
  
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

// Default branding matching current UI
const defaultBranding = {
  restaurant_name: 'Hotel Lumiere',
  logo_url: null,
  primary_color: '#177DAA',
  secondary_color: '#62B5E5',
  accent_color: '#62B5E5',
  text_color: '#06293F',
  background_color: '#F9F8F6',
  heading_font: 'Big Shoulders Display',
  body_font: 'Montserrat',
  font_url: 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap',
  button_style: 'rounded',
  icon_style: 'outline',
  border_radius: '8px',
  splash_screen_image: null,
  app_icon: null,
  favicon: null,
  loader_type: 'spinner',
  loader_color: '#177DAA'
};

export const ThemeProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultBranding);
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply branding to CSS variables
  const applyBranding = (brandingData) => {
    const root = document.documentElement;
    
    // Colors
    root.style.setProperty('--primary', hexToHSL(brandingData.primary_color));
    root.style.setProperty('--secondary', hexToHSL(brandingData.secondary_color));
    root.style.setProperty('--accent', hexToHSL(brandingData.accent_color));
    root.style.setProperty('--foreground', hexToHSL(brandingData.text_color));
    root.style.setProperty('--background', hexToHSL(brandingData.background_color));
    
    // Also set the brand color variables
    root.style.setProperty('--blue-medium', brandingData.primary_color);
    root.style.setProperty('--blue-hero', brandingData.secondary_color);
    
    // Border radius
    if (brandingData.border_radius) {
      root.style.setProperty('--radius', brandingData.border_radius);
    }
    
    // Fonts - update CSS variables for font families
    root.style.setProperty('--font-heading', brandingData.heading_font);
    root.style.setProperty('--font-body', brandingData.body_font);
    
    // Dynamically load font URL if provided and different from current
    if (brandingData.font_url) {
      const existingLink = document.getElementById('dynamic-fonts');
      if (!existingLink) {
        const link = document.createElement('link');
        link.id = 'dynamic-fonts';
        link.rel = 'stylesheet';
        link.href = brandingData.font_url;
        document.head.appendChild(link);
      } else if (existingLink.href !== brandingData.font_url) {
        existingLink.href = brandingData.font_url;
      }
    }
    
    // Favicon
    if (brandingData.favicon) {
      const faviconLink = document.querySelector("link[rel~='icon']");
      if (faviconLink) {
        faviconLink.href = brandingData.favicon;
      }
    }
    
    // Button style - set data attribute for CSS targeting
    root.setAttribute('data-button-style', brandingData.button_style);
    root.setAttribute('data-icon-style', brandingData.icon_style);
  };

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await axios.get(`${API}/config/branding`);
        const brandingData = { ...defaultBranding, ...response.data };
        setBranding(brandingData);
        applyBranding(brandingData);
      } catch (error) {
        console.error('Failed to fetch branding:', error);
        // Apply defaults if API fails
        applyBranding(defaultBranding);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchBranding();
  }, []);

  return (
    <ThemeContext.Provider value={{ branding, isLoaded }}>
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
