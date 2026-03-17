import React, { createContext, useContext, useState, useCallback } from 'react';

const TimingSettingsContext = createContext();

const STORAGE_KEY = 'kiosk_timing_settings';

export const TimingSettingsProvider = ({ children }) => {
  const [shifts, setShifts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveShifts = useCallback((newShifts) => {
    setShifts(newShifts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newShifts));
  }, []);

  const clearShifts = useCallback(() => {
    setShifts([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get current prep time based on active shift
  const getCurrentPrepTime = useCallback(() => {
    if (!shifts.length) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const shift of shifts) {
      const [startH, startM] = shift.start.split(':').map(Number);
      const [endH, endM] = shift.end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      // Handle overnight shifts (e.g., 22:00 - 03:00)
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
