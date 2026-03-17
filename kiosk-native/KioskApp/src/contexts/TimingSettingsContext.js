// TimingSettingsContext - Operating hours & prep time (AsyncStorage)
import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimingSettingsContext = createContext();

const STORAGE_KEY = 'kiosk_timing_settings';

export const TimingSettingsProvider = ({ children }) => {
  const [shifts, setShifts] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const initialize = useCallback(async () => {
    if (initialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setShifts(JSON.parse(stored));
    } catch (e) {
      console.log('Error loading timing settings:', e);
    }
    setInitialized(true);
  }, [initialized]);

  const saveShifts = useCallback(async (newShifts) => {
    setShifts(newShifts);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newShifts));
  }, []);

  const clearShifts = useCallback(async () => {
    setShifts([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const getCurrentPrepTime = useCallback(() => {
    if (!shifts.length) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const shift of shifts) {
      const [startH, startM] = shift.start.split(':').map(Number);
      const [endH, endM] = shift.end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          return shift.prepTime;
        }
      } else {
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          return shift.prepTime;
        }
      }
    }

    return null;
  }, [shifts]);

  return (
    <TimingSettingsContext.Provider value={{
      shifts,
      initialized,
      initialize,
      saveShifts,
      clearShifts,
      getCurrentPrepTime,
    }}>
      {children}
    </TimingSettingsContext.Provider>
  );
};

export const useTimingSettings = () => {
  const context = useContext(TimingSettingsContext);
  if (!context) {
    throw new Error('useTimingSettings must be used within TimingSettingsProvider');
  }
  return context;
};

export default TimingSettingsContext;
