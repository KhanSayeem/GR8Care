import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EducationLibraryScreen } from '../screens/walkthrough/EducationLibraryScreen';
import { FundingScreen } from '../screens/walkthrough/FundingScreen';
import { HomeScreen } from '../screens/walkthrough/HomeScreen';
import { MatchingScreen } from '../screens/walkthrough/MatchingScreen';
import { ProfileScreen } from '../screens/walkthrough/ProfileScreen';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type TabKey = 'home' | 'match' | 'learn' | 'funding' | 'account';

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
  Funding: undefined;
  Profile: undefined;
};

export function ParticipantTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const insets = useSafeAreaInsets();

  const screen = useMemo(() => {
    switch (activeTab) {
      case 'match':
        return <MatchingScreen />;
      case 'learn':
        return <EducationLibraryScreen />;
      case 'funding':
        return <FundingScreen />;
      case 'account':
        return <ProfileScreen />;
      case 'home':
      default:
        return <HomeScreen roleLabel="Participant" />;
    }
  }, [activeTab]);

  return (
    <View style={styles.shell}>
      <View style={styles.content}>{screen}</View>
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
