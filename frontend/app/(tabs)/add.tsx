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
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Recipe } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function AddRecipeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [image, setImage] = useState<string | null>(null);
  const [imageDim, setImageDim] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Nouveaux champs
  const [servings, setServings] = useState<string>('');
  const [prepTime, setPrepTime] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const PRESET_TAGS = ['Vegan', 'Italien', 'Dessert', 'Rapide', 'Sans gluten', 'Healthy', 'Boisson'];
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const RATIO_OPTIONS: { key: string; label: string; value: number }[] = [
    { key: '1:1', label: '1:1', value: 1 },
    { key: '4:5', label: '4:5', value: 4 / 5 },
    { key: '5:7', label: '5:7', value: 5 / 7 },
    { key: '3:4', label: '3:4', value: 3 / 4 },
    { key: '3:5', label: '3:5', value: 3 / 5 },
    { key: '2:3', label: '2:3', value: 2 / 3 },
  ];
  const [selectedRatio, setSelectedRatio] = useState<number>(1);

  const pickImage = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.95,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      if (asset.width && asset.height) setImageDim({ width: asset.width, height: asset.height });
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

  const cropToRatio = (w: number, h: number, aspect: number) => {
    const targetW = Math.min(w, Math.floor(h * aspect));
    const targetH = Math.min(h, Math.floor(w / aspect));
    const cropW = Math.floor(Math.min(w, targetW));
    const cropH = Math.floor(Math.min(h, targetH));
    const originX = Math.floor((w - cropW) / 2);
    const originY = Math.floor((h - cropH) / 2);
    return { originX, originY, cropW, cropH };
  };

  const addPresetTag = (tag: string) => {
    if (!tags.includes(tag)) setTags([...tags, tag]);
  };

  const addTagFromInput = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let finalImage = image!;

      if (image && imageDim) {
        const { width, height } = imageDim;
        const { originX, originY, cropW, cropH } = cropToRatio(width, height, selectedRatio);
        const actions: ImageManipulator.Action[] = [
          { crop: { originX, originY, width: cropW, height: cropH } },
        ];
        const LONG_EDGE = 1440;
        const targetW = cropW >= cropH ? LONG_EDGE : Math.round(LONG_EDGE * (cropW / cropH));
        const targetH = cropH > cropW ? LONG_EDGE : Math.round(LONG_EDGE * (cropH / cropW));
        actions.push({ resize: { width: targetW, height: targetH } });

        const res = await ImageManipulator.manipulateAsync(
          (image.startsWith('data:') ? undefined : image) || image,
          actions,
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (res.base64) finalImage = `data:image/jpeg;base64,${res.base64}`;
        else if (res.uri) finalImage = res.uri;
      }

      // Créer la recette via l'API backend
      const recipeData = {
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.filter(ing => ing.trim()),
        instructions: instructions.filter(inst => inst.trim()),
        image: finalImage,
        author: {
          id: user!.id,
          name: `${user!.firstName} ${user!.lastName}`,
          avatar: user!.avatar || 'https://example.com/default-avatar.jpg'
        },
        servings: servings ? Number(servings) : undefined,
        prepTimeMinutes: prepTime ? Number(prepTime) : undefined,
        difficulty: difficulty || undefined,
        tags: tags.length ? tags : undefined,
      };

      const newRecipe = await apiService.createRecipe(recipeData);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success! 🎉', 'Your recipe has been published successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setDescription('');
            setIngredients(['']);
            setInstructions(['']);
            setImage(null);
            setImageDim(null);
            setServings('');
            setPrepTime('');
            setDifficulty(null);
            setTags([]);
            setTagInput('');
            router.push('/(tabs)/');
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Image Picker + Live Preview */}
          <TouchableOpacity style={[styles.imagePicker, { backgroundColor: colors.surface, borderColor: colors.border }, image && { borderStyle: 'solid' }]} onPress={pickImage} activeOpacity={0.9}>
            {image ? (
              <View style={[styles.previewWrapper, { aspectRatio: selectedRatio, backgroundColor: colors.surface }] }>
                <Image source={{ uri: image }} style={styles.previewImage} contentFit="cover" />
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera" size={40} color={colors.textMuted} />
                <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Aspect Ratio Selector */}
          <View style={styles.ratioRow}>
            {RATIO_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.key} onPress={() => setSelectedRatio(opt.value)} style={[styles.ratioPill, { backgroundColor: colors.surface, borderColor: colors.border }, selectedRatio === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Text style={[styles.ratioPillText, { color: colors.text }, selectedRatio === opt.value && { color: colors.white }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meta fields */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={[styles.metaLabel, { color: colors.text }]}>Time (min)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="Ex: 30"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.metaCol}>
              <Text style={[styles.metaLabel, { color: colors.text }]}>Servings</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={servings}
                onChangeText={setServings}
                placeholder="Ex: 4"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.text, marginBottom: 8 }]}>Difficulty</Text>
            <View style={styles.diffRow}>
              {(['easy','medium','hard'] as const).map(level => (
                <TouchableOpacity key={level} onPress={() => setDifficulty(level)} style={[styles.diffPill, { backgroundColor: colors.surface, borderColor: colors.border }, difficulty === level && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[styles.diffPillText, { color: colors.text }, difficulty === level && { color: colors.white }]}>
                    {level === 'easy' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Recipe Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter recipe title..."
              placeholderTextColor={colors.textMuted}
              maxLength={80}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>{title.length}/80</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your recipe..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>{description.length}/500</Text>
          </View>

          {/* Tags (preset + free) */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {PRESET_TAGS.map(tag => (
                <TouchableOpacity key={tag} onPress={() => addPresetTag(tag)} style={[styles.tagChip, { backgroundColor: colors.surface, borderColor: colors.border }, tags.includes(tag) && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[styles.tagChipText, { color: colors.text }, tags.includes(tag) && { color: colors.white }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.input, styles.tagInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag and press +"
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={addTagFromInput}
              />
              <TouchableOpacity style={styles.addTagBtn} onPress={addTagFromInput}>
                <Ionicons name="add" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
            {tags.length > 0 && (
              <View style={styles.tagsSelectedRow}>
                {tags.map(tag => (
                  <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={styles.tagSelected}>
                    <Text style={styles.tagSelectedText}>{tag}</Text>
                    <Ionicons name="close" size={14} color={colors.white} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: colors.text }]}>Ingredients</Text>
              <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.listItem}>
                <TextInput
                  style={[styles.input, styles.listInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={ingredient}
                  onChangeText={(value) => updateIngredient(index, value)}
                  placeholder={`Ingredient ${index + 1}...`}
                  placeholderTextColor={colors.textMuted}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: colors.text }]}>Instructions</Text>
              <TouchableOpacity onPress={addInstruction} style={styles.addButton}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {instructions.map((instruction, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={[styles.stepNumber, { color: colors.primary }]}>{index + 1}.</Text>
                <TextInput
                  style={[styles.input, styles.listInput, styles.instructionInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={instruction}
                  onChangeText={(value) => updateInstruction(index, value)}
                  placeholder={`Step ${index + 1}...`}
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
                {instructions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeInstruction(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={20} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Publish Button */}
          <TouchableOpacity
            style={[styles.publishButton, { backgroundColor: colors.primary }, isLoading && styles.publishButtonDisabled]}
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
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginVertical: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  previewWrapper: {
    width: '100%',
    backgroundColor: Colors.light.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.light.textMuted,
  },
  ratioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  ratioPill: {
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  ratioPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  ratioPillText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
  },
  ratioPillTextActive: {
    color: Colors.light.white,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 8,
  },
  diffPill: {
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  diffPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  diffPillText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
  },
  diffPillTextActive: {
    color: Colors.light.white,
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
  helperText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 6,
  },
  textArea: {
    minHeight: 100,
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tagChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tagChipText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: Colors.light.white,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsSelectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tagSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagSelectedText: {
    color: Colors.light.white,
    fontSize: 12,
    fontWeight: '700',
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
    opacity: 0.7,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.white,
  },
});