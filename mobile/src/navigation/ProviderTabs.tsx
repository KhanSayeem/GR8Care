import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { DocumentTemplatesScreen } from '../screens/walkthrough/DocumentTemplatesScreen';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';
import { ProviderBookingDetailScreen } from '../screens/walkthrough/ProviderBookingDetailScreen';
import { ProviderScheduleScreen } from '../screens/walkthrough/ProviderScheduleScreen';
import { SetAvailabilityScreen } from '../screens/walkthrough/SetAvailabilityScreen';
import { WellnessScreen } from '../screens/walkthrough/WellnessScreen';
import { tabIcon } from './tabIcons';

export type ProviderTabParamList = {
  Dashboard: undefined;
  Availability: undefined;
  Schedule: undefined;
  BookingDetail: { bookingId: string } | undefined;
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
            onOpenSchedule={() => navigation.navigate('Schedule')}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Availability"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      >
        {({ navigation }) => <SetAvailabilityScreen onBack={() => navigation.navigate('Dashboard')} />}
      </Tab.Screen>
      <Tab.Screen
        name="Schedule"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      >
        {({ navigation }) => (
          <ProviderScheduleScreen
            onBack={() => navigation.navigate('Dashboard')}
            onOpenAvailability={() => navigation.navigate('Availability')}
            onSelectBooking={(bookingId) => navigation.navigate('BookingDetail', { bookingId })}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="BookingDetail"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      >
        {({ navigation, route }) =>
          route.params?.bookingId ? (
            <ProviderBookingDetailScreen bookingId={route.params.bookingId} onBack={() => navigation.navigate('Schedule')} />
          ) : (
            <ProviderScheduleScreen
              onBack={() => navigation.navigate('Dashboard')}
              onOpenAvailability={() => navigation.navigate('Availability')}
              onSelectBooking={(bookingId) => navigation.navigate('BookingDetail', { bookingId })}
            />
          )
        }
      </Tab.Screen>
      <Tab.Screen name="Resources" options={{ tabBarLabel: 'Resources', tabBarIcon: tabIcon('book', 'book-outline') }} component={EducationLibraryScreen} />
      <Tab.Screen name="Templates" options={{ tabBarLabel: 'Templates', tabBarIcon: tabIcon('document-text', 'document-text-outline') }} component={DocumentTemplatesScreen} />
      <Tab.Screen name="Workforce" options={{ tabBarLabel: 'Workforce', tabBarIcon: tabIcon('briefcase', 'briefcase-outline') }} component={WellnessScreen} />
      <Tab.Screen name="Settings" options={{ tabBarLabel: 'Account', tabBarIcon: tabIcon('person', 'person-outline') }} component={ProfileScreen} />
    </Tab.Navigator>
  );
}
