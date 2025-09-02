import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../constants/Colors';

interface ShimmerImageProps {
  source: { uri: string };
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function ShimmerImage({ source, style, borderRadius, contentFit = 'cover' }: ShimmerImageProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const onLoadEnd = () => {
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  return (
    <View style={[styles.container, style, borderRadius != null && { borderRadius, overflow: 'hidden' }]}>
      <Animated.View style={[styles.placeholder, { opacity: shimmer }]} />
      <Animated.View style={{ ...StyleSheet.absoluteFillObject as any, opacity }}>
        <Image source={source} style={StyleSheet.absoluteFill} contentFit={contentFit} onLoadEnd={onLoadEnd} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.surface,
  },
}); 