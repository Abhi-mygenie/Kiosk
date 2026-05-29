import React, { createContext, useContext, useState, useCallback } from 'react';
import { readString, safeMenuSettings } from '@/utils/safeRead';

const MenuSettingsContext = createContext();

const STORAGE_KEY = 'kiosk_menu_settings';

export const MenuSettingsProvider = ({ children }) => {
  // safeMenuSettings returns either null OR a fully-shaped object with all 4
  // fields validated as the correct type. Downstream applySettings can rely
  // on this and no longer needs per-field defensive coding.
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? safeMenuSettings(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  });

  // Whether the user has completed/skipped the settings step
  const [settingsComplete, setSettingsComplete] = useState(() => {
    return readString('kiosk_settings_complete') === 'true';
  });

  const saveSettings = useCallback((categoryOrder, itemOrder, hiddenCategories, hiddenItems) => {
    const newSettings = { categoryOrder, itemOrder, hiddenCategories, hiddenItems };
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    localStorage.setItem('kiosk_settings_complete', 'true');
    setSettingsComplete(true);
  }, []);

  const skipSettings = useCallback(() => {
    localStorage.setItem('kiosk_settings_complete', 'true');
    setSettingsComplete(true);
  }, []);

  const clearSettings = useCallback(() => {
    setSettings(null);
    setSettingsComplete(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('kiosk_settings_complete');
  }, []);

  // Reset only the complete flag (keep saved settings data for pre-loading)
  const resetComplete = useCallback(() => {
    setSettingsComplete(false);
    localStorage.removeItem('kiosk_settings_complete');
  }, []);

  // Apply settings to categories and items.
  // Defensive: if upstream ever passes a non-array (shouldn't happen now that
  // AuthContext.safeMenuData guards it, but the kiosk crashed once because
  // of exactly this) we coerce to [] rather than throw.
  const applySettings = useCallback((categories, menuItems) => {
    const cats = Array.isArray(categories) ? categories : [];
    const items = Array.isArray(menuItems) ? menuItems : [];

    if (!settings) return { categories: cats, menuItems: items };

    const { categoryOrder, itemOrder, hiddenCategories, hiddenItems } = settings;

    // Filter hidden categories
    let filteredCategories = cats.filter(c => !hiddenCategories?.includes(c.id));

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
    let filteredItems = items.filter(i => !hiddenItems?.includes(i.id));
    // Also filter items from hidden categories
    filteredItems = filteredItems.filter(i => !hiddenCategories?.includes(i.category));

    // Reorder items within each category
    if (itemOrder) {
      const sortedItems = [];
      filteredCategories.forEach(cat => {
        const catItems = filteredItems.filter(i => i.category === cat.id);
        const catOrder = itemOrder[cat.id];
        if (Array.isArray(catOrder)) {
          catItems.sort((a, b) => {
            const idxA = catOrder.indexOf(a.id);
            const idxB = catOrder.indexOf(b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
        }
        sortedItems.push(...catItems);
      });
      filteredItems = sortedItems;
    }

    return { categories: filteredCategories, menuItems: filteredItems };
  }, [settings]);

  return (
    <MenuSettingsContext.Provider value={{
      settings,
      settingsComplete,
      saveSettings,
      skipSettings,
      clearSettings,
      resetComplete,
      applySettings
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
