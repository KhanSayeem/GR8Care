import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Button, Card } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { LanguagePreferenceScreen } from './LanguagePreferenceScreen';
import { ScreenShell } from './ScreenShell';

type SettingsView = 'main' | 'language';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  vi: 'Vietnamese',
  zh: 'Mandarin',
  ar: 'Arabic',
};

export function AdminSettingsScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const signOut = useAuthStore((state) => state.signOut);

  const [view, setView] = useState<SettingsView>('main');

  function confirmSignOut() {
    Alert.alert('Sign out?', "You'll need to log in again to access your account.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (view === 'language' && token && user) {
    return (
      <LanguagePreferenceScreen
        token={token}
        user={user}
        onBack={() => setView('main')}
        onSaved={(updated) => {
          setSession(token, updated);
          setView('main');
        }}
      />
    );
  }

  const languageLabel = LANGUAGE_LABELS[user?.language ?? 'en'] ?? 'English';

  return (
    <ScreenShell eyebrow="Admin" title="Settings" subtitle="Manage your account.">
      <Card>
        <Text className="font-heading text-h2 text-text-dark">{user?.fullName ?? 'Your account'}</Text>
        <Text className="mt-2 font-body text-body text-text-mid">{user?.email}</Text>
      </Card>

      <Card>
        <Text className="font-body-bold text-body text-text-dark">Language</Text>
        <Text className="mt-1 font-body text-caption text-text-mid">{languageLabel}</Text>
        <Button label="Change language" variant="outline" className="mt-3" onPress={() => setView('language')} />
      </Card>

      <Button label="Sign out" variant="outline" onPress={confirmSignOut} />
    </ScreenShell>
  );
}
