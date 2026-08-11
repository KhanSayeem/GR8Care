import React from 'react';
import { ScrollView, Text, View } from 'react-native';

interface ScreenShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function ScreenShell({ eyebrow, title, subtitle, children }: ScreenShellProps) {
  return (
    <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 132 }}>
      <View className="w-full self-center" style={{ maxWidth: 390 }}>
        <Text className="font-caption text-label uppercase text-coral">{eyebrow}</Text>
        <Text className="mt-2 font-heading text-display-sm text-text-dark">{title}</Text>
        <Text className="mt-2 font-body text-body text-text-mid">{subtitle}</Text>
        <View className="mt-5 gap-4">{children}</View>
      </View>
    </ScrollView>
  );
}
