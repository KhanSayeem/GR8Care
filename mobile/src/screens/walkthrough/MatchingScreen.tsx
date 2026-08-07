import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Card, ProgressBar } from '../../components';
import { providerMatches } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function MatchingScreen() {
  return (
    <ScreenShell
      eyebrow="Provider Matching"
      title="Compatible providers"
      subtitle="A guided shortlist based on language, location, availability, and support goals."
    >
      {providerMatches.map((provider) => (
        <Card key={provider.name}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="font-heading text-h2 text-text-dark">{provider.name}</Text>
              <Text className="mt-1 font-body text-body text-text-mid">{provider.location}</Text>
            </View>
            <Badge label={`${provider.match}% match`} tone="success" />
          </View>
          <View className="mt-4">
            <ProgressBar progress={provider.match / 100} tone="provider-green" />
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {provider.strengths.map((strength) => (
              <Badge key={strength} label={strength} tone="neutral" />
            ))}
          </View>
        </Card>
      ))}
    </ScreenShell>
  );
}
