import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { mockRecipes } from '../../data/mockData';
import { Recipe } from '../../types';
import { Colors } from '../../constants/Colors';
import RecipeCard from '../../components/RecipeCard';
import RecipeCardSkeleton from '../../components/RecipeCardSkeleton';
import EmptyState from '../../components/EmptyState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter recipes based on search query
    if (searchQuery.trim() === '') {
      setFilteredRecipes(recipes);
    } else {
      const filtered = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes]);

  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setIsLoading(true);
      }

      // Simulate network loading
      await new Promise(resolve => setTimeout(resolve, showRefreshIndicator ? 800 : 1500));

      // Load liked and saved recipes from storage
      const liked = await AsyncStorage.getItem('likedRecipes');
      const saved = await AsyncStorage.getItem('savedRecipes');
      const userRecipesData = await AsyncStorage.getItem('userRecipes');
      
      const likedIds = liked ? JSON.parse(liked) : [];
      const savedIds = saved ? JSON.parse(saved) : [];
      const userRecipes = userRecipesData ? JSON.parse(userRecipesData) : [];
      
      setLikedRecipes(likedIds);
      setSavedRecipes(savedIds);

      // Combine mock recipes with user recipes
      const allRecipes = [...userRecipes, ...mockRecipes];

      // Update recipes with like/save status
      const updatedRecipes = allRecipes.map(recipe => ({
        ...recipe,
        isLiked: likedIds.includes(recipe.id),
        isSaved: savedIds.includes(recipe.id),
      }));

      setRecipes(updatedRecipes);
      setFilteredRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error loading data:', error);
      setRecipes(mockRecipes);
      setFilteredRecipes(mockRecipes);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadData(true);
  };

  const handleLike = async (recipeId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      let newLikedRecipes;
      if (likedRecipes.includes(recipeId)) {
        newLikedRecipes = likedRecipes.filter(id => id !== recipeId);
      } else {
        newLikedRecipes = [...likedRecipes, recipeId];
      }

      setLikedRecipes(newLikedRecipes);
      await AsyncStorage.setItem('likedRecipes', JSON.stringify(newLikedRecipes));

      // Update recipe state
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: !recipe.isLiked }
          : recipe
      );
      setRecipes(updatedRecipes);
      
      // Update filtered recipes too
      const updatedFilteredRecipes = filteredRecipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: !recipe.isLiked }
          : recipe
      );
      setFilteredRecipes(updatedFilteredRecipes);
    } catch (error) {
      console.error('Error updating likes:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const handleSave = async (recipeId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      let newSavedRecipes;
      if (savedRecipes.includes(recipeId)) {
        newSavedRecipes = savedRecipes.filter(id => id !== recipeId);
      } else {
        newSavedRecipes = [...savedRecipes, recipeId];
      }

      setSavedRecipes(newSavedRecipes);
      await AsyncStorage.setItem('savedRecipes', JSON.stringify(newSavedRecipes));

      // Update recipe state
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isSaved: !recipe.isSaved }
          : recipe
      );
      setRecipes(updatedRecipes);
      
      // Update filtered recipes too
      const updatedFilteredRecipes = filteredRecipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isSaved: !recipe.isSaved }
          : recipe
      );
      setFilteredRecipes(updatedFilteredRecipes);
    } catch (error) {
      console.error('Error updating saves:', error);
      Alert.alert('Error', 'Failed to update save status');
    }
  };

  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => (
    <RecipeCard
      recipe={item}
      onLike={handleLike}
      onSave={handleSave}
      index={index}
    />
  );

  const renderSkeleton = ({ index }: { index: number }) => (
    <RecipeCardSkeleton key={`skeleton-${index}`} />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.light.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.light.textMuted}
              editable={false}
            />
          </View>
        </View>

        {/* Skeleton Loading */}
        <View style={styles.listContainer}>
          {[0, 1, 2].map((index) => (
            <RecipeCardSkeleton key={`skeleton-${index}`} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.light.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.light.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recipe Feed */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or pull to refresh</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.white,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  clearButton: {
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {
    height: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
});