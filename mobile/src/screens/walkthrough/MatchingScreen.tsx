import React from 'react';
import { StatusBar, Text, View } from 'react-native';
import { Badge, Card } from '../../components';
import { compatibilityExamples, compatibilityQuestions } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function MatchingScreen() {
  return (
    <ScreenShell
      eyebrow="MVP questionnaire"
      title="Compatibility indicator demo"
      subtitle="Compare participant preferences with sample worker profile signals."
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <Card variant="highlight">
        <Text className="font-caption text-label uppercase text-teal-dark">Demo comparison</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Participant preferences</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          This questionnaire compares sample preferences with sample profile signals and produces a compatibility indicator only.
        </Text>
        <View className="mt-4 gap-2">
          {compatibilityQuestions.map((question) => (
            <View key={question.preference} className="rounded-md border border-border bg-white p-3">
              <Text className="font-body-medium text-caption text-text-dark">{question.preference}</Text>
              <Text className="mt-1 font-body text-caption text-text-mid">Worker profile signal: {question.workerSignal}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text className="font-heading text-h2 text-text-dark">Sample worker profiles</Text>
      {compatibilityExamples.map((profile) => (
        <Card key={profile.name}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="font-heading text-h2 text-text-dark">{profile.name}</Text>
            </View>
            <Badge label={profile.compatibilityIndicator} tone="success" />
          </View>
          <View className="flex-row flex-wrap gap-2" style={{ marginTop: 32 }}>
            {profile.profileSignals.map((signal) => (
              <Badge key={signal} label={signal} tone="neutral" />
            ))}
          </View>
        </Card>
      ))}

      <Card variant="warning">
        <Text className="font-body-medium text-caption text-text-dark">MVP boundary</Text>
        <Text className="mt-1 font-body text-caption text-text-mid">
          This is an illustrative comparison, not a production matching engine, employment decision, worker recommendation, or guarantee of outcomes.
        </Text>
      </Card>
    </ScreenShell>
  );
}
