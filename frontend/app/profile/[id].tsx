import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');
const RECIPE_ITEM_WIDTH = (width - 48) / 2;

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  recipesCount: number;
  isFollowing: boolean;
  recipes: Recipe[];
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  likesCount: number;
  ingredients: string[];
  instructions: string[];
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const themeColors = Colors.light; // Using light theme colors for now
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await apiService.getUserProfile(id!);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;

    try {
      if (profile.isFollowing) {
        await apiService.unfollowUser(profile.id);
      } else {
        await apiService.followUser(profile.id);
      }
      
      // Recharger le profil pour mettre à jour les statistiques
      await loadProfile();
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Erreur', 'Impossible de modifier le suivi');
    }
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleMessagePress = async () => {
    if (!profile) return;
    
    try {
      // Créer ou récupérer la conversation existante
      const response = await apiService.createConversation(profile.id);
      const conversationId = response.conversationId;
      
      // Naviguer vers le chat avec l'ID de la conversation
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating/finding conversation:', error);
      Alert.alert('Erreur', 'Impossible de créer la conversation');
    }
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeItem, { backgroundColor: themeColors.surface }]}
      onPress={() => handleRecipePress(item)}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/200' }}
        style={styles.recipeImage}
        contentFit="cover"
      />
      <View style={styles.recipeInfo}>
        <Text
          style={[styles.recipeTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View style={styles.recipeStats}>
          <View style={styles.recipeStat}>
            <Ionicons name="heart" size={14} color={colors.primary} />
            <Text style={[styles.recipeStatText, { color: themeColors.textMuted }]}>
              {item.likesCount}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: themeColors.textMuted }]}>
            Profil non trouvé
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {profile.username || `${profile.firstName} ${profile.lastName}`}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profile.avatar || 'https://via.placeholder.com/120' }}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={[styles.name, { color: colors.text }]}>
            {`${profile.firstName} ${profile.lastName}`.trim()}
          </Text>
          {profile.username && (
            <Text style={[styles.username, { color: themeColors.textMuted }]}>
              @{profile.username}
            </Text>
          )}
          {profile.bio && (
            <Text style={[styles.bio, { color: colors.text }]}>
              {profile.bio}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile.recipesCount}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
                Recettes
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile.followersCount}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
                Abonnés
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {profile.followingCount}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
                Abonnements
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.followButton,
                {
                  backgroundColor: profile.isFollowing ? themeColors.surface : colors.primary,
                  borderColor: colors.primary,
                }
              ]}
              onPress={handleFollowToggle}
            >
              <Text
                style={[
                  styles.followButtonText,
                  { color: profile.isFollowing ? colors.primary : themeColors.white }
                ]}
              >
                {profile.isFollowing ? 'Ne plus suivre' : 'Suivre'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.messageButton, { backgroundColor: themeColors.surface, borderColor: colors.border }]}
              onPress={handleMessagePress}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipes Grid */}
        <View style={styles.recipesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recettes ({profile.recipesCount})
          </Text>
          {profile.recipes.length > 0 ? (
            <FlatList
              data={profile.recipes}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.recipeRow}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyRecipes}>
              <Ionicons name="restaurant-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                Aucune recette publiée
              </Text>
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recipeRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recipeItem: {
    width: RECIPE_ITEM_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: '100%',
    height: 120,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeStatText: {
    fontSize: 12,
  },
  emptyRecipes: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
