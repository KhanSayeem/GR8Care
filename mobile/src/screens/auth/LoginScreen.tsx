import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role, useAuthStore } from '../../store/authStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ROLE_OPTIONS: Array<{
  role: Role;
  label: string;
  description: string;
  email: string;
  icon: IoniconName;
  iconBg: string;
  bg: string;
  border: string;
  accent: string;
}> = [
  {
    role: 'participant',
    label: 'Participant',
    description: 'NDIS participant or caregiver managing services and funding',
    email: 'participant@gr8care.app',
    icon: 'person',
    iconBg: 'rgba(11,79,108,0.15)',
    bg: '#D0EAF2',
    border: '#0B4F6C',
    accent: '#0B4F6C',
  },
  {
    role: 'supportWorker',
    label: 'Support Worker',
    description: 'Worker delivering participant supports and recording service notes',
    email: 'worker@gr8care.app',
    icon: 'medical',
    iconBg: 'rgba(45,158,107,0.15)',
    bg: '#D4F0E4',
    border: '#2D9E6B',
    accent: '#2D9E6B',
  },
  {
    role: 'provider',
    label: 'Provider',
    description: 'Organisation coordinating workers, services, and participant support',
    email: 'provider@gr8care.app',
    icon: 'business',
    iconBg: 'rgba(232,126,73,0.15)',
    bg: '#FCE6DA',
    border: '#E87E49',
    accent: '#A9491C',
  },
  {
    role: 'admin',
    label: 'Admin / Staff',
    description: 'GR8Care staff managing the platform',
    email: 'coordinator@gr8care.app',
    icon: 'settings',
    iconBg: 'rgba(45,27,105,0.15)',
    bg: '#EDE9FF',
    border: '#2D1B69',
    accent: '#2D1B69',
  },
];

export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <View style={styles.screen}>
        <View style={styles.phoneFrame}>
        <View style={styles.headingBlock}>
          <Text style={styles.titleDark}>Who are</Text>
          <Text style={styles.titleTeal}>you?</Text>
          <Text style={styles.subtitle}>Select your role to get the right experience</Text>
        </View>

        <View style={styles.roleList}>
          {ROLE_OPTIONS.map((option) => (
            <Pressable
              key={option.role}
              accessibilityRole="button"
              onPress={() =>
                setSession('walkthrough-token', {
                  _id: option.role,
                  fullName: option.label,
                  email: option.email,
                  role: option.role,
                  language: 'en',
                })
              }
              style={[styles.roleCard, { backgroundColor: option.bg, borderColor: option.border }]}
            >
              <View style={[styles.roleIcon, { backgroundColor: option.iconBg }]}>
                <Ionicons name={option.icon} color={option.accent} size={30} />
              </View>
              <View style={styles.roleCopy}>
                <Text style={styles.roleTitle}>{option.label}</Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" color={option.accent} size={20} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.changeLanguage}>Change language</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F3EE',
    alignItems: 'center',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 390,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 62,
  },
  headingBlock: {
    marginTop: 0,
  },
  titleDark: {
    color: '#1A1A2E',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
  },
  titleTeal: {
    color: '#0B4F6C',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: '#A0AEC0',
    fontSize: 14,
    lineHeight: 18,
  },
  roleList: {
    marginTop: 24,
    gap: 14,
  },
  roleCard: {
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#0A4F6B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCopy: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 8,
  },
  roleTitle: {
    color: '#1A1A2E',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  roleDescription: {
    marginTop: 6,
    color: '#4A5568',
    fontSize: 12,
    lineHeight: 16,
  },
  changeLanguage: {
    marginTop: 48,
    color: '#A0AEC0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
