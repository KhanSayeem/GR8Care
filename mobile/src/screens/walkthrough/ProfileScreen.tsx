import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card } from '../../components';
import { useAuthStore } from '../../store/authStore';
import { ScreenShell } from './ScreenShell';

export function ProfileScreen() {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <ScreenShell
      eyebrow="Account"
      title="Walkthrough controls"
      subtitle="Switch roles to present participant, support worker, and coordination perspectives from the same browser session."
    >
      <Card>
        <Text className="font-heading text-h2 text-text-dark">Current session</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Seeded classroom data is used here so the frontend can run without backend services during presentation.
        </Text>
      </Card>
      <View className="mt-2">
        <Button label="Switch role" variant="outline" onPress={signOut} />
      </View>
    </ScreenShell>
  );
}
