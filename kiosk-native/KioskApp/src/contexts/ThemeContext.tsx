import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Default branding matching current UI - used when no API branding is available
export const defaultBranding = {
  restaurant_name: 'Hotel Lumiere',
  logo_url: null,
  primary_color: '#177DAA',
  secondary_color: '#62B5E5',
  accent_color: '#62B5E5',
  text_color: '#06293F',
  background_color: '#F9F8F6',
  heading_font: 'Big Shoulders Display',
  body_font: 'Montserrat',
  button_style: 'rounded',
  icon_style: 'outline',
  border_radius: 8,
  splash_screen_image: null,
  app_icon: null,
  loader_type: 'spinner',
  loader_color: '#177DAA',
};

export interface BrandingConfig {
  restaurant_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  heading_font: string;
  body_font: string;
  button_style: string;
  icon_style: string;
  border_radius: number;
  splash_screen_image: string | null;
  app_icon: string | null;
  loader_type: string;
  loader_color: string;
}

interface ThemeContextType {
  branding: BrandingConfig;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    muted: string;
    border: string;
    card: string;
    success: string;
    error: string;
    warning: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { branding: cachedBranding } = useAuth();
  const [currentBranding, setCurrentBranding] = useState<BrandingConfig>(defaultBranding);

  // Apply branding when cached branding changes (from login) or on mount
  useEffect(() => {
    // Use cached branding from AuthContext if available, otherwise use defaults
    const brandingToApply = cachedBranding 
      ? { ...defaultBranding, ...cachedBranding }
      : defaultBranding;
    
    setCurrentBranding(brandingToApply);
  }, [cachedBranding]);

  // Derived colors for easy use in components
  const colors = {
    primary: currentBranding.primary_color,
    secondary: currentBranding.secondary_color,
    accent: currentBranding.accent_color,
    text: currentBranding.text_color,
    background: currentBranding.background_color,
    muted: '#6B7280',
    border: '#E5E7EB',
    card: '#FFFFFF',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  };

  return (
    <ThemeContext.Provider value={{ branding: currentBranding, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
