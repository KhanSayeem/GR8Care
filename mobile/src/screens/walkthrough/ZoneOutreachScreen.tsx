import React from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card } from '../../components';

interface ZoneOutreachScreenProps {
  onBack: () => void;
}

export function ZoneOutreachScreen({ onBack }: ZoneOutreachScreenProps) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <View className="flex-1 bg-cream" style={{ padding: 20 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Notify Nearby Providers</Text>
          </View>

          <Card variant="highlight" style={{ marginTop: 20 }}>
            <View className="flex-row flex-wrap items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-caption text-label uppercase text-teal-dark">Zone outreach</Text>
                <Text className="mt-2 font-heading text-h2 text-text-dark">Not yet available</Text>
              </View>
              <Badge label="Requires email service" tone="info" />
            </View>
            <Text className="mt-2 font-body text-body text-text-mid">
              Automatically emailing nearby providers when no match is found requires a transactional email service. This app does not
              have one configured, so outreach requests are not sent automatically. Try expanding your search area or checking back
              later instead.
            </Text>
          </Card>
        </View>
      </View>
    </>
  );
}
