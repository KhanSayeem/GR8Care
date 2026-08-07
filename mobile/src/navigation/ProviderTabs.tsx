import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { MatchingScreen } from '../screens/walkthrough/MatchingScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';
import { WellnessScreen } from '../screens/walkthrough/WellnessScreen';
import { tabIcon } from './tabIcons';

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
        {() => <HomeScreen roleLabel="Support Worker" />}
      </Tab.Screen>
      <Tab.Screen name="Schedule" options={{ tabBarLabel: 'Wellness', tabBarIcon: tabIcon('heart', 'heart-outline') }} component={WellnessScreen} />
      <Tab.Screen name="Requests" options={{ tabBarLabel: 'Match', tabBarIcon: tabIcon('search', 'search-outline') }} component={MatchingScreen} />
      <Tab.Screen name="Documents" options={{ tabBarLabel: 'Learn', tabBarIcon: tabIcon('book', 'book-outline') }} component={EducationLibraryScreen} />
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Account', tabBarIcon: tabIcon('person', 'person-outline') }} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
