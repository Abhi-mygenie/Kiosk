// MenuSettingsContext - Menu ordering and visibility settings (AsyncStorage)
import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MenuSettingsContext = createContext();

const STORAGE_KEY = 'kiosk_menu_settings';
const COMPLETE_KEY = 'kiosk_settings_complete';

export const MenuSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [settingsComplete, setSettingsComplete] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load settings from AsyncStorage on mount
  const initialize = useCallback(async () => {
    if (initialized) return;
    try {
      const [storedSettings, storedComplete] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(COMPLETE_KEY),
      ]);
      if (storedSettings) setSettings(JSON.parse(storedSettings));
      if (storedComplete === 'true') setSettingsComplete(true);
    } catch {
      // ignore
    }
    setInitialized(true);
  }, [initialized]);

  // Call initialize on first render
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  const saveSettings = useCallback(async (categoryOrder, itemOrder, hiddenCategories, hiddenItems) => {
    const newSettings = { categoryOrder, itemOrder, hiddenCategories, hiddenItems };
    setSettings(newSettings);
    setSettingsComplete(true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    await AsyncStorage.setItem(COMPLETE_KEY, 'true');
  }, []);

  const skipSettings = useCallback(async () => {
    setSettingsComplete(true);
    await AsyncStorage.setItem(COMPLETE_KEY, 'true');
  }, []);

  const clearSettings = useCallback(async () => {
    setSettings(null);
    setSettingsComplete(false);
    await AsyncStorage.multiRemove([STORAGE_KEY, COMPLETE_KEY]);
  }, []);

  // Reset only the complete flag (keep saved settings data for pre-loading)
  const resetComplete = useCallback(async () => {
    setSettingsComplete(false);
    await AsyncStorage.removeItem(COMPLETE_KEY);
  }, []);

  // Apply settings to categories and items
  const applySettings = useCallback((categories, menuItems) => {
    if (!settings) return { categories, menuItems };

    const { categoryOrder, itemOrder, hiddenCategories, hiddenItems } = settings;

    // Filter hidden categories
    let filteredCategories = categories.filter(c => !hiddenCategories?.includes(c.id));

    // Reorder categories
    if (categoryOrder?.length) {
      filteredCategories.sort((a, b) => {
        const idxA = categoryOrder.indexOf(a.id);
        const idxB = categoryOrder.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    // Filter hidden items
    let filteredItems = menuItems.filter(i => !hiddenItems?.includes(i.id));
    // Also filter items from hidden categories
    filteredItems = filteredItems.filter(i => !hiddenCategories?.includes(i.category));

    // Reorder items within each category
    if (itemOrder) {
      filteredItems.sort((a, b) => {
        if (a.category !== b.category) return 0;
        const catOrder = itemOrder[a.category];
        if (!catOrder) return 0;
        const idxA = catOrder.indexOf(a.id);
        const idxB = catOrder.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    return { categories: filteredCategories, menuItems: filteredItems };
  }, [settings]);

  return (
    <MenuSettingsContext.Provider
      value={{
        settings,
        settingsComplete,
        saveSettings,
        skipSettings,
        clearSettings,
        resetComplete,
        applySettings,
      }}>
      {children}
    </MenuSettingsContext.Provider>
  );
};

export const useMenuSettings = () => {
  const context = useContext(MenuSettingsContext);
  if (!context) {
    throw new Error('useMenuSettings must be used within MenuSettingsProvider');
  }
  return context;
};

export default MenuSettingsContext;
