import React from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SplashScreenProps {
  onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <View className="flex-1 items-center justify-center bg-cream px-6">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-teal-dark">
          <Ionicons name="heart" color="#F7F3EE" size={44} />
        </View>
        <Text className="mt-6 font-heading text-display-sm text-text-dark">GR8Care</Text>
        <Text className="mt-2 text-center font-body text-body text-text-mid">
          Connecting NDIS participants, support workers, and providers.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          className="mt-10 h-14 w-full max-w-[320px] flex-row items-center justify-center rounded-md bg-teal-dark px-4"
        >
          <Text className="font-subheading text-h3 text-cream">Get Started</Text>
        </Pressable>
      </View>
    </>
  );
}
