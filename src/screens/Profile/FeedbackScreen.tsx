import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserProfile } from '../../api/services/userService';
import { useThemeStore } from '../../store/useThemeStore';
import apiClient from '../../api/apiClient';
import { useNotificationStore } from '../../store/useNotificationStore';

const THEME_COLOR = '#FF8C00';

export default function FeedbackScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { showNotification } = useNotificationStore();
  const { data: profile } = useUserProfile();

  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const maxChars = 500;

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      setHasError(true);
      showNotification('Please enter your feedback text.', 'error');
      return;
    }

    setHasError(false);
    setIsSubmitting(true);

    try {
      const deviceInfo = `${Platform.OS === 'ios' ? 'iOS' : 'Android'} ${Platform.Version}`;
      const payload = {
        feedbackText: feedbackText.trim(),
        user: profile?._id || null,
        deviceInfo,
      };

      await apiClient.post('feedback', payload);

      setFeedbackText('');
      setIsSuccessModalVisible(true);
    } catch (err: any) {
      console.log('Error submitting feedback:', err);
      showNotification('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>App Feedback</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubbles-outline" size={40} color={THEME_COLOR} />
            </View>
            <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
              Share your thoughts
            </Text>
            <Text style={[styles.cardSubtitle, isDark && styles.cardSubtitleDark]}>
              Your feedback helps us make Gadal Market better. Report bugs, request features, or tell us what you love!
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.textArea,
                  isDark && styles.textAreaDark,
                  hasError && styles.textAreaError,
                ]}
                placeholder="Write your feedback here..."
                placeholderTextColor={isDark ? '#888' : '#aaa'}
                multiline
                numberOfLines={6}
                value={feedbackText}
                onChangeText={(text) => {
                  if (text.length <= maxChars) {
                    setFeedbackText(text);
                    if (text.trim()) setHasError(false);
                  }
                }}
              />
              <Text style={[styles.charCount, isDark && styles.charCountDark]}>
                {feedbackText.length}/{maxChars}
              </Text>
            </View>

            {hasError && <Text style={styles.errorText}>Feedback cannot be empty.</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#fff" style={styles.btnIcon} />
                  <Text style={styles.submitBtnText}>Submit Feedback</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isSuccessModalVisible}
        onRequestClose={() => setIsSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, isDark && styles.modalBoxDark]}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle-outline" size={60} color="#4CAF50" />
            </View>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Thank You!</Text>
            <Text style={[styles.modalDescription, isDark && styles.modalDescriptionDark]}>
              Your feedback has been successfully submitted. We appreciate your contribution to making Gadal Market better!
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setIsSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#0F1E29',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerDark: {
    backgroundColor: '#152430',
    borderBottomColor: '#1A2F40',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTitleDark: {
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    alignItems: 'center',
  },
  cardDark: {
    backgroundColor: '#152430',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  cardTitleDark: {
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  cardSubtitleDark: {
    color: '#9AAEC4',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 10,
  },
  textArea: {
    width: '100%',
    minHeight: 140,
    maxHeight: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
  },
  textAreaDark: {
    backgroundColor: '#0F1E29',
    borderColor: '#2A3C4D',
    color: '#fff',
  },
  textAreaError: {
    borderColor: '#FF3B30',
  },
  charCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    fontSize: 12,
    color: '#94A3B8',
  },
  charCountDark: {
    color: '#64748B',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingLeft: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: THEME_COLOR,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    elevation: 10,
  },
  modalBoxDark: {
    backgroundColor: '#152430',
  },
  successIconWrapper: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
  },
  modalTitleDark: {
    color: '#fff',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalDescriptionDark: {
    color: '#9AAEC4',
  },
  closeBtn: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
