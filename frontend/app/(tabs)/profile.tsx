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
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import ShimmerImage from '../../components/ShimmerImage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3; // 3 columns with 16px padding on each side and 8px gaps

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, logout, refreshUser } = useAuth();
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
      // Charger les recettes de l'utilisateur depuis l'API
      const [userRecipesData, likedRecipesData, savedRecipesData] = await Promise.all([
        apiService.getUserRecipes(),
        apiService.getLikedRecipes(),
        apiService.getSavedRecipes()
      ]);
      
      setUserRecipes(userRecipesData);
      setLikedRecipes(likedRecipesData);
      setSavedRecipes(savedRecipesData);
    } catch (error) {
      console.error('Error loading user data:', error);
      // En cas d'erreur, initialiser avec des tableaux vides
      setUserRecipes([]);
      setLikedRecipes([]);
      setSavedRecipes([]);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
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
      <ShimmerImage source={{ uri: item.image }} style={styles.gridImage} contentFit="cover" />
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
        return 'Aucune recette pour le moment\nPartage ta première recette !';
      case 'liked':
        return 'Aucun like pour le moment\nAime des recettes pour les voir ici';
      case 'saved':
        return 'Aucun enregistrement\nEnregistre des recettes pour les retrouver ici';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <Image
            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80' }}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={[styles.name, { color: colors.text }]}>
            {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
          </Text>
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {user?.bio || 'Aucune bio pour le moment'}
          </Text>
          
          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{userRecipes.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Recettes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{likedRecipes.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{savedRecipes.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Enregistrées</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/edit-profile');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.editButtonText, { color: colors.text }]}>Éditer le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === 'recipes' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('recipes')}
          >
            <Ionicons
              name="restaurant"
              size={18}
              color={activeTab === 'recipes' ? colors.white : colors.text}
            />
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === 'recipes' && { color: colors.white }
            ]}>
              Mes recettes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === 'liked' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('liked')}
          >
            <Ionicons
              name="heart"
              size={18}
              color={activeTab === 'liked' ? colors.white : colors.text}
            />
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === 'liked' && { color: colors.white }
            ]}>
              Likées
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === 'saved' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name="bookmark"
              size={18}
              color={activeTab === 'saved' ? colors.white : colors.text}
            />
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === 'saved' && { color: colors.white }
            ]}>
              Enregistrées
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
                color={colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{getEmptyMessage()}</Text>
              {activeTab === 'recipes' && (
                <TouchableOpacity
                  style={[styles.addRecipeButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)/add')}
                >
                  <Text style={[styles.addRecipeButtonText, { color: colors.white }]}>Ajouter ma première recette</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.light.surface,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 6,
  },
  bio: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 21,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  editButton: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeTab: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 6,
  },
  activeTabText: {
    color: Colors.light.white,
    fontWeight: '700',
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
    fontWeight: '700',
    color: Colors.light.white,
  },
});