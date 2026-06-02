import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';

const THEME_COLOR = '#FF8C00';

export default function AppSettingsScreen() {
  const navigation = useNavigation();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>App Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Settings List */}
      <View style={styles.content}>
        <View style={[styles.card, isDark && styles.cardDark]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={22} color={THEME_COLOR} />
              <Text style={[styles.settingText, isDark && styles.textDark]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#ffc68a' }}
              thumbColor={isDark ? THEME_COLOR : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Display Current Mode Details */}
        <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
          Switching to dark mode will adjust the interface to be easier on your eyes in low-light environments.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  containerDark: { backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#2C2C2C',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  textDark: { color: '#fff' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  cardDark: { backgroundColor: '#1E1E1E' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 16, color: '#333', marginLeft: 15, fontWeight: '500' },
  infoText: {
    marginTop: 15,
    marginHorizontal: 10,
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  infoTextDark: { color: '#aaa' },
});
