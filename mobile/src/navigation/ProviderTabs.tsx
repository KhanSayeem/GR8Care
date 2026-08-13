import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';
import { SetAvailabilityScreen } from '../screens/walkthrough/SetAvailabilityScreen';
import { WellnessScreen } from '../screens/walkthrough/WellnessScreen';
import { tabIcon } from './tabIcons';

export type ProviderTabParamList = {
  Dashboard: undefined;
  Availability: undefined;
  Resources: undefined;
  Templates: undefined;
  Workforce: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export function ProviderTabs() {
  const role = useAuthStore((state) => state.user?.role);
  const roleLabel = role === 'supportWorker' ? 'Support Worker' : 'Provider';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0B4F6C',
        tabBarInactiveTintColor: '#4A5568',
        tabBarStyle: { borderTopColor: '#E8E0D6' },
        tabBarIconStyle: { marginTop: 4 },
      }}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}>
        {({ navigation }) => (
          <HomeScreen
            roleLabel={roleLabel}
            providerSection="dashboard"
            onOpenAvailability={() => navigation.navigate('Availability')}
            onOpenEducation={() => navigation.navigate('Resources')}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Availability"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
        component={SetAvailabilityScreen}
      />
      <Tab.Screen name="Resources" options={{ tabBarLabel: 'Resources', tabBarIcon: tabIcon('book', 'book-outline') }} component={EducationLibraryScreen} />
      <Tab.Screen name="Templates" options={{ tabBarLabel: 'Templates', tabBarIcon: tabIcon('document-text', 'document-text-outline') }}>
        {() => <HomeScreen roleLabel={roleLabel} providerSection="templates" />}
      </Tab.Screen>
      <Tab.Screen name="Workforce" options={{ tabBarLabel: 'Workforce', tabBarIcon: tabIcon('briefcase', 'briefcase-outline') }} component={WellnessScreen} />
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Account', tabBarIcon: tabIcon('person', 'person-outline') }} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
