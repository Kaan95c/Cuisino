import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen() {
  const { t } = useLanguage();
  const { 
    colors, 
    isDark, 
    themeMode, 
    colorScheme,
    setThemeMode, 
    setColorScheme 
  } = useTheme();

  const handleThemeChange = async (mode: 'light' | 'dark' | 'system') => {
    await Haptics.selectionAsync();
    await setThemeMode(mode);
  };

  const handleColorSchemeChange = async (scheme: 'purple' | 'blue' | 'green' | 'orange' | 'pink') => {
    await Haptics.selectionAsync();
    await setColorScheme(scheme);
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    router.back();
  };

  const colorSchemeOptions = [
    { key: 'purple', name: 'Purple', color: '#7C5CFC' },
    { key: 'blue', name: 'Blue', color: '#3B82F6' },
    { key: 'green', name: 'Green', color: '#10B981' },
    { key: 'orange', name: 'Orange', color: '#F59E0B' },
    { key: 'pink', name: 'Pink', color: '#EC4899' },
  ] as const;

  const renderColorSchemeOption = (option: typeof colorSchemeOptions[0]) => {
    const isSelected = colorScheme === option.key;
    
    return (
      <TouchableOpacity
        key={option.key}
        style={[
          styles.colorOption,
          {
            borderColor: isSelected ? option.color : colors.border,
            backgroundColor: colors.surface,
          },
        ]}
        onPress={() => handleColorSchemeChange(option.key)}
        activeOpacity={0.8}
      >
        <View style={[styles.colorCircle, { backgroundColor: option.color }]} />
        <Text style={[styles.colorOptionText, { color: colors.text }]}>
          {option.name}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: option.color }]}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('settings_title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings_appearance')}
          </Text>
          
          {/* Theme Mode */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="moon" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t('settings_theme')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  {t('settings_theme_description')}
                </Text>
              </View>
            </View>
          </View>

          {/* Theme Options */}
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: themeMode === mode ? colors.primary : colors.surface,
                    borderColor: themeMode === mode ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleThemeChange(mode)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={
                    mode === 'light' ? 'sunny' : 
                    mode === 'dark' ? 'moon' : 'settings'
                  }
                  size={18}
                  color={themeMode === mode ? colors.white : colors.text}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: themeMode === mode ? colors.white : colors.text,
                    },
                  ]}
                >
                  {t(`theme_${mode}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Scheme */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="color-palette" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t('settings_color_scheme')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  {t('settings_color_scheme_description')}
                </Text>
              </View>
            </View>
          </View>

          {/* Color Options */}
          <View style={styles.colorOptions}>
            {colorSchemeOptions.map(renderColorSchemeOption)}
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings_language')}
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="language" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t('settings_change_language')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  {t('settings_language_description')}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.settingAction}>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings_account')}
          </Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t('settings_view_profile')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  {t('settings_profile_description')}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.settingAction}>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('settings_about')}
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t('settings_version')}
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                  Cuisino v1.0.0
                </Text>
              </View>
            </View>
          </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingAction: {
    padding: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 100,
    position: 'relative',
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  colorOptionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 