import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookServiceStep1Screen } from '../screens/walkthrough/BookServiceStep1Screen';
import { BookServiceStep2Screen } from '../screens/walkthrough/BookServiceStep2Screen';
import { BookServiceStep3Screen } from '../screens/walkthrough/BookServiceStep3Screen';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { FundingScreen } from '../screens/walkthrough/FundingScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { MatchingScreen } from '../screens/walkthrough/MatchingScreen';
import { NotificationsScreen } from '../screens/walkthrough/NotificationsScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';
import { BookingDraft, ServiceSelection, ScheduleSelection } from '../types/bookingDraft';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type TabKey = 'home' | 'match' | 'learn' | 'funding' | 'account' | 'notifications' | 'bookService' | 'bookSchedule' | 'bookConfirm';

const tabs: Array<{
  key: TabKey;
  label: string;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
}> = [
  { key: 'home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { key: 'match', label: 'Match', activeIcon: 'search', inactiveIcon: 'search-outline' },
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
  const insets = useSafeAreaInsets();
  const showTabBar = activeTab !== 'bookService' && activeTab !== 'bookSchedule' && activeTab !== 'bookConfirm';

  const screen = useMemo(() => {
    switch (activeTab) {
      case 'match':
        return <MatchingScreen />;
      case 'learn':
        return <EducationLibraryScreen />;
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
      case 'home':
      default:
        return (
          <HomeScreen
            roleLabel="Participant"
            onOpenEducation={() => setActiveTab('learn')}
            onOpenNotifications={() => setActiveTab('notifications')}
            onOpenBooking={() => setActiveTab('bookService')}
          />
        );
    }
  }, [activeTab, draft]);

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
