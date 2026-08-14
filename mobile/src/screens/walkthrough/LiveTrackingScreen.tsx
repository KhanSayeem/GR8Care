import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookingDetailRecord } from '../../api/booking';
import { Badge, Card } from '../../components';

interface LiveTrackingScreenProps {
  booking: BookingDetailRecord;
  onBack: () => void;
}

const STEPS = ['On the way', 'Arrived', 'Session started'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function LiveTrackingScreen({ booking, onBack }: LiveTrackingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const providerName = booking.provider?.displayName ?? 'Provider';

  function handleCallProvider() {
    Alert.alert('Demo only', "Calling isn't wired up in this preview build.");
  }

  function handleCancelTracking() {
    Alert.alert('Stop tracking?', 'You can track this provider again from your bookings.', [
      { text: 'Keep tracking', style: 'cancel' },
      { text: 'Stop tracking', style: 'destructive', onPress: onBack },
    ]);
  }

  function handleSimulateUpdate() {
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Track Provider</Text>
          </View>

          <Card variant="highlight" style={{ marginTop: 20 }}>
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <Ionicons name="navigate-circle" color="#0B4F6C" size={22} />
              </View>
              <View className="flex-1">
                <Text className="font-caption text-label uppercase text-teal-dark">Preview</Text>
                <Text className="mt-1 font-body text-body text-text-mid">
                  This is a stylized preview of live tracking. Map position and ETA are illustrative, not real GPS or a live connection.
                </Text>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-dark">
                <Text className="font-heading text-h3 text-white">{initials(providerName)}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-heading text-h3 text-text-dark">{providerName}</Text>
                <Text className="font-body text-caption text-text-mid" style={{ marginTop: 2 }}>
                  {booking.service}
                </Text>
                {booking.location ? (
                  <Text className="font-body text-caption text-text-light" style={{ marginTop: 2 }}>
                    {booking.location}
                  </Text>
                ) : null}
              </View>
              <Badge label={STEPS[stepIndex]} tone={stepIndex === STEPS.length - 1 ? 'success' : 'info'} />
            </View>
          </Card>

          <View
            className="items-center justify-center rounded-md border border-border bg-white"
            style={{ marginTop: 16, height: 200, overflow: 'hidden' }}
          >
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <Ionicons name="person-circle" color="#0B4F6C" size={30} />
              <View style={{ width: 60, height: 1, borderStyle: 'dashed', borderWidth: 1, borderColor: '#A0AEC0' }} />
              <Ionicons name="location" color="#E53E3E" size={30} />
            </View>
            <Text className="font-body text-caption text-text-mid" style={{ marginTop: 12 }}>
              Map preview
            </Text>
          </View>

          <Card style={{ marginTop: 16 }}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-caption text-label uppercase text-text-mid">Distance (demo)</Text>
                <Text className="mt-1 font-heading text-h2 text-text-dark">2.4 km</Text>
              </View>
              <View className="items-end">
                <Text className="font-caption text-label uppercase text-text-mid">ETA (demo)</Text>
                <Text className="mt-1 font-heading text-h2 text-text-dark">~12 min</Text>
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Text className="font-body-medium text-caption text-text-dark">Status</Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              {STEPS.map((step, index) => {
                const reached = index <= stepIndex;
                return (
                  <View key={step} className="flex-row items-center" style={{ gap: 10 }}>
                    <Ionicons name={reached ? 'checkmark-circle' : 'ellipse-outline'} color={reached ? '#2D9E6B' : '#A0AEC0'} size={20} />
                    <Text className={`font-body-medium text-caption ${reached ? 'text-text-dark' : 'text-text-light'}`}>{step}</Text>
                  </View>
                );
              })}
            </View>
            {stepIndex < STEPS.length - 1 ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleSimulateUpdate}
                className="items-center justify-center rounded-md border border-teal-mid bg-white"
                style={{ marginTop: 14, height: 44 }}
              >
                <Text className="font-body-bold text-caption text-teal-dark">Simulate next update</Text>
              </Pressable>
            ) : null}
          </Card>

          <View className="flex-row" style={{ marginTop: 20, gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              onPress={handleCallProvider}
              className="flex-1 flex-row items-center justify-center rounded-md bg-teal-dark"
              style={{ height: 48, gap: 8 }}
            >
              <Ionicons name="call" color="#F7F3EE" size={18} />
              <Text className="font-body-bold text-caption text-cream">Call provider</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleCancelTracking}
              className="flex-1 items-center justify-center rounded-md border border-border bg-white"
              style={{ height: 48 }}
            >
              <Text className="font-body-bold text-caption text-text-dark">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
