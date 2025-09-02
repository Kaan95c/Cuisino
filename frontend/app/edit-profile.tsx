import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { mockCurrentUser } from '../data/mockData';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [name, setName] = useState(mockCurrentUser.name);
  const [bio, setBio] = useState(mockCurrentUser.bio);
  const [avatar, setAvatar] = useState(mockCurrentUser.avatar);

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const handleSave = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Here you would save the profile data
      Alert.alert('Succès', 'Profil mis à jour avec succès !');
      router.back();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
    }
  };

  const handleChangeAvatar = async () => {
    try {
      await Haptics.selectionAsync();
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Éditer le profil</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={[styles.saveButtonText, { color: colors.primary }]}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <TouchableOpacity 
              style={[styles.changeAvatarButton, { backgroundColor: colors.primary }]}
              onPress={handleChangeAvatar}
            >
              <Ionicons name="camera" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarLabel, { color: colors.textMuted }]}>
            Appuyez pour changer la photo
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nom d'utilisateur</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom d'utilisateur"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput, { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Parlez-nous de vous..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Additional Options */}
        <View style={styles.optionsSection}>
          <TouchableOpacity 
            style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              Alert.alert('Fonctionnalité', 'Changer l\'email sera disponible bientôt');
            }}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.optionText, { color: colors.text }]}>Changer l'email</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.optionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              Alert.alert('Fonctionnalité', 'Changer le mot de passe sera disponible bientôt');
            }}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionLeft}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.optionText, { color: colors.text }]}>Changer le mot de passe</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionButton: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
