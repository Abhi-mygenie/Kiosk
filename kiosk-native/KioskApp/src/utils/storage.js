// Async Storage Utilities
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: 'kiosk_user',
  MENU_DATA: 'kiosk_menu_data',
  BRANDING: 'kiosk_branding',
};

export const storage = {
  // User
  async getUser() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error getting user:', e);
      return null;
    }
  },

  async setUser(user) {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error setting user:', e);
    }
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
    } catch (e) {
      console.error('Error removing user:', e);
    }
  },

  // Menu Data
  async getMenuData() {
    try {
      const data = await AsyncStorage.getItem(KEYS.MENU_DATA);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error getting menu data:', e);
      return null;
    }
  },

  async setMenuData(menuData) {
    try {
      await AsyncStorage.setItem(KEYS.MENU_DATA, JSON.stringify(menuData));
    } catch (e) {
      console.error('Error setting menu data:', e);
    }
  },

  // Branding
  async getBranding() {
    try {
      const data = await AsyncStorage.getItem(KEYS.BRANDING);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error getting branding:', e);
      return null;
    }
  },

  async setBranding(branding) {
    try {
      await AsyncStorage.setItem(KEYS.BRANDING, JSON.stringify(branding));
    } catch (e) {
      console.error('Error setting branding:', e);
    }
  },

  // Clear all
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([KEYS.USER, KEYS.MENU_DATA, KEYS.BRANDING]);
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  },
};

export default storage;
