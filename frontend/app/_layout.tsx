import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';

function InnerLayout() {
  const { isDark } = useTheme();
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="recipe/[id]" 
          options={{ 
            headerShown: true,
            title: 'Recette',
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerTitleStyle: { fontWeight: '600' },
            animation: 'fade_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: true,
            title: 'Paramètres',
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerTitleStyle: { fontWeight: '700' },
            animation: 'slide_from_right',
          }} 
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </LanguageProvider>
  );
}