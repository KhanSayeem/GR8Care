import React from 'react';
import { View, Text } from 'react-native';

type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

const TONE_STYLES: Record<Tone, { bg: string; text: string }> = {
  neutral: { bg: 'bg-border', text: 'text-text-mid' },
  success: { bg: 'bg-provider-green', text: 'text-white' },
  warning: { bg: 'bg-warning', text: 'text-white' },
  error: { bg: 'bg-error', text: 'text-white' },
  info: { bg: 'bg-teal-light', text: 'text-teal-dark' },
};

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { bg, text } = TONE_STYLES[tone];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${bg}`}>
      <Text className={`font-caption text-label ${text}`}>{label}</Text>
    </View>
  );
}
