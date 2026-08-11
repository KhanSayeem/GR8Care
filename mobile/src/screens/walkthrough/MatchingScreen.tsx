import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Card } from '../../components';
import { compatibilityQuestions, providerMatches } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function MatchingScreen() {
  return (
    <ScreenShell
      eyebrow="Provider Matching"
      title="Compatibility demo"
      subtitle="A lightweight MVP questionnaire that compares preferences with worker profile signals."
    >
      <Card variant="highlight">
        <Text className="font-caption text-label uppercase text-teal-dark">Demo inputs</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Questionnaire signals</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          This walkthrough produces a compatibility indicator only. It is not a production matching engine, employment decision tool, or outcome guarantee.
        </Text>
        <View className="mt-4 gap-2">
          {compatibilityQuestions.map((question) => (
            <View key={question} className="rounded-md border border-border bg-white p-3">
              <Text className="font-body-medium text-caption text-text-dark">{question}</Text>
            </View>
          ))}
        </View>
      </Card>

      {providerMatches.map((provider) => (
        <Card key={provider.name}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="font-heading text-h2 text-text-dark">{provider.name}</Text>
            </View>
            <Badge label={`${provider.match}% indicator`} tone="success" />
          </View>
          <View className="flex-row flex-wrap gap-2" style={{ marginTop: 32 }}>
            <Badge label={provider.location} tone="info" />
            {provider.strengths.map((strength) => (
              <Badge key={strength} label={strength} tone="neutral" />
            ))}
          </View>
        </Card>
      ))}

      <Card variant="warning">
        <Text className="font-body-medium text-caption text-text-dark">MVP boundary</Text>
        <Text className="mt-1 font-body text-caption text-text-mid">
          Use this as a presentation demo only. Human review, provider policy, consent, and real availability checks remain outside this seeded flow.
        </Text>
      </Card>
    </ScreenShell>
  );
}
