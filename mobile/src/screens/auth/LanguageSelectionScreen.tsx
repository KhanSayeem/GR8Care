import React, { useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';

interface LanguageOption {
  code: string;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'ar', label: 'Arabic' },
];

interface LanguageSelectionScreenProps {
  initialLanguage?: string;
  onContinue: (language: string) => void;
}

export function LanguageSelectionScreen({ initialLanguage = 'en', onContinue }: LanguageSelectionScreenProps) {
  const [selected, setSelected] = useState(initialLanguage);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <View className="flex-1 bg-cream px-6 pt-16">
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <Text className="font-heading text-h1 text-text-dark">Choose your language</Text>
          <Text className="mt-2 font-body text-body text-text-mid">You can change this later from your account settings.</Text>

          <View className="mt-6 gap-3">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = selected === option.code;
              return (
                <Pressable
                  key={option.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(option.code)}
                  className={`h-14 flex-row items-center justify-between rounded-md border px-4 ${
                    isSelected ? 'border-teal-dark bg-teal-light' : 'border-border bg-white'
                  }`}
                >
                  <Text className={`font-body-medium text-body ${isSelected ? 'text-teal-dark' : 'text-text-dark'}`}>{option.label}</Text>
                  {isSelected ? <Ionicons name="checkmark-circle" color="#0B4F6C" size={22} /> : null}
                </Pressable>
              );
            })}
          </View>

          <View className="mt-8">
            <Button label="Continue" variant="primary" onPress={() => onContinue(selected)} />
          </View>
        </View>
      </View>
    </>
  );
}
