import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMyProfile } from '../../api/auth';
import { AuthUser } from '../../store/authStore';

interface ConsentScreenProps {
  token: string;
  user: AuthUser;
  onDone: (user: AuthUser) => void;
}

interface ConsentItem {
  key: 'dataCollection' | 'telehealthPrivacy' | 'aiTranslation' | 'providerDataSharing' | 'voiceInputProcessing' | 'readAloud';
  title: string;
  description: string;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'dataCollection',
    title: 'Data collection',
    description: 'Allow GR8Care to store the information you enter, such as goals and booking history.',
  },
  {
    key: 'telehealthPrivacy',
    title: 'Telehealth privacy',
    description: 'Acknowledge that remote sessions are not confidential unless confirmed with your provider.',
  },
  {
    key: 'aiTranslation',
    title: 'AI-assisted translation',
    description: 'Allow plain-language and translation tools to process the text you send them.',
  },
  {
    key: 'providerDataSharing',
    title: 'Provider data sharing',
    description: 'Allow relevant booking and goal details to be shared with providers you book.',
  },
  {
    key: 'voiceInputProcessing',
    title: 'Voice input processing',
    description: 'Allow voice recordings you submit to be processed to produce text.',
  },
  {
    key: 'readAloud',
    title: 'Read-aloud audio',
    description: 'Allow on-device text-to-speech to read screen content aloud when you ask for it.',
  },
];

export function ConsentScreen({ token, user, onDone }: ConsentScreenProps) {
  const [values, setValues] = useState<Record<ConsentItem['key'], boolean>>({
    dataCollection: false,
    telehealthPrivacy: false,
    aiTranslation: false,
    providerDataSharing: false,
    voiceInputProcessing: false,
    readAloud: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await updateMyProfile(token, { consent: values });
      onDone(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your consent preferences.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 24, paddingTop: 56, paddingBottom: 40 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <Text className="font-heading text-h1 text-text-dark">Consent and privacy</Text>
          <Text className="mt-2 font-body text-body text-text-mid">
            Welcome, {user.fullName.split(' ')[0]}. Choose what you're comfortable sharing - you can change these anytime from settings.
          </Text>

          <View className="mt-6 gap-3">
            {CONSENT_ITEMS.map((item) => (
              <View key={item.key} className="flex-row items-start gap-3 rounded-md border border-border bg-white p-4">
                <View className="flex-1">
                  <Text className="font-body-bold text-body text-text-dark">{item.title}</Text>
                  <Text className="mt-1 font-body text-caption text-text-mid">{item.description}</Text>
                </View>
                <Switch
                  accessibilityLabel={item.title}
                  value={values[item.key]}
                  onValueChange={(next) => setValues((prev) => ({ ...prev, [item.key]: next }))}
                  trackColor={{ false: '#E8E0D6', true: '#0B4F6C' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>

          {error ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-md border border-[#E53E3E] bg-[#FED7D7] px-3 py-2.5">
              <Ionicons name="alert-circle" color="#E53E3E" size={18} />
              <Text className="flex-1 font-body-medium text-caption text-[#E53E3E]">{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting }}
            disabled={submitting}
            onPress={handleContinue}
            className={`mt-6 h-14 flex-row items-center justify-center rounded-md bg-teal-dark px-4 ${submitting ? 'opacity-50' : ''}`}
          >
            {submitting ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-subheading text-h3 text-cream">Continue</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
