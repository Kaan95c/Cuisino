import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
}: EmptyStateProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 600 });

    // Floating icon animation
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1800 }),
        withTiming(1, { duration: 1800 })
      ),
      -1,
      false
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Ionicons name={icon} size={80} color={Colors.light.primary} />
      </Animated.View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.9}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.light.white} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 28,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.white,
  },
});