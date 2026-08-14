import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AiEducatorBotScreen } from '../screens/walkthrough/AiEducatorBotScreen';
import { BookServiceStep1Screen } from '../screens/walkthrough/BookServiceStep1Screen';
import { BookServiceStep2Screen } from '../screens/walkthrough/BookServiceStep2Screen';
import { BookServiceStep3Screen } from '../screens/walkthrough/BookServiceStep3Screen';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { FindProvidersScreen } from '../screens/walkthrough/FindProvidersScreen';
import { FundingScreen } from '../screens/walkthrough/FundingScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { LiveTrackingScreen } from '../screens/walkthrough/LiveTrackingScreen';
import { MyBookingsScreen } from '../screens/walkthrough/MyBookingsScreen';
import { NotificationsScreen } from '../screens/walkthrough/NotificationsScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';
import { ProviderProfileScreen } from '../screens/walkthrough/ProviderProfileScreen';
import { ZoneOutreachScreen } from '../screens/walkthrough/ZoneOutreachScreen';
import { BookingDetailRecord } from '../api/booking';
import { BookingDraft, ServiceSelection, ScheduleSelection } from '../types/bookingDraft';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type TabKey =
  | 'home'
  | 'match'
  | 'providerProfile'
  | 'learn'
  | 'funding'
  | 'account'
  | 'notifications'
  | 'bookService'
  | 'bookSchedule'
  | 'bookConfirm'
  | 'bookings'
  | 'aiBot'
  | 'tracking'
  | 'zoneOutreach';

const tabs: Array<{
  key: TabKey;
  label: string;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
}> = [
  { key: 'home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { key: 'match', label: 'Providers', activeIcon: 'search', inactiveIcon: 'search-outline' },
  { key: 'learn', label: 'Learn', activeIcon: 'book', inactiveIcon: 'book-outline' },
  { key: 'funding', label: 'Funding', activeIcon: 'wallet', inactiveIcon: 'wallet-outline' },
  { key: 'account', label: 'Account', activeIcon: 'person', inactiveIcon: 'person-outline' },
];

export type ParticipantTabParamList = {
  Dashboard: undefined;
  FindProviders: undefined;
  Bookings: undefined;
  BookServiceStep1: undefined;
  BookServiceStep2: undefined;
  Funding: undefined;
  Profile: undefined;
};

export function ParticipantTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [draft, setDraft] = useState<Partial<BookingDraft>>({});
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [bookingProviderId, setBookingProviderId] = useState<string | undefined>(undefined);
  const [trackingBooking, setTrackingBooking] = useState<BookingDetailRecord | null>(null);
  const insets = useSafeAreaInsets();
  const showTabBar = !['bookService', 'bookSchedule', 'bookConfirm', 'bookings', 'providerProfile', 'aiBot', 'tracking', 'zoneOutreach'].includes(
    activeTab
  );

  const screen = useMemo(() => {
    switch (activeTab) {
      case 'match':
        return (
          <FindProvidersScreen
            onSelectProvider={(providerId) => {
              setSelectedProviderId(providerId);
              setActiveTab('providerProfile');
            }}
            onOpenZoneOutreach={() => setActiveTab('zoneOutreach')}
          />
        );
      case 'zoneOutreach':
        return <ZoneOutreachScreen onBack={() => setActiveTab('match')} />;
      case 'providerProfile':
        return selectedProviderId ? (
          <ProviderProfileScreen
            providerId={selectedProviderId}
            onBack={() => setActiveTab('match')}
            onBookSession={(provider) => {
              setBookingProviderId(provider.id);
              setActiveTab('bookService');
            }}
          />
        ) : null;
      case 'learn':
        return <EducationLibraryScreen onOpenAiBot={() => setActiveTab('aiBot')} />;
      case 'funding':
        return <FundingScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'account':
        return <ProfileScreen />;
      case 'bookService':
        return (
          <BookServiceStep1Screen
            onBack={() => setActiveTab('home')}
            onContinue={(selection: ServiceSelection) => {
              setDraft((prev) => ({ ...prev, ...selection }));
              setActiveTab('bookSchedule');
            }}
          />
        );
      case 'bookSchedule':
        return (
          <BookServiceStep2Screen
            providerId={bookingProviderId}
            onBack={() => setActiveTab('bookService')}
            onContinue={(schedule: ScheduleSelection) => {
              setDraft((prev) => ({ ...prev, ...schedule }));
              setActiveTab('bookConfirm');
            }}
          />
        );
      case 'bookConfirm':
        return draft.service && draft.provider && draft.slot && draft.date ? (
          <BookServiceStep3Screen
            draft={draft as BookingDraft}
            onBack={() => setActiveTab('bookSchedule')}
            onDone={() => {
              setDraft({});
              setBookingProviderId(undefined);
              setActiveTab('home');
            }}
          />
        ) : (
          <BookServiceStep1Screen
            onBack={() => setActiveTab('home')}
            onContinue={(selection: ServiceSelection) => {
              setDraft((prev) => ({ ...prev, ...selection }));
              setActiveTab('bookSchedule');
            }}
          />
        );
      case 'bookings':
        return (
          <MyBookingsScreen
            onBack={() => setActiveTab('home')}
            onTrackProvider={(booking) => {
              setTrackingBooking(booking);
              setActiveTab('tracking');
            }}
          />
        );
      case 'aiBot':
        return <AiEducatorBotScreen onBack={() => setActiveTab('home')} />;
      case 'tracking':
        return trackingBooking ? (
          <LiveTrackingScreen booking={trackingBooking} onBack={() => setActiveTab('bookings')} />
        ) : (
          <MyBookingsScreen
            onBack={() => setActiveTab('home')}
            onTrackProvider={(booking) => {
              setTrackingBooking(booking);
              setActiveTab('tracking');
            }}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            roleLabel="Participant"
            onOpenEducation={() => setActiveTab('learn')}
            onOpenAiBot={() => setActiveTab('aiBot')}
            onOpenTracking={(booking) => {
              setTrackingBooking(booking);
              setActiveTab('tracking');
            }}
            onOpenNotifications={() => setActiveTab('notifications')}
            onOpenBooking={() => {
              setBookingProviderId(undefined);
              setActiveTab('bookService');
            }}
            onOpenBookings={() => setActiveTab('bookings')}
            onOpenFindProviders={() => setActiveTab('match')}
          />
        );
    }
  }, [activeTab, draft, selectedProviderId, bookingProviderId, trackingBooking]);

  return (
    <View style={styles.shell}>
      <View style={styles.content}>{screen}</View>
      {showTabBar ? (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {tabs.map((tab) => {
            const focused = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabButton}
              >
                <Ionicons
                  name={focused ? tab.activeIcon : tab.inactiveIcon}
                  color={focused ? '#0B4F6C' : '#4A5568'}
                  size={24}
                />
                <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F7F3EE',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    minHeight: 72,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E0D6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    color: '#4A5568',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#0B4F6C',
  },
});
