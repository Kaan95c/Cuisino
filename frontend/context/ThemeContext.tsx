import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'pink';

interface ThemeContextValue {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  colors: typeof import('../constants/Colors').Colors.light | typeof import('../constants/Colors').Colors.dark;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_STORAGE_KEY = 'appThemeMode';
const COLOR_SCHEME_STORAGE_KEY = 'appColorScheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('purple');

  useEffect(() => {
    (async () => {
      const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const savedColorScheme = await AsyncStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
      
      if (savedThemeMode === 'light' || savedThemeMode === 'dark' || savedThemeMode === 'system') {
        setThemeModeState(savedThemeMode);
      }
      
      if (savedColorScheme === 'purple' || savedColorScheme === 'blue' || savedColorScheme === 'green' || savedColorScheme === 'orange' || savedColorScheme === 'pink') {
        setColorSchemeState(savedColorScheme);
      }
    })();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    await AsyncStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  };

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => {
    const baseColors = isDark ? Colors.dark : Colors.light;
    
    // Apply color scheme
    const schemeColors = COLOR_SCHEMES[colorScheme];
    
    return {
      ...baseColors,
      primary: schemeColors.primary,
      secondary: schemeColors.secondary,
      accent: schemeColors.accent,
    };
  }, [isDark, colorScheme]);

  const value: ThemeContextValue = useMemo(() => ({
    themeMode,
    colorScheme,
    isDark,
    setThemeMode,
    setColorScheme,
    colors,
  }), [themeMode, colorScheme, isDark, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

// Color schemes
const COLOR_SCHEMES: Record<ColorScheme, { primary: string; secondary: string; accent: string }> = {
  purple: {
    primary: '#7C5CFC',
    secondary: '#FF8A5B',
    accent: '#3DDAB4',
  },
  blue: {
    primary: '#3B82F6',
    secondary: '#F59E0B',
    accent: '#10B981',
  },
  green: {
    primary: '#10B981',
    secondary: '#F59E0B',
    accent: '#3B82F6',
  },
  orange: {
    primary: '#F59E0B',
    secondary: '#EF4444',
    accent: '#8B5CF6',
  },
  pink: {
    primary: '#EC4899',
    secondary: '#8B5CF6',
    accent: '#10B981',
  },
};

// Import Colors after defining COLOR_SCHEMES
import { Colors } from '../constants/Colors'; 