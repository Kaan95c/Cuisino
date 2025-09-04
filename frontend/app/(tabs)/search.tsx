import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiService } from '../../services/api';
import { Recipe } from '../../types';
import RecipeCard from '../../components/RecipeCard';

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'recipes' | 'users'>('recipes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [maxPrepTime, setMaxPrepTime] = useState<string>('');
  const [selectedServings, setSelectedServings] = useState<string>('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const AVAILABLE_TAGS = [
    'Vegan', 'Italien', 'Dessert', 'Rapide', 'Sans gluten', 
    'Healthy', 'Boisson', 'Asiatique', 'Méditerranéen', 'Mexicain'
  ];

  const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
    { value: 'hard', label: 'Difficile' }
  ];

  const SERVINGS_OPTIONS = [
    { value: '1-2', label: '1-2 personnes' },
    { value: '3-4', label: '3-4 personnes' },
    { value: '5-6', label: '5-6 personnes' },
    { value: '7+', label: '7+ personnes' }
  ];

  useEffect(() => {
    loadRecipes();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'recipes') {
      applyFilters();
    } else {
      applyUserFilters();
    }
  }, [searchQuery, selectedTags, selectedDifficulty, maxPrepTime, selectedServings, recipes, users, activeTab]);

  const loadRecipes = async () => {
    try {
      setIsLoading(true);
      const apiRecipes = await apiService.getRecipes();
      setRecipes(apiRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    // Ne charge plus tous les utilisateurs au démarrage
    // La recherche se fera dynamiquement
    setUsers([]);
  };

  const applyFilters = () => {
    let filtered = [...recipes];

    // Filtre par nom/description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query)
      );
    }

    // Filtre par tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipe =>
        recipe.tags && selectedTags.some(tag => 
          recipe.tags!.includes(tag)
        )
      );
    }

    // Filtre par difficulté
    if (selectedDifficulty) {
      filtered = filtered.filter(recipe =>
        recipe.difficulty === selectedDifficulty
      );
    }

    // Filtre par temps de préparation
    if (maxPrepTime) {
      const maxTime = parseInt(maxPrepTime);
      filtered = filtered.filter(recipe =>
        recipe.prepTimeMinutes && recipe.prepTimeMinutes <= maxTime
      );
    }

    // Filtre par nombre de portions
    if (selectedServings) {
      const [min, max] = selectedServings.split('-').map(Number);
      filtered = filtered.filter(recipe =>
        recipe.servings && recipe.servings >= min && 
        (max ? recipe.servings <= max : true)
      );
    }

    setFilteredRecipes(filtered);
  };

  const applyUserFilters = async () => {
    if (searchQuery.trim() && searchQuery.length >= 1) {
      try {
        setIsLoading(true);
        const searchResults = await apiService.searchUsers(searchQuery);
        setFilteredUsers(searchResults);
      } catch (error) {
        console.error('Error searching users:', error);
        setFilteredUsers([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFilteredUsers([]);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedDifficulty('');
    setMaxPrepTime('');
    setSelectedServings('');
  };

  const handleFollow = async (userId: string) => {
    try {
      await apiService.followUser(userId);
      // Mettre à jour la liste des utilisateurs
      loadUsers();
    } catch (error) {
      console.error('Error following user:', error);
      Alert.alert('Erreur', 'Impossible de suivre cet utilisateur');
    }
  };

  const handleLike = async (recipeId: string) => {
    try {
      const updatedRecipe = await apiService.toggleLike(recipeId);
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isLiked: updatedRecipe.isLiked, likes: updatedRecipe.likes }
          : recipe
      );
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error updating like:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le like');
    }
  };

  const handleSave = async (recipeId: string) => {
    try {
      const updatedRecipe = await apiService.toggleSave(recipeId);
      const updatedRecipes = recipes.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, isSaved: updatedRecipe.isSaved }
          : recipe
      );
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error('Error updating save:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la sauvegarde');
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

  const router = useRouter();

  const handleUserPress = (userId: string) => {
    router.push(`/profile/${userId}` as any);
  };

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleUserPress(item.id)}
    >
      <View style={styles.userInfo}>
        <Image
          source={{ uri: item.avatar || 'https://example.com/default-avatar.jpg' }}
          style={styles.userAvatar}
          contentFit="cover"
        />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.userUsername, { color: colors.textMuted }]}>
            @{item.username}
          </Text>
          <View style={styles.userStats}>
            <Text style={[styles.userStat, { color: colors.textMuted }]}>
              {item.followersCount} abonnés
            </Text>
            <Text style={[styles.userStat, { color: colors.textMuted }]}>
              {item.recipesCount} recettes
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Recherche</Text>
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              Recettes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === 'users' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons
              name="people"
              size={18}
              color={activeTab === 'users' ? colors.white : colors.text}
            />
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === 'users' && { color: colors.white }
            ]}>
              Utilisateurs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={activeTab === 'recipes' ? "Rechercher par nom ou description..." : "Rechercher un utilisateur..."}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filtres - seulement pour les recettes */}
        {activeTab === 'recipes' && (
          <View style={styles.filtersSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Filtres</Text>

          {/* Tags */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {AVAILABLE_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedTags.includes(tag) && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagText,
                    { color: selectedTags.includes(tag) ? colors.white : colors.text }
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Difficulté */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Difficulté</Text>
            <View style={styles.optionsContainer}>
              {DIFFICULTY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedDifficulty === option.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedDifficulty(selectedDifficulty === option.value ? '' : option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: selectedDifficulty === option.value ? colors.white : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Temps de préparation */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Temps max (minutes)</Text>
            <TextInput
              style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="30"
              placeholderTextColor={colors.textMuted}
              value={maxPrepTime}
              onChangeText={setMaxPrepTime}
              keyboardType="numeric"
            />
          </View>

          {/* Nombre de portions */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Nombre de portions</Text>
            <View style={styles.optionsContainer}>
              {SERVINGS_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedServings === option.value && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setSelectedServings(selectedServings === option.value ? '' : option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: selectedServings === option.value ? colors.white : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        )}

        {/* Résultats */}
        <View style={styles.resultsSection}>
          {activeTab === 'recipes' ? (
            <>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} trouvée{filteredRecipes.length > 1 ? 's' : ''}
              </Text>
              
              {filteredRecipes.length > 0 ? (
                <FlatList
                  data={filteredRecipes}
                  renderItem={renderRecipe}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Aucune recette trouvée avec ces critères
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    Essayez de modifier vos filtres
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
              </Text>
              
              {filteredUsers.length > 0 ? (
                <FlatList
                  data={filteredUsers}
                  renderItem={renderUser}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Aucun utilisateur trouvé
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    Essayez de modifier votre recherche
                  </Text>
                </View>
              )}
            </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    width: '100%',
  },
  resultsSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 13,
    lineHeight: 18,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  userStat: {
    fontSize: 12,
  },
});
