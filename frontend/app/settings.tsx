import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { router } from 'expo-router';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { useLanguage, Locale } from '../context/LanguageContext';

export default function SettingsScreen() {
  const { preference, setPreference } = useTheme();
  const { locale, setLocale, t } = useLanguage();

  const onSelectPref = async (pref: ThemePreference) => {
    await setPreference(pref);
  };

  const LANGS: { code: Locale; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { code: 'fr', label: 'Français', icon: 'flag' },
    { code: 'en', label: 'English', icon: 'flag' },
    { code: 'de', label: 'Deutsch', icon: 'flag' },
    { code: 'zh', label: '中文', icon: 'flag' },
    { code: 'ja', label: '日本語', icon: 'flag' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('settings_title')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings_appearance')}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.pill, preference === 'system' && styles.pillActive]} onPress={() => onSelectPref('system')}>
              <Ionicons name="phone-portrait" size={16} color={preference === 'system' ? Colors.light.white : Colors.light.text} />
              <Text style={[styles.pillText, preference === 'system' && styles.pillTextActive]}>{t('theme_system')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, preference === 'light' && styles.pillActive]} onPress={() => onSelectPref('light')}>
              <Ionicons name="sunny" size={16} color={preference === 'light' ? Colors.light.white : Colors.light.text} />
              <Text style={[styles.pillText, preference === 'light' && styles.pillTextActive]}>{t('theme_light')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pill, preference === 'dark' && styles.pillActive]} onPress={() => onSelectPref('dark')}>
              <Ionicons name="moon" size={16} color={preference === 'dark' ? Colors.light.white : Colors.light.text} />
              <Text style={[styles.pillText, preference === 'dark' && styles.pillTextActive]}>{t('theme_dark')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings_language')}</Text>
          {LANGS.map((l) => (
            <TouchableOpacity key={l.code} style={styles.item} onPress={() => setLocale(l.code)}>
              <Ionicons name={l.icon} size={20} color={Colors.light.text} />
              <Text style={styles.itemText}>{l.label}</Text>
              {locale === l.code ? (
                <Ionicons name="checkmark" size={18} color={Colors.light.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings_account')}</Text>
          <TouchableOpacity style={styles.item} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person" size={20} color={Colors.light.text} />
            <Text style={styles.itemText}>{t('settings_view_profile')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  pillTextActive: {
    color: Colors.light.white,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
}); 