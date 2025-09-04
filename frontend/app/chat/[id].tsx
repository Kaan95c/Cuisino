import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useUnread } from '../../context/UnreadContext';
import { apiService } from '../../services/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  editedAt?: string;
  isEdited?: boolean;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { refreshUnreadCount } = useUnread();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) {
      loadMessages();
      loadConversationInfo();
      markMessagesAsRead();
    }
  }, [id]);

  const markMessagesAsRead = async () => {
    try {
      await apiService.markMessagesAsRead(id as string);
      // Refresh unread count after marking messages as read
      refreshUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const messagesData = await apiService.getMessages(id as string);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationInfo = async () => {
    try {
      const conversation = await apiService.getConversation(id as string);
      setConversationInfo(conversation);
    } catch (error) {
      console.error('Error loading conversation info:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const newMessageData = await apiService.sendMessage(id as string, messageContent);
      setMessages(prev => [...prev, newMessageData]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleLongPressMessage = (message: Message) => {
    if (message.senderId === user?.id) {
      setSelectedMessage(message);
      setShowMessageMenu(true);
    }
  };

  const handleEditMessage = () => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage.id);
      setEditText(selectedMessage.content);
      setShowMessageMenu(false);
    }
  };

  const handleDeleteMessage = () => {
    if (selectedMessage) {
      Alert.alert(
        'Supprimer le message',
        'Êtes-vous sûr de vouloir supprimer ce message ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiService.deleteMessage(selectedMessage.id);
                setMessages(prev => prev.filter(msg => msg.id !== selectedMessage.id));
                setShowMessageMenu(false);
              } catch (error) {
                console.error('Error deleting message:', error);
                Alert.alert('Erreur', 'Impossible de supprimer le message');
              }
            },
          },
        ]
      );
    }
  };

  const handleSaveEdit = async () => {
    if (editingMessage && editText.trim()) {
      try {
        const updatedMessage = await apiService.updateMessage(editingMessage, editText.trim());
        setMessages(prev => 
          prev.map(msg => 
            msg.id === editingMessage 
              ? { ...msg, content: updatedMessage.content, isEdited: true, editedAt: updatedMessage.editedAt }
              : msg
          )
        );
        setEditingMessage(null);
        setEditText('');
      } catch (error) {
        console.error('Error updating message:', error);
        Alert.alert('Erreur', 'Impossible de modifier le message');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    const isEditing = editingMessage === item.id;
    
    return (
      <Pressable
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}
        onLongPress={() => handleLongPressMessage(item)}
      >
        {!isOwnMessage && (
          <Image
            source={{ uri: item.sender.avatar || 'https://example.com/default-avatar.jpg' }}
            style={styles.messageAvatar}
            contentFit="cover"
          />
        )}
        <View style={[
          styles.messageBubble,
          { backgroundColor: isOwnMessage ? colors.primary : colors.surface },
          isOwnMessage && styles.ownMessageBubble
        ]}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editText}
                onChangeText={setEditText}
                multiline
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.editButton} onPress={handleCancelEdit}>
                  <Text style={[styles.editButtonText, { color: colors.textMuted }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={handleSaveEdit}>
                  <Text style={[styles.editButtonText, { color: colors.primary }]}>Sauver</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[
                styles.messageText,
                { color: isOwnMessage ? colors.white : colors.text }
              ]}>
                {item.content}
              </Text>
              <View style={styles.messageFooter}>
                <Text style={[
                  styles.messageTime,
                  { color: isOwnMessage ? colors.white : colors.textMuted }
                ]}>
                  {new Date(item.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                {item.isEdited && (
                  <Text style={[
                    styles.editedLabel,
                    { color: isOwnMessage ? colors.white : colors.textMuted }
                  ]}>
                    modifié
                  </Text>
                )}
              </View>
            </>
          )}
        </View>
      </Pressable>
    );
  };

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
        
        {conversationInfo?.participant && (
          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={() => conversationInfo?.participant.id && router.push(`/profile/${conversationInfo.participant.id}` as any)}
          >
            <Image
              source={{ uri: conversationInfo?.participant.avatar || 'https://example.com/default-avatar.jpg' }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <Text style={[styles.headerName, { color: colors.text }]}>
              {conversationInfo?.participant.name || 'Utilisateur'}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Message Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.messageInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Tapez un message..."
            placeholderTextColor={colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={colors.white} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Menu contextuel pour les messages */}
      <Modal
        visible={showMessageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowMessageMenu(false)}
        >
          <View style={[styles.messageMenu, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEditMessage}
            >
              <Ionicons name="create-outline" size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteMessage}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.menuText, { color: "#FF3B30" }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContainer: {
    width: '100%',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 40,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  editedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMenu: {
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
