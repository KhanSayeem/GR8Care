import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { FundingScreen } from '../screens/walkthrough/FundingScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { MatchingScreen } from '../screens/walkthrough/MatchingScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';
import { tabIcon } from './tabIcons';

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
        {() => <HomeScreen roleLabel="Participant" />}
      </Tab.Screen>
      <Tab.Screen name="FindProviders" options={{ tabBarLabel: 'Match', tabBarIcon: tabIcon('search', 'search-outline') }} component={MatchingScreen} />
      <Tab.Screen name="Bookings" options={{ tabBarLabel: 'Learn', tabBarIcon: tabIcon('book', 'book-outline') }} component={EducationLibraryScreen} />
      <Tab.Screen name="Funding" options={{ tabBarIcon: tabIcon('wallet', 'wallet-outline') }} component={FundingScreen} />
      <Tab.Screen name="Profile" options={{ tabBarLabel: 'Account', tabBarIcon: tabIcon('person', 'person-outline') }} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
