import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../../components';
import { useAuthStore } from '../../store/authStore';

// Placeholder login screen so the role-based shell has an unauthenticated
// entry point to route from. Full S04 UI is Week 5+ feature backlog.
export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  return (
    <View className="flex-1 items-center justify-center bg-cream px-6">
      <Text className="mb-6 font-heading text-h1 text-text-dark">GR8Care</Text>
      <Button
        label="Continue as demo participant"
        onPress={() =>
          setSession('demo-token', {
            _id: 'demo',
            fullName: 'Demo Participant',
            email: 'demo@gr8care.app',
            role: 'participant',
          })
        }
      />
    </View>
  );
}
