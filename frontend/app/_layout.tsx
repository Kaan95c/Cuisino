import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.light.background} />
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background }
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="recipe/[id]" 
          options={{ 
            headerShown: true,
            title: 'Recipe',
            headerStyle: { backgroundColor: Colors.light.background },
            headerTintColor: Colors.light.text,
            headerTitleStyle: { fontWeight: '600' }
          }} 
        />
      </Stack>
    </>
  );
}