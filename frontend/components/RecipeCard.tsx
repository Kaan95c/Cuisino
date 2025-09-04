import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Recipe } from '../types';
import { Colors } from '../constants/Colors';
import ShimmerImage from './ShimmerImage';
import { useTheme } from '../context/ThemeContext';
import CommentSection from './CommentSection';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface RecipeCardProps {
  recipe: Recipe;
  onLike: (recipeId: string) => void;
  onSave: (recipeId: string) => void;
  index?: number;
}

function getCategoryFromRecipe(recipe: Recipe): string | null {
  const title = recipe.title.toLowerCase();
  const text = (recipe.ingredients || []).join(' ').toLowerCase() + ' ' + title;
  if (/pizza|spaghetti|pasta|ital/i.test(text)) return 'Italien';
  if (/cookie|chocolate|cake|dessert|sweet/i.test(text)) return 'Dessert';
  if (/smoothie|bowl|juice|drink/i.test(text)) return 'Boisson';
  if (/avocado|toast|egg|breakfast/i.test(text)) return 'Petit-déj';
  return null;
}

export default function RecipeCard({ recipe, onLike, onSave, index = 0 }: RecipeCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const imageScale = useSharedValue(1);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  // Double tap detection
  const lastTap = useSharedValue(0);

  useEffect(() => {
    // Entrance animation with staggered delay
    const delay = index * 150;
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 600 });
    }, delay);
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const saveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/recipe/${recipe.id}`);
  };

  const handlePressIn = () => {
    imageScale.value = withTiming(0.98, { duration: 120 });
  };

  const handlePressOut = () => {
    imageScale.value = withTiming(1, { duration: 120 });
  };

  const handleLike = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSpring(1.2, { duration: 200 }, () => {
      likeScale.value = withSpring(1, { duration: 200 });
    });
    onLike(recipe.id);
  };

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveScale.value = withSpring(1.2, { duration: 200 }, () => {
      saveScale.value = withSpring(1, { duration: 200 });
    });
    onSave(recipe.id);
  };

  // Double tap animation for heart
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  // Handle double tap on image
  const handleImageDoubleTap = () => {
    'worklet';
    const now = Date.now();
    if (now - lastTap.value < 300) {
      // Double tap detected
      heartScale.value = withSpring(1.5, { duration: 300 }, () => {
        heartScale.value = withSpring(0, { duration: 300 });
      });
      heartOpacity.value = withTiming(1, { duration: 150 }, () => {
        heartOpacity.value = withTiming(0, { duration: 300 });
      });
      
      runOnJS(triggerLike)();
    }
    lastTap.value = now;
  };

  const triggerLike = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLike(recipe.id);
  };

  // Reactions supprimées - utilisation des likes uniquement

  const category = getCategoryFromRecipe(recipe);

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.surface, shadowColor: colors.shadow }, cardAnimatedStyle]}>
      {/* Header with author info */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Image
            source={{ uri: recipe.author.avatar }}
            style={styles.avatar}
            placeholder={{ uri: recipe.author.avatar }}
            contentFit="cover"
          />
          <View style={styles.authorText}>
            <Text style={[styles.authorName, { color: colors.text }]}>{recipe.author.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Recipe Image with overlay */}
      <AnimatedTouchableOpacity 
        onPress={handleImageDoubleTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.95}
        style={styles.imageWrapper}
      >
        <Animated.View style={imageAnimatedStyle}>
          <ShimmerImage source={{ uri: recipe.image }} style={styles.recipeImage} contentFit="cover" />
        </Animated.View>
        
        {/* Double tap heart animation */}
        <Animated.View style={[styles.heartAnimation, heartAnimatedStyle]}>
          <Ionicons name="heart" size={80} color="white" />
        </Animated.View>
                 {/* Floating elements removed - only keep bottom action buttons */}
        {/* Category badge */}
        {category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
        )}
        {/* Title overlay */}
        <View style={styles.titleOverlay}>
          <Text style={styles.titleOverlayText} numberOfLines={1}>
            {recipe.title}
          </Text>
        </View>
      </AnimatedTouchableOpacity>


      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <AnimatedTouchableOpacity 
            onPress={handleLike}
            style={[styles.actionButton, likeAnimatedStyle]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={recipe.isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={recipe.isLiked ? colors.like : colors.text} 
            />
          </AnimatedTouchableOpacity>
          <TouchableOpacity 
            onPress={handlePress} 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handlePress} 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <AnimatedTouchableOpacity 
          onPress={handleSave}
          style={[styles.actionButton, saveAnimatedStyle]}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={recipe.isSaved ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={recipe.isSaved ? colors.save : colors.text} 
          />
        </AnimatedTouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
            {recipe.description}
          </Text>
        </TouchableOpacity>

                 {/* Ingredients Preview */}
         <View style={styles.ingredientsPreview}>
           <Text style={[styles.ingredientsLabel, { color: colors.textSecondary }]}>Ingrédients</Text>
           <Text style={[styles.ingredientsText, { color: colors.textMuted }]} numberOfLines={2}>
             {recipe.ingredients.slice(0, 3).join(', ')}
             {recipe.ingredients.length > 3 && '...'}
           </Text>
         </View>

         {/* Comments Section */}
         <CommentSection recipeId={recipe.id} />
       </View>
     </Animated.View>
   );
 }

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
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
    fontSize: 16,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  recipeImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.8,
    backgroundColor: Colors.light.surface,
  },
  // Floating elements removed
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 80,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    color: Colors.light.white,
    fontSize: 12,
    fontWeight: '700',
  },
  titleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  titleOverlayText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '700',
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
    marginRight: 16,
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  ingredientsPreview: {
    backgroundColor: Colors.light.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ingredientsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  ingredientsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  heartAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 10,
  },
});