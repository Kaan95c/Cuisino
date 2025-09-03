import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

interface CommentSectionProps {
  recipeId: string;
  onCommentCountChange?: (count: number) => void;
}

export default function CommentSection({ recipeId, onCommentCountChange }: CommentSectionProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    loadComments();
  }, [recipeId]);

  const loadComments = async () => {
    try {
      const commentsData = await apiService.getComments(recipeId);
      setComments(commentsData);
      onCommentCountChange?.(commentsData.length);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsLoading(true);
    try {
      const commentData = {
        content: newComment.trim(),
        recipeId,
        author: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar || 'https://example.com/default-avatar.jpg'
        }
      };

      const newCommentData = await apiService.addComment(commentData);
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      onCommentCountChange?.(comments.length + 1);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    } finally {
      setIsLoading(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.commentHeader}>
        <Text style={[styles.authorName, { color: colors.text }]}>{item.author.name}</Text>
        <Text style={[styles.commentDate, { color: colors.textMuted }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.commentContent, { color: colors.textSecondary }]}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowComments(!showComments)}
      >
        <Ionicons 
          name={showComments ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={[styles.toggleText, { color: colors.primary }]}>
          {comments.length} commentaire{comments.length > 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>

      {showComments && (
        <View style={styles.commentsContainer}>
          {user && (
            <View style={[styles.addCommentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.commentInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor={colors.textMuted}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || isLoading}
              >
                <Ionicons 
                  name="send" 
                  size={16} 
                  color={colors.white} 
                />
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.commentsList}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  commentsContainer: {
    marginTop: 8,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    marginRight: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    maxHeight: 200,
  },
  commentItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
});
