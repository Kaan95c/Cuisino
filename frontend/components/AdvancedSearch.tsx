import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recipe' | 'ingredient' | 'category';
  icon: string;
}

interface AdvancedSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: (query: string) => void;
  suggestions?: SearchSuggestion[];
}

export default function AdvancedSearch({ 
  value, 
  onChangeText, 
  onSearch, 
  suggestions = [] 
}: AdvancedSearchProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  const defaultSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'Pizza Margherita', type: 'recipe', icon: 'pizza' },
    { id: '2', text: 'Chocolate Cake', type: 'recipe', icon: 'cake' },
    { id: '3', text: 'Pasta', type: 'category', icon: 'restaurant' },
    { id: '4', text: 'Avocado', type: 'ingredient', icon: 'leaf' },
    { id: '5', text: 'Quick Breakfast', type: 'category', icon: 'sunny' },
  ];

  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  useEffect(() => {
    if (showSuggestions) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuggestions]);

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    Haptics.selectionAsync();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for touch events
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    onChangeText(suggestion.text);
    onSearch(suggestion.text);
    setShowSuggestions(false);
    searchInputRef.current?.blur();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleClear = () => {
    onChangeText('');
    setShowSuggestions(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.suggestionIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons 
          name={item.icon as any} 
          size={16} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.suggestionContent}>
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          {item.text}
        </Text>
        <Text style={[styles.suggestionType, { color: colors.textMuted }]}>
          {item.type}
        </Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={colors.textMuted} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer,
        { 
          backgroundColor: colors.surface,
          borderColor: isFocused ? colors.primary : colors.border,
        }
      ]}>
        <View style={styles.searchIconContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={isFocused ? colors.primary : colors.textMuted} 
          />
        </View>
        
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('search_placeholder')}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={() => onSearch(value)}
          returnKeyType="search"
        />
        
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions */}
      {showSuggestions && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.suggestionsHeader}>
            <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
              {t('search_suggestions')}
            </Text>
          </View>
          
          <FlatList
            data={displaySuggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsList}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
  },
  suggestionsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsList: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
