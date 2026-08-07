import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Role, useAuthStore } from '../../store/authStore';

const ROLE_OPTIONS: Array<{
  role: Role;
  label: string;
  description: string;
  email: string;
  icon: string;
  bg: string;
  border: string;
  accent: string;
}> = [
  {
    role: 'supportWorker',
    label: 'Provider / Caregiver',
    description: 'Healthcare worker or disability support provider',
    email: 'worker@gr8care.app',
    icon: '🩺',
    bg: '#D4F0E4',
    border: '#2D9E6B',
    accent: '#2D9E6B',
  },
  {
    role: 'participant',
    label: 'Participant',
    description: 'NDIS participant or caregiver managing services and funding',
    email: 'participant@gr8care.app',
    icon: '👤',
    bg: '#D0EAF2',
    border: '#0B4F6C',
    accent: '#0B4F6C',
  },
  {
    role: 'provider',
    label: 'Support Team',
    description: 'Workforce resources and participant support priorities',
    email: 'provider@gr8care.app',
    icon: '🤝',
    bg: '#FFFFFF',
    border: '#E8E0D6',
    accent: '#E8734A',
  },
  {
    role: 'admin',
    label: 'Admin / Staff',
    description: 'GR8Care staff managing the platform',
    email: 'coordinator@gr8care.app',
    icon: '⚙️',
    bg: '#EDE9FF',
    border: '#2D1B69',
    accent: '#2D1B69',
  },
];

export function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  return (
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
                })
              }
              style={[styles.roleCard, { backgroundColor: option.bg, borderColor: option.border }]}
            >
              <View style={[styles.roleIcon, { backgroundColor: option.accent }]}>
                <Text style={styles.roleEmoji}>{option.icon}</Text>
              </View>
              <View style={styles.roleCopy}>
                <Text style={styles.roleTitle}>{option.label}</Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </View>
              <Text style={[styles.chevron, { color: option.accent }]}>
                ›
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.changeLanguage}>← Change language</Text>
      </View>
    </View>
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
    paddingTop: 52,
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
    marginTop: 28,
    gap: 20,
  },
  roleCard: {
    minHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleEmoji: {
    fontSize: 30,
    lineHeight: 36,
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
  chevron: {
    fontSize: 28,
    lineHeight: 32,
  },
  changeLanguage: {
    marginTop: 48,
    color: '#A0AEC0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
