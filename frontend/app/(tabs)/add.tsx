import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types';
import { mockCurrentUser } from '../../data/mockData';

export default function AddRecipeScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      const newInstructions = instructions.filter((_, i) => i !== index);
      setInstructions(newInstructions);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a recipe description');
      return false;
    }
    if (!image) {
      Alert.alert('Error', 'Please select an image for your recipe');
      return false;
    }
    const validIngredients = ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return false;
    }
    const validInstructions = instructions.filter(inst => inst.trim());
    if (validInstructions.length === 0) {
      Alert.alert('Error', 'Please add at least one instruction');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create new recipe
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.filter(ing => ing.trim()),
        instructions: instructions.filter(inst => inst.trim()),
        image: image!,
        author: mockCurrentUser,
        likes: 0,
        createdAt: new Date().toISOString(),
        isLiked: false,
        isSaved: false,
      };

      // Get existing recipes
      const existingRecipes = await AsyncStorage.getItem('userRecipes');
      const recipes = existingRecipes ? JSON.parse(existingRecipes) : [];
      
      // Add new recipe
      recipes.unshift(newRecipe);
      await AsyncStorage.setItem('userRecipes', JSON.stringify(recipes));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Success! 🎉',
        'Your recipe has been published successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setIngredients(['']);
              setInstructions(['']);
              setImage(null);
              
              // Navigate to home
              router.push('/(tabs)/');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.selectedImage} contentFit="cover" />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera" size={40} color={Colors.light.textMuted} />
                <Text style={styles.placeholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Recipe Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter recipe title..."
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your recipe..."
              placeholderTextColor={Colors.light.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Ingredients</Text>
              <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
                <Ionicons name="add" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.listItem}>
                <TextInput
                  style={[styles.input, styles.listInput]}
                  value={ingredient}
                  onChangeText={(value) => updateIngredient(index, value)}
                  placeholder={`Ingredient ${index + 1}...`}
                  placeholderTextColor={Colors.light.textMuted}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={20} color={Colors.light.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Instructions</Text>
              <TouchableOpacity onPress={addInstruction} style={styles.addButton}>
                <Ionicons name="add" size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
            {instructions.map((instruction, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <TextInput
                  style={[styles.input, styles.listInput, styles.instructionInput]}
                  value={instruction}
                  onChangeText={(value) => updateInstruction(index, value)}
                  placeholder={`Step ${index + 1}...`}
                  placeholderTextColor={Colors.light.textMuted}
                  multiline
                />
                {instructions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeInstruction(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={20} color={Colors.light.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Publish Button */}
          <TouchableOpacity
            style={[styles.publishButton, isLoading && styles.publishButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.publishButtonText}>
              {isLoading ? 'Publishing...' : 'Publish Recipe'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  imagePicker: {
    height: 200,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.light.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listInput: {
    flex: 1,
    marginBottom: 0,
  },
  instructionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginRight: 12,
    marginTop: 16,
    minWidth: 20,
  },
  addButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
    marginTop: 8,
  },
  publishButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.white,
  },
});