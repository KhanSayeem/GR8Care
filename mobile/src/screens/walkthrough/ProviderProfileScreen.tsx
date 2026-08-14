import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Badge, Button, Card, ProgressBar } from '../../components';
import { ProviderDetail, getProviderById } from '../../api/providers';

interface ProviderProfileScreenProps {
  providerId: string;
  onBack: () => void;
  onBookSession: (provider: { id: string; name: string }) => void;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const BREAKDOWN_ROWS: Array<{ key: 'location' | 'language' | 'goals'; label: string }> = [
  { key: 'location', label: 'Location' },
  { key: 'language', label: 'Language' },
  { key: 'goals', label: 'Goal overlap' },
];

export function ProviderProfileScreen({ providerId, onBack, onBookSession }: ProviderProfileScreenProps) {
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProvider = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getProviderById(providerId);
      setProvider(res.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provider could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useFocusEffect(
    useCallback(() => {
      loadProvider();
    }, [loadProvider])
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to find providers"
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
          >
            <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
          </Pressable>

          {loading ? (
            <View className="items-center justify-center gap-2 py-16">
              <ActivityIndicator color="#0B4F6C" />
              <Text className="font-body text-caption text-text-mid">Loading provider...</Text>
            </View>
          ) : error || !provider ? (
            <View className="items-center justify-center gap-2 py-10">
              <Ionicons name="alert-circle" color="#E53E3E" size={22} />
              <Text className="font-body-medium text-caption text-text-dark text-center">{error ?? 'Provider not found.'}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={loadProvider}
                className="mt-2 h-9 min-w-[110px] items-center justify-center rounded-md bg-teal-dark px-4"
              >
                <Text className="font-body-bold text-caption text-cream">Retry</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="mt-5 items-center">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-teal-dark">
                  <Text className="font-heading text-h1 text-white">{initials(provider.name)}</Text>
                </View>
                <View className="mt-3 flex-row items-center gap-1.5">
                  <Text className="font-heading text-h1 text-text-dark">{provider.name}</Text>
                  {provider.abnVerificationStatus === 'verified' ? (
                    <Ionicons name="checkmark-circle" color="#2D9E6B" size={20} />
                  ) : null}
                </View>
                <Text style={{ marginTop: 8 }} className="font-body text-body text-text-mid">
                  {provider.location || 'Location not listed'}
                </Text>
                <View style={{ marginTop: 16 }} className="flex-row flex-wrap items-center justify-center gap-2">
                  <Badge
                    label={provider.rating !== null ? `${provider.rating.toFixed(1)} rating` : 'New provider'}
                    tone={provider.rating !== null ? 'success' : 'neutral'}
                  />
                  {provider.hourlyRate !== null ? <Badge label={`$${provider.hourlyRate}/hr`} tone="info" /> : null}
                  {provider.compatibilityScore !== null ? (
                    <Badge label={`${provider.compatibilityScore}% match`} tone="success" />
                  ) : null}
                </View>
              </View>

              {provider.bio ? (
                <Card className="mt-5 bg-white">
                  <Text className="font-caption text-label uppercase text-teal-dark">About</Text>
                  <Text className="mt-2 font-body text-body text-text-mid">{provider.bio}</Text>
                </Card>
              ) : null}

              {provider.compatibilityBreakdown ? (
                <Card className="mt-4 bg-white">
                  <Text className="font-caption text-label uppercase text-teal-dark">Compatibility breakdown</Text>
                  <View className="mt-3 gap-3">
                    {BREAKDOWN_ROWS.map((row) => (
                      <View key={row.key}>
                        <View className="flex-row items-center justify-between">
                          <Text className="font-body-medium text-caption text-text-dark">{row.label}</Text>
                          <Text className="font-body text-caption text-text-mid">{provider.compatibilityBreakdown![row.key]}%</Text>
                        </View>
                        <View className="mt-1.5">
                          <ProgressBar progress={provider.compatibilityBreakdown![row.key] / 100} tone="teal-dark" />
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              ) : null}

              <Card className="mt-4 bg-white">
                <Text className="font-caption text-label uppercase text-teal-dark">Services</Text>
                {provider.services.length > 0 ? (
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <Badge key={service} label={service} tone="neutral" />
                    ))}
                  </View>
                ) : (
                  <Text className="mt-2 font-body text-caption text-text-mid">No services listed yet.</Text>
                )}
              </Card>

              {!provider.acceptingNewParticipants ? (
                <View className="mt-4 flex-row items-center gap-2 rounded-md border border-warning bg-[#FFF8E6] px-3 py-2.5">
                  <Ionicons name="alert-circle" color="#B7791F" size={18} />
                  <Text className="flex-1 font-body-medium text-caption text-text-dark">
                    This provider is not currently accepting new participants.
                  </Text>
                </View>
              ) : null}

              <View className="mt-5 gap-3">
                <Button
                  label="Book session"
                  variant="primary"
                  disabled={!provider.acceptingNewParticipants}
                  onPress={() => onBookSession({ id: provider.id, name: provider.name })}
                />
                <Button
                  label="Message"
                  variant="outline"
                  onPress={() => Linking.openURL(`mailto:${provider.email}`)}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}
