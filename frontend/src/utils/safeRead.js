/**
 * Safe-read helpers for browser storage.
 *
 * Every value returned has the requested shape, or a safe default.
 * No throw will ever escape these helpers — corrupt JSON, wrong type,
 * or missing key all collapse to the default.
 *
 * Closes audit findings: FE-2 (localStorage shape never validated).
 * See: /app/memory/CRASH_AUDIT.md
 */

/**
 * Read a localStorage value, parse JSON, return it only if it's an Array.
 * Otherwise returns `defaultValue` (default: empty array).
 */
export const readArray = (key, defaultValue = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Read a localStorage value, parse JSON, return it only if it's a non-null,
 * non-array object. Otherwise returns `defaultValue` (default: null).
 */
export const readObject = (key, defaultValue = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Read a localStorage value as a plain string. Returns defaultValue if
 * the key is missing or storage access throws.
 */
export const readString = (key, defaultValue = '') => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? defaultValue : String(raw);
  } catch {
    return defaultValue;
  }
};

/**
 * Validate that an object looks like the kiosk menuData shape.
 * Returns the input if valid, otherwise the safe empty shape.
 */
export const safeMenuData = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { categories: [], menuItems: [], tables: [] };
  }
  return {
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    menuItems: Array.isArray(raw.menuItems) ? raw.menuItems : [],
    tables: Array.isArray(raw.tables) ? raw.tables : [],
  };
};

/**
 * Validate that an object looks like the menu-settings shape.
 * Any missing/invalid field becomes a safe default — never throws,
 * never propagates an unsafe shape into applySettings.
 */
export const safeMenuSettings = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return {
    categoryOrder: Array.isArray(raw.categoryOrder) ? raw.categoryOrder : [],
    itemOrder:
      raw.itemOrder && typeof raw.itemOrder === 'object' && !Array.isArray(raw.itemOrder)
        ? raw.itemOrder
        : {},
    hiddenCategories: Array.isArray(raw.hiddenCategories) ? raw.hiddenCategories : [],
    hiddenItems: Array.isArray(raw.hiddenItems) ? raw.hiddenItems : [],
  };
};

/**
 * Validate that shifts looks like an array of well-formed shift objects.
 * Drops malformed shifts silently rather than crashing getCurrentPrepTime.
 */
export const safeShifts = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s) =>
      s &&
      typeof s === 'object' &&
      typeof s.start === 'string' &&
      typeof s.end === 'string' &&
      /^\d{1,2}:\d{2}$/.test(s.start) &&
      /^\d{1,2}:\d{2}$/.test(s.end)
  );
};

/**
 * Convenience: wipe every `kiosk_*` key from localStorage AND sessionStorage.
 * Used by ErrorBoundary's "Reset Kiosk" fallback.
 */
export const clearKioskStorage = () => {
  try {
    const lsKeys = Object.keys(localStorage).filter((k) => k.startsWith('kiosk_'));
    lsKeys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  try {
    const ssKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('kiosk_'));
    ssKeys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
};
