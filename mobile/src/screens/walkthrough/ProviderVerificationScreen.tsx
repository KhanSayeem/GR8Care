import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PendingProvider, approveProvider, getPendingProviders, rejectProvider } from '../../api/admin';
import { Badge, Card } from '../../components';

interface ProviderVerificationScreenProps {
  onBack?: () => void;
}

const CHECKLIST_ITEMS = ['Business location provided', 'ABN provided', 'At least one service listed', 'Bio provided'];

function checklistStatus(provider: PendingProvider) {
  return [
    Boolean(provider.location),
    Boolean(provider.abn),
    provider.services.length > 0,
    Boolean(provider.bio),
  ];
}

export function ProviderVerificationScreen({ onBack }: ProviderVerificationScreenProps) {
  const [providers, setProviders] = useState<PendingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingProviders();
      setProviders(res.providers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pending providers could not be loaded.');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(provider: PendingProvider) {
    setActingId(provider.id);
    try {
      await approveProvider(provider.id);
      setProviders((prev) => prev.filter((p) => p.id !== provider.id));
    } catch (err) {
      Alert.alert('Could not approve', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setActingId(null);
    }
  }

  function confirmReject(provider: PendingProvider) {
    Alert.alert('Reject this provider?', `${provider.provider.fullName} will need to resubmit for verification.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActingId(provider.id);
          try {
            await rejectProvider(provider.id);
            setProviders((prev) => prev.filter((p) => p.id !== provider.id));
          } catch (err) {
            Alert.alert('Could not reject', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to admin dashboard"
                onPress={onBack}
                className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
              >
                <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
              </Pressable>
            ) : null}
            <Text className="font-heading text-h1 text-text-dark">Provider Verification</Text>
          </View>
          <Text className="font-body text-body text-text-mid" style={{ marginTop: 8 }}>
            {providers.length} {providers.length === 1 ? 'provider' : 'providers'} awaiting review.
          </Text>

          <View style={{ marginTop: 20, gap: 12 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ paddingVertical: 32, gap: 8 }}>
                <ActivityIndicator color="#0B4F6C" />
                <Text className="font-body text-caption text-text-mid">Loading pending providers...</Text>
              </View>
            ) : error ? (
              <Card>
                <Text className="font-body-medium text-caption text-text-dark text-center">{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={load}
                  className="items-center justify-center rounded-md bg-teal-dark"
                  style={{ marginTop: 12, height: 40 }}
                >
                  <Text className="font-body-bold text-caption text-cream">Retry</Text>
                </Pressable>
              </Card>
            ) : providers.length === 0 ? (
              <Card>
                <Text className="font-body text-caption text-text-mid text-center">No providers are waiting for verification.</Text>
              </Card>
            ) : (
              providers.map((provider) => {
                const checks = checklistStatus(provider);
                const acting = actingId === provider.id;
                return (
                  <Card key={provider.id}>
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="min-w-0 flex-1">
                        <Text className="font-heading text-h2 text-text-dark">{provider.provider.fullName}</Text>
                        <Text className="font-body text-caption text-text-mid" style={{ marginTop: 2 }} numberOfLines={1}>
                          {provider.provider.email}
                        </Text>
                      </View>
                      <Badge label="Pending" tone="warning" />
                    </View>

                    <Text className="font-body text-caption text-text-mid" style={{ marginTop: 10 }}>
                      {provider.location || 'No location provided'}
                      {provider.hourlyRate ? ` · $${provider.hourlyRate}/hr` : ''}
                    </Text>

                    {provider.services.length > 0 ? (
                      <View className="flex-row flex-wrap" style={{ marginTop: 8, gap: 6 }}>
                        {provider.services.map((service) => (
                          <Badge key={service} label={service} tone="info" />
                        ))}
                      </View>
                    ) : null}

                    <View style={{ marginTop: 12, gap: 6 }}>
                      {CHECKLIST_ITEMS.map((item, index) => (
                        <View key={item} className="flex-row items-center gap-2">
                          <Ionicons
                            name={checks[index] ? 'checkmark-circle' : 'ellipse-outline'}
                            color={checks[index] ? '#2D9E6B' : '#A0AEC0'}
                            size={16}
                          />
                          <Text className="font-body text-caption text-text-mid">{item}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="flex-row" style={{ marginTop: 14, gap: 10 }}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={acting}
                        onPress={() => handleApprove(provider)}
                        className={`flex-1 items-center justify-center rounded-md bg-teal-dark ${acting ? 'opacity-50' : ''}`}
                        style={{ height: 44 }}
                      >
                        {acting ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-body-bold text-caption text-cream">Approve</Text>}
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={acting}
                        onPress={() => confirmReject(provider)}
                        className={`flex-1 items-center justify-center rounded-md border border-border bg-white ${acting ? 'opacity-50' : ''}`}
                        style={{ height: 44 }}
                      >
                        <Text className="font-body-bold text-caption text-text-dark">Reject</Text>
                      </Pressable>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
