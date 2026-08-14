import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMyProfile } from '../../api/auth';
import { AuthUser } from '../../store/authStore';

interface LanguagePreferenceScreenProps {
  token: string;
  user: AuthUser;
  onBack: () => void;
  onSaved: (user: AuthUser) => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'ar', label: 'Arabic' },
];

export function LanguagePreferenceScreen({ token, user, onBack, onSaved }: LanguagePreferenceScreenProps) {
  const [selected, setSelected] = useState(user.language || 'en');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(code: string) {
    setSelected(code);
    setSubmitting(true);
    setError(null);

    try {
      const res = await updateMyProfile(token, { language: code });
      onSaved(res.user);
    } catch (err) {
      setSelected(user.language || 'en');
      setError(err instanceof Error ? err.message : 'Could not save your language preference.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to profile"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Language</Text>
          </View>

          <View className="mt-6 gap-3">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = selected === option.code;
              return (
                <Pressable
                  key={option.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: submitting }}
                  disabled={submitting}
                  onPress={() => handleSelect(option.code)}
                  className={`h-16 flex-row items-center justify-between rounded-md border px-4 ${
                    isSelected ? 'border-teal-dark bg-teal-light' : 'border-border bg-white'
                  }`}
                >
                  <Text className={`font-body-medium text-body ${isSelected ? 'text-teal-dark' : 'text-text-dark'}`}>{option.label}</Text>
                  {submitting && isSelected ? (
                    <ActivityIndicator color="#0B4F6C" />
                  ) : isSelected ? (
                    <Ionicons name="checkmark-circle" color="#0B4F6C" size={22} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-md border border-[#E53E3E] bg-[#FED7D7] px-3 py-2.5">
              <Ionicons name="alert-circle" color="#E53E3E" size={18} />
              <Text className="flex-1 font-body-medium text-caption text-[#E53E3E]">{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
