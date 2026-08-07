import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Card } from '../../components';
import { educationTopics } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function EducationLibraryScreen() {
  return (
    <ScreenShell
      eyebrow="Learning"
      title="NDIS education library"
      subtitle="Plain-language articles grouped around planning, assessment, and support coordination."
    >
      <View className="flex-row flex-wrap gap-2">
        <Badge label="Goals" tone="info" />
        <Badge label="WHODAS" tone="neutral" />
        <Badge label="Plan review" tone="neutral" />
        <Badge label="Worker guidance" tone="neutral" />
      </View>

      <View className="gap-3">
        {educationTopics.map((topic) => (
          <Card key={topic.title}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="font-caption text-label uppercase text-coral">{topic.category}</Text>
                <Text className="mt-1 font-heading text-h2 text-text-dark">{topic.title}</Text>
                <Text className="mt-2 font-body text-body text-text-mid">{topic.summary}</Text>
              </View>
              <Badge label={topic.readTime} tone="info" />
            </View>
          </Card>
        ))}
      </View>
    </ScreenShell>
  );
}
