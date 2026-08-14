import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminDashboardScreen } from '../screens/walkthrough/AdminDashboardScreen';
import { ProviderVerificationScreen } from '../screens/walkthrough/ProviderVerificationScreen';
import { ReportsScreen } from '../screens/walkthrough/ReportsScreen';
import { UserManagementScreen } from '../screens/walkthrough/UserManagementScreen';
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
        {({ navigation }) => (
          <AdminDashboardScreen
            onOpenUsers={() => navigation.navigate('Users')}
            onOpenVerification={() => navigation.navigate('Verification')}
            onOpenReports={() => navigation.navigate('Reports')}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Users" options={{ tabBarLabel: 'Users', tabBarIcon: tabIcon('people', 'people-outline') }} component={UserManagementScreen} />
      <Tab.Screen
        name="Verification"
        options={{ tabBarLabel: 'Verify', tabBarIcon: tabIcon('shield-checkmark', 'shield-checkmark-outline') }}
        component={ProviderVerificationScreen}
      />
      <Tab.Screen name="Reports" options={{ tabBarLabel: 'Reports', tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline') }} component={ReportsScreen} />
    </Tab.Navigator>
  );
}
