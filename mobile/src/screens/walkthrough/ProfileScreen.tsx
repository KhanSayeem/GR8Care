import React from 'react';
import { Alert, Text, View } from 'react-native';
import { Badge, Button, Card } from '../../components';
import { subscriptionAccessTiers } from '../../data/walkthroughData';
import { useAuthStore } from '../../store/authStore';
import { ScreenShell } from './ScreenShell';

export function ProfileScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);

  function confirmSignOut() {
    Alert.alert('Sign out?', "You'll need to log in again to access your account.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScreenShell eyebrow="Account" title="Profile" subtitle="Manage your account and preferences.">
      <Card>
        <Text className="font-heading text-h2 text-text-dark">{user?.fullName ?? 'Your account'}</Text>
        <Text className="mt-2 font-body text-body text-text-mid">{user?.email}</Text>
      </Card>

      <Card variant="highlight">
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
