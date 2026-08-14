import React from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Role } from '../../store/authStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ROLE_OPTIONS: Array<{
  role: Role;
  label: string;
  description: string;
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
    icon: 'settings',
    iconBg: 'rgba(45,27,105,0.15)',
    bg: '#EDE9FF',
    border: '#2D1B69',
    accent: '#2D1B69',
  },
];

interface RoleSelectionScreenProps {
  onSelect: (role: Role) => void;
  onLogin: () => void;
}

export function RoleSelectionScreen({ onSelect, onLogin }: RoleSelectionScreenProps) {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <View className="flex-1 items-center bg-cream">
        <View className="w-full flex-1 px-6 pt-16" style={{ maxWidth: 390 }}>
          <Text className="font-heading text-h1 text-text-dark">Who are you?</Text>
          <Text className="mt-2 font-body text-body text-text-mid">Select your role to create an account.</Text>

          <View className="mt-6 gap-3.5">
            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option.role}
                accessibilityRole="button"
                onPress={() => onSelect(option.role)}
                style={{ backgroundColor: option.bg, borderColor: option.border }}
                className="min-h-[92px] flex-row items-center rounded-xl border-2 px-3.5 py-3.5"
              >
                <View style={{ backgroundColor: option.iconBg }} className="h-[60px] w-[60px] items-center justify-center rounded-full">
                  <Ionicons name={option.icon} color={option.accent} size={30} />
                </View>
                <View className="ml-3.5 flex-1 pr-2">
                  <Text className="font-body-bold text-body text-text-dark">{option.label}</Text>
                  <Text className="mt-1.5 font-body text-caption text-text-mid">{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" color={option.accent} size={20} />
              </Pressable>
            ))}
          </View>

          <Pressable accessibilityRole="button" onPress={onLogin} className="mt-8 items-center py-2">
            <Text className="font-body-medium text-body text-teal-dark">Already have an account? Log in</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
