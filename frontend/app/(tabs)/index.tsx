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
  ScrollView,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';

export default function HomeScreen() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const CATEGORIES: { key: string; label: string }[] = [
    { key: 'all', label: t('chips_all') },
    { key: 'dessert', label: t('chips_dessert') },
    { key: 'breakfast', label: t('chips_breakfast') },
    { key: 'italian', label: t('chips_italian') },
    { key: 'vegan', label: t('chips_vegan') },
    { key: 'drinks', label: t('chips_drinks') },
    { key: 'fast', label: t('chips_fast') },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter recipes based on search query and category
    const base = recipes.filter((recipe) => {
      if (selectedCategory === 'all') return true;
      const title = recipe.title.toLowerCase();
      const ingredients = recipe.ingredients.join(' ').toLowerCase();
      const cat = selectedCategory.toLowerCase();
      const map: Record<string, string[]> = {
        'dessert': ['cookie', 'cake', 'chocolate', 'sweet'],
        'breakfast': ['toast', 'egg', 'breakfast'],
        'italian': ['pasta', 'spaghetti', 'pizza', 'italian'],
        'vegan': ['vegan', 'plant', 'tofu', 'almond'],
        'drinks': ['smoothie', 'drink', 'juice'],
        'fast': ['quick', 'toast', 'bowl'],
      };
      const keywords = map[cat] || [];
      return keywords.some(k => title.includes(k) || ingredients.includes(k));
    });

    if (searchQuery.trim() === '') {
      setFilteredRecipes(base);
    } else {
      const filtered = base.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes, selectedCategory]);

  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setIsLoading(true);
      }

      await new Promise(resolve => setTimeout(resolve, showRefreshIndicator ? 800 : 1500));

      const liked = await AsyncStorage.getItem('likedRecipes');
      const saved = await AsyncStorage.getItem('savedRecipes');
      const userRecipesData = await AsyncStorage.getItem('userRecipes');
      
      const likedIds = liked ? JSON.parse(liked) : [];
      const savedIds = saved ? JSON.parse(saved) : [];
      const userRecipes = userRecipesData ? JSON.parse(userRecipesData) : [];
      
      setLikedRecipes(likedIds);
      setSavedRecipes(savedIds);

      const allRecipes = [...userRecipes, ...mockRecipes];

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

      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: !recipe.isLiked }
          : recipe
      );
      setRecipes(updatedRecipes);
      
      const updatedFilteredRecipes = filteredRecipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: !recipe.isLiked }
          : recipe
      );
      setFilteredRecipes(updatedFilteredRecipes);
    } catch (error) {
      console.error('Error updating likes:', error);
      Alert.alert(t('alert_error'), '');
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

      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isSaved: !recipe.isSaved }
          : recipe
      );
      setRecipes(updatedRecipes);
      
      const updatedFilteredRecipes = filteredRecipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isSaved: !recipe.isSaved }
          : recipe
      );
      setFilteredRecipes(updatedFilteredRecipes);
    } catch (error) {
      console.error('Error updating saves:', error);
      Alert.alert(t('alert_error'), '');
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

  const HeaderHero = () => (
    <View style={styles.heroContainer}>
      <LinearGradient
        colors={[Colors.light.white, Colors.light.surfaceSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTitle}>{t('home_hero_title')}</Text>
          <Text style={styles.heroSubtitle}>{t('home_hero_sub')}</Text>
        </View>
        <TouchableOpacity style={styles.addFab} onPress={() => router.push('/(tabs)/add')} activeOpacity={0.9}>
          <Ionicons name="add" size={22} color={Colors.light.white} />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const CategoryChips = () => (
    <View style={styles.chipsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {CATEGORIES.map(({ key, label }) => {
          const isActive = selectedCategory === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={async () => {
                await Haptics.selectionAsync();
                setSelectedCategory(key);
              }}
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderHero />
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.light.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.light.textMuted}
              editable={false}
            />
          </View>
        </View>
        <CategoryChips />

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
      <HeaderHero />
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.light.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_placeholder')}
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

      <CategoryChips />

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
          <EmptyState
            icon="restaurant-outline"
            title={t('empty_no_recipes')}
            subtitle={
              searchQuery || selectedCategory !== 'all'
                ? t('empty_hint_search')
                : t('empty_hint_default')
            }
            actionText={!searchQuery && selectedCategory === 'all' ? t('profile_add_first') : undefined}
            onAction={!searchQuery && selectedCategory === 'all' ? () => router.push('/(tabs)/add') : undefined}
          />
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
  heroContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroGradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.light.text,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  addFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
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
    fontFamily: 'Inter_400Regular',
  },
  clearButton: {
    marginLeft: 8,
  },
  chipsWrapper: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  chipsContainer: {
    paddingRight: 16,
  },
  chip: {
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
    fontFamily: 'Inter_600SemiBold',
  },
  chipTextActive: {
    color: Colors.light.white,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  separator: {
    height: 16,
  },
});