import React, { createContext, useContext, useState, useCallback } from 'react';
import { safeShifts } from '@/utils/safeRead';

const TimingSettingsContext = createContext();

const STORAGE_KEY = 'kiosk_timing_settings';

export const TimingSettingsProvider = ({ children }) => {
  // safeShifts drops any malformed shift entry rather than letting
  // getCurrentPrepTime crash on .split(':') (which previously took the
  // SuccessOverlay down mid-order).
  const [shifts, setShifts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? safeShifts(JSON.parse(raw)) : [];
    } catch {
      return [];
    }
  });

  const saveShifts = useCallback((newShifts) => {
    const sanitized = safeShifts(newShifts);
    setShifts(sanitized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }, []);

  const clearShifts = useCallback(() => {
    setShifts([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get current prep time based on active shift.
  // shifts is guaranteed to be an array of well-formed entries by safeShifts —
  // but we keep one belt-and-braces typeof check for defense in depth.
  const getCurrentPrepTime = useCallback(() => {
    if (!Array.isArray(shifts) || !shifts.length) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const shift of shifts) {
      if (!shift || typeof shift.start !== 'string' || typeof shift.end !== 'string') {
        continue;
      }
      const [startH, startM] = shift.start.split(':').map(Number);
      const [endH, endM] = shift.end.split(':').map(Number);
      if ([startH, startM, endH, endM].some(Number.isNaN)) continue;

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
