import React from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card } from '../../components';
import { whodasDomains } from '../../data/walkthroughData';

interface WhodasAssessmentScreenProps {
  onBack: () => void;
}

export function WhodasAssessmentScreen({ onBack }: WhodasAssessmentScreenProps) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to profile"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">WHODAS Assessment</Text>
          </View>

          <Card variant="highlight" className="mt-5">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-heading text-h2 text-text-dark">Coming soon</Text>
              <Badge label="Pending" tone="warning" />
            </View>
            <Text className="mt-2 font-body text-body text-text-mid">
              A guided WHODAS assessment is planned for a future update, once the scoring approach is confirmed. This screen does not score,
              diagnose, or replace a qualified assessment.
            </Text>
          </Card>

          <Text className="mt-6 font-caption text-label uppercase text-text-mid">What WHODAS covers</Text>
          <View className="mt-3 gap-3">
            {whodasDomains.map((domain) => (
              <Card key={domain.title}>
                <Text className="font-body-bold text-body text-text-dark">{domain.title}</Text>
                <Text className="mt-1 font-body text-caption text-text-mid">{domain.body}</Text>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
