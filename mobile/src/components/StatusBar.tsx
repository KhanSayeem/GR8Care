import React from 'react';
import { View, Text } from 'react-native';

interface StatusBarProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

/**
 * Multi-step progress indicator (e.g. On the Way / Arrived / Session Started).
 * Not to be confused with React Native's native status bar.
 */
export function StatusBar({ steps, currentStep }: StatusBarProps) {
  return (
    <View className="w-full flex-row items-center">
      {steps.map((step, index) => {
        const isDone = index < currentStep;
        const isActive = index === currentStep;
        const dotClass = isDone || isActive ? 'bg-teal-dark' : 'bg-border';
        const textClass = isActive ? 'text-teal-dark font-body-medium' : 'text-text-mid';

        return (
          <React.Fragment key={step}>
            <View className="items-center">
              <View className={`h-3 w-3 rounded-full ${dotClass}`} />
              <Text className={`mt-1 text-label ${textClass}`}>{step}</Text>
            </View>
            {index < steps.length - 1 && (
              <View className={`mx-2 h-0.5 flex-1 ${isDone ? 'bg-teal-dark' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
