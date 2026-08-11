import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';
import { tabIcon } from './tabIcons';

export type ProviderTabParamList = {
  Dashboard: undefined;
  Resources: undefined;
  Templates: undefined;
  Workforce: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export function ProviderTabs() {
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
        {() => <HomeScreen roleLabel="Provider" providerSection="dashboard" />}
      </Tab.Screen>
      <Tab.Screen name="Resources" options={{ tabBarLabel: 'Resources', tabBarIcon: tabIcon('book', 'book-outline') }}>
        {() => <HomeScreen roleLabel="Provider" providerSection="resources" />}
      </Tab.Screen>
      <Tab.Screen name="Templates" options={{ tabBarLabel: 'Templates', tabBarIcon: tabIcon('document-text', 'document-text-outline') }}>
        {() => <HomeScreen roleLabel="Provider" providerSection="templates" />}
      </Tab.Screen>
      <Tab.Screen name="Workforce" options={{ tabBarLabel: 'Workforce', tabBarIcon: tabIcon('briefcase', 'briefcase-outline') }}>
        {() => <HomeScreen roleLabel="Provider" providerSection="workforce" />}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Account', tabBarIcon: tabIcon('person', 'person-outline') }} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
