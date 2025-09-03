import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  TextInput,
  Animated,
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
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';

export default function HomeScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Supprimé les catégories fixes

  useEffect(() => {
    loadData();
  }, []);

  // Filtrage supprimé - remplacé par la page de recherche dédiée

  const loadData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setIsLoading(true);
      }

      console.log('📡 Chargement des recettes depuis l\'API...');
      // Charger les recettes depuis l'API backend
      const apiRecipes = await apiService.getRecipes();
      console.log('✅ Recettes chargées depuis l\'API:', apiRecipes.length);
      
      // Combiner avec les recettes mockées pour l'instant
      const allRecipes = [...apiRecipes, ...mockRecipes];
      console.log('📊 Total des recettes:', allRecipes.length);

      setRecipes(allRecipes);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      // En cas d'erreur, utiliser les recettes mockées
      setRecipes(mockRecipes);
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
      
      // Appeler l'API pour toggle le like
      const updatedRecipe = await apiService.toggleLike(recipeId);
      
      // Mettre à jour les recettes locales
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: updatedRecipe.isLiked, likes: updatedRecipe.likes }
          : recipe
      );
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error updating likes:', error);
      Alert.alert(t('alert_error'), 'Erreur lors du like');
    }
  };

  const handleSave = async (recipeId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Appeler l'API pour toggle la sauvegarde
      const updatedRecipe = await apiService.toggleSave(recipeId);
      
      // Mettre à jour les recettes locales
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isSaved: updatedRecipe.isSaved }
          : recipe
      );
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error updating saves:', error);
      Alert.alert(t('alert_error'), 'Erreur lors de la sauvegarde');
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

  // HeaderHero supprimé - seul le titre dans la navbar est conservé

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Bouton de recherche supprimé - remplacé par un onglet dans la navbar */}

        <View style={styles.listContainer}>
          {[0, 1, 2].map((index) => (
            <RecipeCardSkeleton key={`skeleton-${index}`} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Bouton de recherche supprimé - remplacé par un onglet dans la navbar */}

              <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={undefined}
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
            subtitle={t('empty_hint_default')}
            actionText={t('profile_add_first')}
            onAction={() => router.push('/(tabs)/add')}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroGradient: {
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextBlockCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCentered: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.light.text,
  },
  // Styles supprimés car plus utilisés
  listContainer: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  separator: {
    height: 0,
  },
});