import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types';
import { mockCurrentUser, mockRecipes } from '../../data/mockData';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3; // 3 columns with 16px padding on each side and 8px gaps

export default function ProfileScreen() {
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<'recipes' | 'liked' | 'saved'>('recipes');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      // Load user's own recipes
      const userRecipesData = await AsyncStorage.getItem('userRecipes');
      const userRecipesList = userRecipesData ? JSON.parse(userRecipesData) : [];
      
      // Load liked and saved recipe IDs
      const likedIds = await AsyncStorage.getItem('likedRecipes');
      const savedIds = await AsyncStorage.getItem('savedRecipes');
      
      const likedIdsList = likedIds ? JSON.parse(likedIds) : [];
      const savedIdsList = savedIds ? JSON.parse(savedIds) : [];

      // Get all recipes (mock + user recipes)
      const allRecipes = [...mockRecipes, ...userRecipesList];
      
      // Filter liked and saved recipes
      const likedRecipesList = allRecipes.filter(recipe => likedIdsList.includes(recipe.id));
      const savedRecipesList = allRecipes.filter(recipe => savedIdsList.includes(recipe.id));

      setUserRecipes(userRecipesList);
      setLikedRecipes(likedRecipesList);
      setSavedRecipes(savedRecipesList);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadUserData();
    setIsRefreshing(false);
  };

  const renderGridItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push(`/recipe/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.gridImage}
        contentFit="cover"
      />
      <View style={styles.gridOverlay}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'recipes':
        return userRecipes;
      case 'liked':
        return likedRecipes;
      case 'saved':
        return savedRecipes;
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'recipes':
        return 'No recipes yet\nStart sharing your favorite recipes!';
      case 'liked':
        return 'No liked recipes\nLike recipes to see them here';
      case 'saved':
        return 'No saved recipes\nSave recipes to see them here';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: mockCurrentUser.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={styles.name}>{mockCurrentUser.name}</Text>
          <Text style={styles.bio}>{mockCurrentUser.bio}</Text>
          
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userRecipes.length}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{likedRecipes.length}</Text>
              <Text style={styles.statLabel}>Liked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{savedRecipes.length}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
            onPress={() => setActiveTab('recipes')}
          >
            <Ionicons
              name="restaurant"
              size={20}
              color={activeTab === 'recipes' ? Colors.light.primary : Colors.light.textMuted}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'recipes' && styles.activeTabText
            ]}>
              My Recipes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
            onPress={() => setActiveTab('liked')}
          >
            <Ionicons
              name="heart"
              size={20}
              color={activeTab === 'liked' ? Colors.light.primary : Colors.light.textMuted}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'liked' && styles.activeTabText
            ]}>
              Liked
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name="bookmark"
              size={20}
              color={activeTab === 'saved' ? Colors.light.primary : Colors.light.textMuted}
            />
            <Text style={[
              styles.tabText,
              activeTab === 'saved' && styles.activeTabText
            ]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recipe Grid */}
        <View style={styles.gridContainer}>
          {getCurrentData().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name={
                  activeTab === 'recipes' ? 'restaurant-outline' :
                  activeTab === 'liked' ? 'heart-outline' : 'bookmark-outline'
                }
                size={64}
                color={Colors.light.textMuted}
              />
              <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
              {activeTab === 'recipes' && (
                <TouchableOpacity
                  style={styles.addRecipeButton}
                  onPress={() => router.push('/(tabs)/add')}
                >
                  <Text style={styles.addRecipeButtonText}>Add Your First Recipe</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={getCurrentData()}
              renderItem={renderGridItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          )}
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: Colors.light.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.surface,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textMuted,
  },
  editButton: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textMuted,
    marginLeft: 6,
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 300,
  },
  row: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.surface,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.white,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  addRecipeButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addRecipeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.white,
  },
});