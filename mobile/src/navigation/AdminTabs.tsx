import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminDashboardScreen } from '../screens/walkthrough/AdminDashboardScreen';
import { AdminSettingsScreen } from '../screens/walkthrough/AdminSettingsScreen';
import { ProviderVerificationScreen } from '../screens/walkthrough/ProviderVerificationScreen';
import { ReportsScreen } from '../screens/walkthrough/ReportsScreen';
import { UserManagementScreen } from '../screens/walkthrough/UserManagementScreen';
import { tabIcon } from './tabIcons';

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Verification: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0B4F6C',
        tabBarInactiveTintColor: '#4A5568',
        // Labels off: five of them do not fit across a phone width without
        // overlapping. Each tab keeps an accessibility label instead.
        tabBarShowLabel: false,
        tabBarStyle: { borderTopColor: '#E8E0D6', height: 60, paddingTop: 6, paddingBottom: 6 },
        tabBarIconStyle: { marginTop: 0 },
      }}
    >
      <Tab.Screen name="Dashboard" options={{ tabBarLabel: 'Overview', tabBarAccessibilityLabel: 'Overview', tabBarIcon: tabIcon('grid', 'grid-outline') }}>
        {({ navigation }) => (
          <AdminDashboardScreen
            onOpenUsers={() => navigation.navigate('Users')}
            onOpenVerification={() => navigation.navigate('Verification')}
            onOpenReports={() => navigation.navigate('Reports')}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Users" options={{ tabBarLabel: 'Users', tabBarAccessibilityLabel: 'Users', tabBarIcon: tabIcon('people', 'people-outline') }} component={UserManagementScreen} />
      <Tab.Screen
        name="Verification"
        options={{ tabBarLabel: 'Verify', tabBarAccessibilityLabel: 'Verify', tabBarIcon: tabIcon('shield-checkmark', 'shield-checkmark-outline') }}
        component={ProviderVerificationScreen}
      />
      <Tab.Screen name="Reports" options={{ tabBarLabel: 'Reports', tabBarAccessibilityLabel: 'Reports', tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline') }} component={ReportsScreen} />
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Account', tabBarAccessibilityLabel: 'Account', tabBarIcon: tabIcon('person', 'person-outline') }} component={AdminSettingsScreen} />
    </Tab.Navigator>
  );
}
