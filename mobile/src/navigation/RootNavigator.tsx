import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ParticipantTabs } from './ParticipantTabs';
import { ProviderTabs } from './ProviderTabs';
import { AdminTabs } from './AdminTabs';

// Caregivers share the participant experience per the ICT302 plan — only
// participant, provider, and admin get dedicated tab navigators.
function RoleShell() {
  const role = useAuthStore((state) => state.user?.role);

  switch (role) {
    case 'provider':
      return <ProviderTabs />;
    case 'admin':
      return <AdminTabs />;
    case 'participant':
    case 'caregiver':
    default:
      return <ParticipantTabs />;
  }
}

export function RootNavigator() {
  const user = useAuthStore((state) => state.user);

  return <NavigationContainer>{user ? <RoleShell /> : <LoginScreen />}</NavigationContainer>;
}
