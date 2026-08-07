import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Card } from '../../components';
import { wellnessItems } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function WellnessScreen() {
  return (
    <ScreenShell
      eyebrow="Support Worker"
      title="Wellness and shift notes"
      subtitle="Short prompts that help workers reset, document clearly, and keep escalation boundaries visible."
    >
      <Card variant="warning">
        <Text className="font-caption text-label uppercase text-warning">Shift note helper</Text>
        <Text className="mt-2 font-heading text-h2 text-text-dark">Voice capture draft</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Participant attended the appointment, practiced travel planning, and requested a reminder card for the next visit.
        </Text>
        <View className="mt-4 gap-2">
          <Text className="font-body-medium text-caption text-text-dark">Structured note sections</Text>
          <Text className="font-body text-body text-text-mid">What happened, participant response, follow-up action.</Text>
        </View>
      </Card>

      <View className="gap-3">
        {wellnessItems.map((item) => (
          <Pressable key={item.title} accessibilityRole="button">
            <Card>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-heading text-h3 text-text-dark">{item.title}</Text>
                  <Text className="mt-1 font-body text-body text-text-mid">{item.body}</Text>
                </View>
                <Badge label={item.tag} tone="info" />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenShell>
  );
}
