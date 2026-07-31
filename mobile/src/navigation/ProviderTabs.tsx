import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

export type ProviderTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Requests: undefined;
  Documents: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard">{() => <PlaceholderScreen title="Provider Dashboard" />}</Tab.Screen>
      <Tab.Screen name="Schedule">{() => <PlaceholderScreen title="Provider Schedule" />}</Tab.Screen>
      <Tab.Screen name="Requests">{() => <PlaceholderScreen title="Demand Signal" />}</Tab.Screen>
      <Tab.Screen name="Documents">{() => <PlaceholderScreen title="Document Templates" />}</Tab.Screen>
      <Tab.Screen name="Settings">{() => <PlaceholderScreen title="Provider Profile & Settings" />}</Tab.Screen>
    </Tab.Navigator>
  );
}
