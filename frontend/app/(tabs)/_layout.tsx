import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { useColorScheme, Animated, TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { router, useFocusEffect } from 'expo-router';
import { useLanguage } from '../../context/LanguageContext';
import { useUnread } from '../../context/UnreadContext';

export default function TabsLayout() {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const theme = isDark ? Colors.dark : Colors.light;
  const { unreadCount, refreshUnreadCount } = useUnread();

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useFocusEffect(
    React.useCallback(() => {
      refreshUnreadCount();
    }, [refreshUnreadCount])
  );

  const AnimatedIcon = ({ name, color, size, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; size: number; focused: boolean }) => {
    const scale = React.useRef(new Animated.Value(focused ? 1 : 0.9)).current;
    const opacity = React.useRef(new Animated.Value(focused ? 1 : 0.7)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(scale, { toValue: focused ? 1 : 0.9, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: focused ? 1 : 0.7, duration: 180, useNativeDriver: true }),
      ]).start();
      if (focused) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, [focused]);

    return (
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Ionicons name={name} size={size} color={color} />
      </Animated.View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.white,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 92,
          paddingTop: 14,
          paddingBottom: 8,
        },
        tabBarItemStyle: {
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs_home'),
          headerTitle: t('header_home'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="home" size={size} color={color} focused={focused} />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                router.push('/messages');
                // Refresh unread count when navigating to messages
                setTimeout(refreshUnreadCount, 1000);
              }}
              style={{ marginRight: 12, padding: 6 }}
              activeOpacity={0.8}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons name="chatbubbles-outline" size={22} color={theme.text} />
                {unreadCount > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    backgroundColor: '#FF3B30',
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          headerTitle: 'Recherche',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="search" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('tabs_add'),
          headerTitle: t('header_add'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="add-circle" size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs_profile'),
          headerTitle: t('header_profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="person" size={size} color={color} focused={focused} />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={{ marginRight: 12, padding: 6 }}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}