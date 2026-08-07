import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { FundingScreen } from '../screens/walkthrough/FundingScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { MatchingScreen } from '../screens/walkthrough/MatchingScreen';
import { tabIcon } from './tabIcons';

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Verification: undefined;
  Reports: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
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
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'Overview', tabBarIcon: tabIcon('grid', 'grid-outline') }}>
        {() => <HomeScreen roleLabel="Coordinator" />}
      </Tab.Screen>
      <Tab.Screen name="Users" options={{ tabBarLabel: 'Match', tabBarIcon: tabIcon('people', 'people-outline') }} component={MatchingScreen} />
      <Tab.Screen name="Verification" options={{ tabBarLabel: 'Funding', tabBarIcon: tabIcon('wallet', 'wallet-outline') }} component={FundingScreen} />
      <Tab.Screen name="Reports" options={{ tabBarLabel: 'Learn', tabBarIcon: tabIcon('book', 'book-outline') }} component={EducationLibraryScreen} />
    </Tab.Navigator>
  );
}
