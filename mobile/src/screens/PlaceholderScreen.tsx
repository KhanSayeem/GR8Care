import React from 'react';
import { View, Text } from 'react-native';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-cream px-6">
      <Text className="font-heading text-h1 text-text-dark">{title}</Text>
      <Text className="mt-2 text-center font-body text-body text-text-mid">
        This screen is a placeholder — build it as part of the Week 5+ feature backlog.
      </Text>
    </View>
  );
}
