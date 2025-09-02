import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

interface CategoryChip {
  key: string;
  label: string;
  icon: string;
  color: string;
  count?: number;
}

interface EnhancedCategoryChipsProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export default function EnhancedCategoryChips({ 
  selectedCategory, 
  onCategorySelect 
}: EnhancedCategoryChipsProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const categories: CategoryChip[] = [
    {
      key: 'all',
      label: t('chips_all'),
      icon: 'grid',
      color: '#7C5CFC',
      count: 24,
    },
    {
      key: 'dessert',
      label: t('chips_dessert'),
      icon: 'cake',
      color: '#FF6B9D',
      count: 8,
    },
    {
      key: 'breakfast',
      label: t('chips_breakfast'),
      icon: 'sunny',
      color: '#FFB84D',
      count: 6,
    },
    {
      key: 'italian',
      label: t('chips_italian'),
      icon: 'pizza',
      color: '#4ECDC4',
      count: 5,
    },
    {
      key: 'vegan',
      label: t('chips_vegan'),
      icon: 'leaf',
      color: '#45B7D1',
      count: 3,
    },
    {
      key: 'drinks',
      label: t('chips_drinks'),
      icon: 'wine',
      color: '#96CEB4',
      count: 4,
    },
    {
      key: 'fast',
      label: t('chips_fast'),
      icon: 'flash',
      color: '#FF8A5B',
      count: 7,
    },
  ];

  const handleCategoryPress = async (categoryKey: string) => {
    await Haptics.selectionAsync();
    onCategorySelect(categoryKey);
  };

  const renderCategoryChip = (category: CategoryChip) => {
    const isActive = selectedCategory === category.key;
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(0.8, { duration: 100 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 100 });
    };

    return (
      <Animated.View key={category.key} style={animatedStyle}>
        <TouchableOpacity
          style={[
            styles.chip,
            {
              backgroundColor: isActive ? category.color : colors.surface,
              borderColor: isActive ? category.color : colors.border,
            },
          ]}
          onPress={() => handleCategoryPress(category.key)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View style={[
            styles.iconContainer,
            {
              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.surfaceSecondary,
            },
          ]}>
            <Ionicons
              name={category.icon as any}
              size={18}
              color={isActive ? colors.white : category.color}
            />
          </View>
          
          <Text style={[
            styles.chipText,
            {
              color: isActive ? colors.white : colors.text,
            },
          ]}>
            {category.label}
          </Text>
          
          {category.count && (
            <View style={[
              styles.countBadge,
              {
                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.primary,
              },
            ]}>
              <Text style={[
                styles.countText,
                { color: isActive ? colors.white : colors.white },
              ]}>
                {category.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={120}
      >
        {categories.map(renderCategoryChip)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
