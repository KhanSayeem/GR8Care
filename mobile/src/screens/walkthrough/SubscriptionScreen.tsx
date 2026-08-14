import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionAccess, SubscriptionTier, getMyAccess } from '../../api/auth';
import { Badge, Card } from '../../components';
import { useAuthStore } from '../../store/authStore';

interface SubscriptionScreenProps {
  onBack: () => void;
}

const TIER_RANK: Record<SubscriptionTier, number> = {
  starter: 0,
  growth: 1,
  enterprise: 2,
};

const TIER_ORDER: SubscriptionTier[] = ['starter', 'growth', 'enterprise'];

const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

function TierCard({ tier, access }: { tier: SubscriptionTier; access: SubscriptionAccess }) {
  const isCurrent = tier === access.tier;
  const isUpgrade = TIER_RANK[tier] > TIER_RANK[access.tier];

  function handleUpgrade() {
    Alert.alert('Requires a payment processor', 'Upgrading plans is not available in this build. A payment processor has not been chosen yet.');
  }

  return (
    <Card variant={isCurrent ? 'highlight' : 'default'} style={{ marginTop: 12 }}>
      <View className="flex-row flex-wrap items-start justify-between gap-2">
        <Text className="font-heading text-h2 text-text-dark">{TIER_LABELS[tier]}</Text>
        {isCurrent ? <Badge label="Current plan" tone="success" /> : isUpgrade ? null : <Badge label="Included" tone="neutral" />}
      </View>

      <View style={{ marginTop: 10, gap: 8 }}>
        {access.features.map((feature) => {
          const unlocked = TIER_RANK[tier] >= TIER_RANK[feature.requiredTier];
          return (
            <View key={feature.key} className="flex-row items-center" style={{ gap: 8 }}>
              <Ionicons name={unlocked ? 'checkmark-circle' : 'lock-closed'} color={unlocked ? '#2D9E6B' : '#A0AEC0'} size={16} />
              <Text className={`font-body text-caption ${unlocked ? 'text-text-dark' : 'text-text-light'}`}>{feature.label}</Text>
            </View>
          );
        })}
      </View>

      {isUpgrade ? (
        <Pressable
          accessibilityRole="button"
          onPress={handleUpgrade}
          className="items-center justify-center rounded-md border border-teal-mid bg-white"
          style={{ marginTop: 14, height: 44 }}
        >
          <Text className="font-body-bold text-caption text-teal-dark">Upgrade to {TIER_LABELS[tier]}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

export function SubscriptionScreen({ onBack }: SubscriptionScreenProps) {
  const token = useAuthStore((state) => state.token);
  const [access, setAccess] = useState<SubscriptionAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getMyAccess(token)
      .then((res) => setAccess(res.access))
      .catch((err) => setError(err instanceof Error ? err.message : 'Subscription details could not be loaded.'))
      .finally(() => setLoading(false));
  }, [token]);

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
            <Text className="font-heading text-h1 text-text-dark">Subscription & Plan</Text>
          </View>

          {loading ? (
            <View className="items-center justify-center" style={{ paddingVertical: 48, gap: 8 }}>
              <ActivityIndicator color="#0B4F6C" />
              <Text className="font-body text-caption text-text-mid">Loading your plan...</Text>
            </View>
          ) : error || !access ? (
            <Card style={{ marginTop: 20 }}>
              <Text className="font-body-medium text-caption text-text-dark text-center">{error ?? 'Subscription details are unavailable.'}</Text>
            </Card>
          ) : (
            <>
              <Card variant="highlight" style={{ marginTop: 20 }}>
                <View className="flex-row flex-wrap items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="font-caption text-label uppercase text-teal-dark">Permission gating only</Text>
                    <Text className="mt-2 font-body text-body text-text-mid">{access.boundary}</Text>
                  </View>
                  <Badge label="No payments" tone="info" />
                </View>
              </Card>

              {TIER_ORDER.map((tier) => (
                <TierCard key={tier} tier={tier} access={access} />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}
