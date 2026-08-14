import React, { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMyProfile } from '../../api/auth';
import { Badge, Button, Card } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { BusinessProfileScreen } from './BusinessProfileScreen';
import { LanguagePreferenceScreen } from './LanguagePreferenceScreen';
import { ScreenShell } from './ScreenShell';
import { SetAvailabilityScreen } from './SetAvailabilityScreen';

type SettingsView = 'main' | 'businessProfile' | 'availability' | 'language';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  vi: 'Vietnamese',
  zh: 'Mandarin',
  ar: 'Arabic',
};

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ marginTop: 16 }}>
      <Card className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-teal-light">
          <Ionicons name={icon} color="#0B4F6C" size={18} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-body-bold text-body text-text-dark">{title}</Text>
          <Text className="mt-0.5 font-body text-caption text-text-mid" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" color="#A0AEC0" size={18} />
      </Card>
    </Pressable>
  );
}

export function ProviderProfileSettingsScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const signOut = useAuthStore((state) => state.signOut);

  const [view, setView] = useState<SettingsView>('main');
  const [savingNotifications, setSavingNotifications] = useState(false);

  function confirmSignOut() {
    Alert.alert('Sign out?', "You'll need to log in again to access your account.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handleNotificationsToggle(value: boolean) {
    if (!token) return;
    setSavingNotifications(true);
    try {
      const res = await updateMyProfile(token, { notificationsEnabled: value });
      setSession(token, res.user);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingNotifications(false);
    }
  }

  if (view === 'businessProfile') {
    return <BusinessProfileScreen onBack={() => setView('main')} />;
  }

  if (view === 'availability') {
    return <SetAvailabilityScreen onBack={() => setView('main')} />;
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
    <ScreenShell eyebrow="Account" title="Provider Settings" subtitle="Manage your business profile and preferences.">
      <Card>
        <Text className="font-heading text-h2 text-text-dark">{user?.fullName ?? 'Your account'}</Text>
        <Text className="mt-2 font-body text-body text-text-mid">{user?.email}</Text>
      </Card>

      <SettingsRow icon="briefcase" title="Business Profile" subtitle="Location, services, languages, and rate" onPress={() => setView('businessProfile')} />
      <SettingsRow icon="calendar" title="Set Availability" subtitle="Time blocks for participant bookings" onPress={() => setView('availability')} />
      <SettingsRow icon="language" title="Language" subtitle={languageLabel} onPress={() => setView('language')} />

      <Card style={{ marginTop: 16 }}>
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-body-bold text-body text-text-dark">Notifications</Text>
            <Text className="mt-0.5 font-body text-caption text-text-mid">Instant requests and booking updates.</Text>
          </View>
          <Switch
            accessibilityLabel="Notifications"
            disabled={savingNotifications}
            value={user?.notificationsEnabled ?? true}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#E8E0D6', true: '#0B4F6C' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <Card variant="highlight" style={{ marginTop: 16 }}>
        <View className="flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-teal-dark">Payment and banking</Text>
            <Text className="mt-2 font-heading text-h2 text-text-dark">Not yet available</Text>
          </View>
          <Badge label="No payments" tone="info" />
        </View>
        <Text className="mt-2 font-body text-body text-text-mid">
          Payout setup waits for the subscription and payment decision issue. This app does not collect cards, banking details, or
          process payments.
        </Text>
      </Card>

      <View className="mt-2">
        <Button label="Sign out" variant="outline" onPress={confirmSignOut} />
      </View>
    </ScreenShell>
  );
}
