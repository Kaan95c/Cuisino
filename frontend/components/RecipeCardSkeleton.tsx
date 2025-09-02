import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export default function RecipeCardSkeleton() {
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Animated.View style={[styles.avatar, styles.skeleton, shimmerStyle]} />
          <View style={styles.authorText}>
            <Animated.View style={[styles.authorName, styles.skeleton, shimmerStyle]} />
            <Animated.View style={[styles.timeAgo, styles.skeleton, shimmerStyle]} />
          </View>
        </View>
        <Animated.View style={[styles.moreButton, styles.skeleton, shimmerStyle]} />
      </View>

      {/* Image Skeleton */}
      <Animated.View style={[styles.recipeImage, styles.skeleton, shimmerStyle]} />

      {/* Actions Skeleton */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Animated.View style={[styles.actionButton, styles.skeleton, shimmerStyle]} />
          <Animated.View style={[styles.actionButton, styles.skeleton, shimmerStyle]} />
          <Animated.View style={[styles.actionButton, styles.skeleton, shimmerStyle]} />
        </View>
        <Animated.View style={[styles.actionButton, styles.skeleton, shimmerStyle]} />
      </View>

      {/* Content Skeleton */}
      <View style={styles.content}>
        <Animated.View style={[styles.likesLine, styles.skeleton, shimmerStyle]} />
        <Animated.View style={[styles.titleLine, styles.skeleton, shimmerStyle]} />
        <Animated.View style={[styles.titleLine2, styles.skeleton, shimmerStyle]} />
        <Animated.View style={[styles.descriptionLine, styles.skeleton, shimmerStyle]} />
        <Animated.View style={[styles.descriptionLine2, styles.skeleton, shimmerStyle]} />
        
        {/* Ingredients Preview Skeleton */}
        <View style={styles.ingredientsPreview}>
          <Animated.View style={[styles.ingredientsLabel, styles.skeleton, shimmerStyle]} />
          <Animated.View style={[styles.ingredientsLine, styles.skeleton, shimmerStyle]} />
          <Animated.View style={[styles.ingredientsLine2, styles.skeleton, shimmerStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorText: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    height: 16,
    width: 120,
    borderRadius: 8,
    marginBottom: 4,
  },
  timeAgo: {
    height: 12,
    width: 60,
    borderRadius: 6,
  },
  moreButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  recipeImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  likesLine: {
    height: 14,
    width: 80,
    borderRadius: 7,
    marginBottom: 8,
  },
  titleLine: {
    height: 18,
    width: '90%',
    borderRadius: 9,
    marginBottom: 6,
  },
  titleLine2: {
    height: 18,
    width: '60%',
    borderRadius: 9,
    marginBottom: 12,
  },
  descriptionLine: {
    height: 14,
    width: '100%',
    borderRadius: 7,
    marginBottom: 4,
  },
  descriptionLine2: {
    height: 14,
    width: '80%',
    borderRadius: 7,
    marginBottom: 12,
  },
  ingredientsPreview: {
    backgroundColor: Colors.light.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ingredientsLabel: {
    height: 12,
    width: 80,
    borderRadius: 6,
    marginBottom: 8,
  },
  ingredientsLine: {
    height: 13,
    width: '100%',
    borderRadius: 6,
    marginBottom: 4,
  },
  ingredientsLine2: {
    height: 13,
    width: '70%',
    borderRadius: 6,
  },
});