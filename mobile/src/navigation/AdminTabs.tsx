import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Verification: undefined;
  Reports: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard">{() => <PlaceholderScreen title="Admin Dashboard" />}</Tab.Screen>
      <Tab.Screen name="Users">{() => <PlaceholderScreen title="User Management" />}</Tab.Screen>
      <Tab.Screen name="Verification">{() => <PlaceholderScreen title="Provider Verification" />}</Tab.Screen>
      <Tab.Screen name="Reports">{() => <PlaceholderScreen title="Reports & Analytics" />}</Tab.Screen>
    </Tab.Navigator>
  );
}
