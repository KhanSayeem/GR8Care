import React from 'react';
import { View } from 'react-native';

type Tone = 'teal-dark' | 'coral' | 'provider-green' | 'warning' | 'error';

const TONE_STYLES: Record<Tone, string> = {
  'teal-dark': 'bg-teal-dark',
  coral: 'bg-coral',
  'provider-green': 'bg-provider-green',
  warning: 'bg-warning',
  error: 'bg-error',
};

interface ProgressBarProps {
  progress: number; // 0-1
  tone?: Tone;
}

export function ProgressBar({ progress, tone = 'teal-dark' }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-border">
      <View className={`h-full rounded-full ${TONE_STYLES[tone]}`} style={{ width: `${clamped * 100}%` }} />
    </View>
  );
}
