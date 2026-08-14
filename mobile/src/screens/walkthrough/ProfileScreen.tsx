import React, { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMyProfile } from '../../api/auth';
import { Badge, Button, Card } from '../../components';
import { subscriptionAccessTiers } from '../../data/walkthroughData';
import { useAuthStore } from '../../store/authStore';
import { LanguagePreferenceScreen } from './LanguagePreferenceScreen';
import { PersonalInformationScreen } from './PersonalInformationScreen';
import { ScreenShell } from './ScreenShell';
import { WhodasAssessmentScreen } from './WhodasAssessmentScreen';

type ProfileView = 'main' | 'personalInfo' | 'whodas' | 'language';

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

export function ProfileScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const signOut = useAuthStore((state) => state.signOut);

  const [view, setView] = useState<ProfileView>('main');
  const [savingToggle, setSavingToggle] = useState<'notifications' | 'budgetAlerts' | null>(null);

  function confirmSignOut() {
    Alert.alert('Sign out?', "You'll need to log in again to access your account.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handleToggle(key: 'notificationsEnabled' | 'budgetAlertsEnabled', value: boolean) {
    if (!token) return;
    setSavingToggle(key === 'notificationsEnabled' ? 'notifications' : 'budgetAlerts');
    try {
      const res = await updateMyProfile(token, { [key]: value });
      setSession(token, res.user);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSavingToggle(null);
    }
  }

  if (view === 'personalInfo' && token && user) {
    return (
      <PersonalInformationScreen
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

  if (view === 'whodas') {
    return <WhodasAssessmentScreen onBack={() => setView('main')} />;
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

  const goalsSummary = user?.goals && user.goals.length > 0 ? user.goals.join(', ') : 'No goals added yet';
  const languageLabel = LANGUAGE_LABELS[user?.language ?? 'en'] ?? 'English';

  return (
    <ScreenShell eyebrow="Account" title="Profile" subtitle="Manage your account and preferences.">
      <Card>
        <Text className="font-heading text-h2 text-text-dark">{user?.fullName ?? 'Your account'}</Text>
        <Text className="mt-2 font-body text-body text-text-mid">{user?.email}</Text>
      </Card>

      <SettingsRow
        icon="person"
        title="Personal Information"
        subtitle={user?.location || 'Name, NDIS number, and location'}
        onPress={() => setView('personalInfo')}
      />
      <SettingsRow icon="flag" title="My NDIS Goals" subtitle={goalsSummary} onPress={() => setView('personalInfo')} />
      <SettingsRow icon="clipboard" title="WHODAS Assessment" subtitle="Pending client confirmation" onPress={() => setView('whodas')} />
      <SettingsRow icon="language" title="Language" subtitle={languageLabel} onPress={() => setView('language')} />

      <Card style={{ marginTop: 16 }}>
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-body-bold text-body text-text-dark">Notifications</Text>
            <Text className="mt-0.5 font-body text-caption text-text-mid">Booking, budget, and education updates.</Text>
          </View>
          <Switch
            accessibilityLabel="Notifications"
            disabled={savingToggle === 'notifications'}
            value={user?.notificationsEnabled ?? true}
            onValueChange={(value) => handleToggle('notificationsEnabled', value)}
            trackColor={{ false: '#E8E0D6', true: '#0B4F6C' }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View
          className="flex-row items-center justify-between gap-3 border-border"
          style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1 }}
        >
          <View className="min-w-0 flex-1">
            <Text className="font-body-bold text-body text-text-dark">Budget alerts</Text>
            <Text className="mt-0.5 font-body text-caption text-text-mid">Warn me when a funding category is close to its limit.</Text>
          </View>
          <Switch
            accessibilityLabel="Budget alerts"
            disabled={savingToggle === 'budgetAlerts'}
            value={user?.budgetAlertsEnabled ?? true}
            onValueChange={(value) => handleToggle('budgetAlertsEnabled', value)}
            trackColor={{ false: '#E8E0D6', true: '#0B4F6C' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <Card variant="highlight" style={{ marginTop: 16 }}>
        <View className="flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-teal-dark">Subscription access</Text>
            <Text className="mt-2 font-heading text-h2 text-text-dark">Permission gating only</Text>
          </View>
          <Badge label="No payments" tone="info" />
        </View>
        <Text className="mt-2 font-body text-body text-text-mid">
          Tiers unlock walkthrough features only. Pricing waits for the decision issue, and this app does not collect cards, banking details, or process payments.
        </Text>
        <View className="mt-4 gap-3">
          {subscriptionAccessTiers.map((tier) => (
            <View key={tier.tier} className="rounded-md border border-border bg-white p-3">
              <View className="flex-row flex-wrap items-start justify-between gap-2">
                <Text className="font-body-medium text-caption text-text-dark">{tier.tier}</Text>
                <Badge label={tier.enabled ? 'Enabled' : 'Later'} tone={tier.enabled ? 'success' : 'neutral'} />
              </View>
              <Text className="mt-1 font-body text-caption text-text-mid">{tier.summary}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View className="mt-2">
        <Button label="Sign out" variant="outline" onPress={confirmSignOut} />
      </View>
    </ScreenShell>
  );
}
