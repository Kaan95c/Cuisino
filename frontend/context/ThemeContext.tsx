import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'themePreference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreferenceState(saved);
      }
    })();

    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const isDark = useMemo(() => {
    if (preference === 'system') return systemScheme === 'dark';
    return preference === 'dark';
  }, [preference, systemScheme]);

  const setPreference = async (pref: ThemePreference) => {
    setPreferenceState(pref);
    await AsyncStorage.setItem(STORAGE_KEY, pref);
  };

  const value = useMemo(() => ({ preference, isDark, setPreference }), [preference, isDark]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
} 