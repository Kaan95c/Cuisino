import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types';
import { mockRecipes } from '../../data/mockData';

const { width } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      // Get all recipes (mock + user recipes)
      const userRecipesData = await AsyncStorage.getItem('userRecipes');
      const userRecipes = userRecipesData ? JSON.parse(userRecipesData) : [];
      const allRecipes = [...mockRecipes, ...userRecipes];
      
      const foundRecipe = allRecipes.find(r => r.id === id);
      
      if (foundRecipe) {
        setRecipe(foundRecipe);
        
        // Load like and save status
        const likedRecipes = await AsyncStorage.getItem('likedRecipes');
        const savedRecipes = await AsyncStorage.getItem('savedRecipes');
        
        const likedIds = likedRecipes ? JSON.parse(likedRecipes) : [];
        const savedIds = savedRecipes ? JSON.parse(savedRecipes) : [];
        
        setIsLiked(likedIds.includes(id));
        setIsSaved(savedIds.includes(id));
      } else {
        Alert.alert('Error', 'Recipe not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert('Error', 'Failed to load recipe');
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
      Alert.alert('Error', 'Failed to update like status');
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
      Alert.alert('Error', 'Failed to update save status');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Recipe Image */}
        <Image
          source={{ uri: recipe.image }}
          style={styles.heroImage}
          contentFit="cover"
        />

        {/* Action Buttons Overlay */}
        <View style={styles.actionsOverlay}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={28} 
              color={isLiked ? Colors.light.like : Colors.light.white} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={26} 
              color={isSaved ? Colors.light.save : Colors.light.white} 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Author */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{recipe.title}</Text>
            <View style={styles.authorInfo}>
              <Image
                source={{ uri: recipe.author.avatar }}
                style={styles.authorAvatar}
                contentFit="cover"
              />
              <View style={styles.authorText}>
                <Text style={styles.authorName}>by {recipe.author.name}</Text>
                <Text style={styles.timeAgo}>{formatTimeAgo(recipe.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={16} color={Colors.light.like} />
              <Text style={styles.statText}>{recipe.likes} likes</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color={Colors.light.textMuted} />
              <Text style={styles.statText}>30 min</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={Colors.light.textMuted} />
              <Text style={styles.statText}>4 servings</Text>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
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

          {/* Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.shareButton} onPress={() => Alert.alert('Share', 'Share functionality coming soon!')}>
              <Ionicons name="share-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.shareButtonText}>Share Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  heroImage: {
    width: width,
    height: width * 0.8,
    backgroundColor: Colors.light.surface,
  },
  actionsOverlay: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: Colors.light.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 34,
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
  },
  authorText: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  ingredientsList: {
    gap: 12,
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
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
    flex: 1,
  },
  instructionsList: {
    gap: 16,
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
    fontWeight: '700',
    color: Colors.light.white,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    flex: 1,
  },
  bottomActions: {
    alignItems: 'center',
    marginTop: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});