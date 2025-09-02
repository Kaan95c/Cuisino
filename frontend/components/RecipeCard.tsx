import React from 'react';
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
import { Recipe } from '../types';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface RecipeCardProps {
  recipe: Recipe;
  onLike: (recipeId: string) => void;
  onSave: (recipeId: string) => void;
}

export default function RecipeCard({ recipe, onLike, onSave }: RecipeCardProps) {
  const handlePress = () => {
    router.push(`/recipe/${recipe.id}`);
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

  return (
    <View style={styles.container}>
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
            <Text style={styles.authorName}>{recipe.author.name}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(recipe.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.light.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Recipe Image */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Image
          source={{ uri: recipe.image }}
          style={styles.recipeImage}
          placeholder={{ uri: recipe.image }}
          contentFit="cover"
        />
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            onPress={() => onLike(recipe.id)} 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={recipe.isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={recipe.isLiked ? Colors.light.like : Colors.light.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handlePress} 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handlePress} 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          onPress={() => onSave(recipe.id)} 
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={recipe.isSaved ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={recipe.isSaved ? Colors.light.save : Colors.light.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {recipe.likes > 0 && (
          <Text style={styles.likes}>
            {recipe.likes} {recipe.likes === 1 ? 'like' : 'likes'}
          </Text>
        )}
        
        <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Text style={styles.description} numberOfLines={3}>
            {recipe.description}
          </Text>
        </TouchableOpacity>

        {/* Ingredients Preview */}
        <View style={styles.ingredientsPreview}>
          <Text style={styles.ingredientsLabel}>Ingredients:</Text>
          <Text style={styles.ingredientsText} numberOfLines={2}>
            {recipe.ingredients.slice(0, 3).join(', ')}
            {recipe.ingredients.length > 3 && '...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
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
    backgroundColor: Colors.light.surface,
  },
  authorText: {
    marginLeft: 12,
    flex: 1,
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
  moreButton: {
    padding: 4,
  },
  recipeImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.8,
    backgroundColor: Colors.light.surface,
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
  likes: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
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
});