import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';

export type ParticipantTabParamList = {
  Dashboard: undefined;
  FindProviders: undefined;
  Bookings: undefined;
  Funding: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<ParticipantTabParamList>();

export function ParticipantTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard">{() => <PlaceholderScreen title="Dashboard" />}</Tab.Screen>
      <Tab.Screen name="FindProviders">{() => <PlaceholderScreen title="Find Providers" />}</Tab.Screen>
      <Tab.Screen name="Bookings">{() => <PlaceholderScreen title="My Bookings" />}</Tab.Screen>
      <Tab.Screen name="Funding">{() => <PlaceholderScreen title="Funding Tracker" />}</Tab.Screen>
      <Tab.Screen name="Profile">{() => <PlaceholderScreen title="Profile Settings" />}</Tab.Screen>
    </Tab.Navigator>
  );
}
