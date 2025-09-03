import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import ShimmerImage from '../../components/ShimmerImage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types';
import { mockRecipes } from '../../data/mockData';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');
const HERO_BASE_HEIGHT = width * 0.78;

export default function RecipeDetailScreen() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      const userRecipesData = await AsyncStorage.getItem('userRecipes');
      const userRecipes = userRecipesData ? JSON.parse(userRecipesData) : [];
      const allRecipes = [...mockRecipes, ...userRecipes];
      
      const foundRecipe = allRecipes.find(r => r.id === id);
      
      if (foundRecipe) {
        setRecipe(foundRecipe);
        
        const likedRecipes = await AsyncStorage.getItem('likedRecipes');
        const savedRecipes = await AsyncStorage.getItem('savedRecipes');
        
        const likedIds = likedRecipes ? JSON.parse(likedRecipes) : [];
        const savedIds = savedRecipes ? JSON.parse(savedRecipes) : [];
        
        setIsLiked(likedIds.includes(id));
        setIsSaved(savedIds.includes(id));
      } else {
        Alert.alert(t('alert_error'), '', [
          { text: t('alert_ok'), onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert(t('alert_error'), '');
    }
  };

  const handleLike = async () => {
    try {
      const likedRecipes = await AsyncStorage.getItem('likedRecipes');
      let likedIds = likedRecipes ? JSON.parse(likedRecipes) : [];
      
      if (isLiked) {
        likedIds = likedIds.filter((recipeId: string) => recipeId !== id);
      } else {
        likedIds.push(id);
      }
      
      await AsyncStorage.setItem('likedRecipes', JSON.stringify(likedIds));
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error updating like:', error);
      Alert.alert(t('alert_error'), '');
    }
  };

  const handleSave = async () => {
    try {
      const savedRecipes = await AsyncStorage.getItem('savedRecipes');
      let savedIds = savedRecipes ? JSON.parse(savedRecipes) : [];
      
      if (isSaved) {
        savedIds = savedIds.filter((recipeId: string) => recipeId !== id);
      } else {
        savedIds.push(id);
      }
      
      await AsyncStorage.setItem('savedRecipes', JSON.stringify(savedIds));
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error updating save:', error);
      Alert.alert(t('alert_error'), '');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('just_now');
    if (diffInHours < 24) return `${diffInHours}${t('h')}`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}${t('d')}`;
    return `${Math.floor(diffInDays / 7)}${t('w')}`;
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('empty_hint_default')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const heroHeight = scrollY.interpolate({
    inputRange: [-150, 0, 200],
    outputRange: [HERO_BASE_HEIGHT + 150, HERO_BASE_HEIGHT, HERO_BASE_HEIGHT - 80],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 120, 200],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([
          { nativeEvent: { contentOffset: { y: scrollY } } }
        ], { useNativeDriver: false })}
      >
        <Animated.View style={[styles.heroWrapper, { height: heroHeight }]}> 
          <ShimmerImage source={{ uri: recipe.image }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={Colors.light.white} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.topBtn} onPress={handleLike}>
                <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? Colors.light.like : Colors.light.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topBtn} onPress={handleSave}>
                <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? Colors.light.save : Colors.light.white} />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={[styles.titleOverlay, { opacity: titleOpacity }]}> 
            <BlurView intensity={30} tint="dark" style={styles.blurPill}>
              <Text style={styles.titleOverlayText} numberOfLines={2}>{recipe.title}</Text>
            </BlurView>
          </Animated.View>
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.authorRow}>
            <Image
              source={{ uri: recipe.author.avatar }}
              style={styles.authorAvatar}
              contentFit="cover"
            />
            <View style={styles.authorCol}>
              <Text style={styles.authorName}>{recipe.author.name}</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(recipe.createdAt)}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.statsBadge}>
              <Ionicons name="heart" size={14} color={Colors.light.like} />
              <Text style={styles.statsBadgeText}>{recipe.likes}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('presentation')}</Text>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>

          <View style={styles.statsSection}>
            {typeof recipe.prepTimeMinutes === 'number' && (
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={Colors.light.textMuted} />
                <Text style={styles.statText}>{`${recipe.prepTimeMinutes} ${t('minutes')}`}</Text>
              </View>
            )}
            {typeof recipe.servings === 'number' && (
              <View style={styles.statItem}>
                <Ionicons name="people" size={16} color={Colors.light.textMuted} />
                <Text style={styles.statText}>{`${recipe.servings} ${t('servings')}`}</Text>
              </View>
            )}
          </View>

          {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsRow}>
                {recipe.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('ingredients')}</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('steps')}</Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.shareButton} onPress={() => Alert.alert(t('share'), '')}>
              <Ionicons name="share-outline" size={18} color={Colors.light.primary} />
              <Text style={styles.shareButtonText}>{t('share')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textMuted,
  },
  heroWrapper: {
    width: width,
    overflow: 'hidden',
    backgroundColor: Colors.light.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  blurPill: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  titleOverlayText: {
    color: Colors.light.white,
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    backgroundColor: Colors.light.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surface,
  },
  authorCol: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 28,
    gap: 6,
  },
  statsBadgeText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '700',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 18,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagChipText: {
    fontSize: 12,
    color: Colors.light.text,
    fontWeight: '600',
  },
  ingredientsList: {
    gap: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 8,
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    flex: 1,
  },
  instructionsList: {
    gap: 14,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.white,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    flex: 1,
  },
  bottomActions: {
    alignItems: 'center',
    marginTop: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});