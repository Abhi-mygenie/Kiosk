// ThemeContext - For dynamic theming
import React, { createContext, useContext, useState } from 'react';
import { colors as defaultColors } from '../theme/colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [colors, setColors] = useState(defaultColors);

  // Update colors from branding config
  const updateTheme = brandingConfig => {
    if (brandingConfig) {
      setColors(prev => ({
        ...prev,
        blueHero: brandingConfig.primary_color || prev.blueHero,
        blueMedium: brandingConfig.secondary_color || prev.blueMedium,
        blueLight: brandingConfig.accent_color || prev.blueLight,
        textPrimary: brandingConfig.text_color || prev.textPrimary,
        background: brandingConfig.background_color || prev.background,
      }));
    }
  };

  const resetTheme = () => {
    setColors(defaultColors);
  };

  return (
    <ThemeContext.Provider value={{ colors, updateTheme, resetTheme }}>
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

export default ThemeContext;
