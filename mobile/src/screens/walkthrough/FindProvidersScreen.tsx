import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Badge, Card } from '../../components';
import { ProviderSummary, getProviders } from '../../api/providers';
import { ScreenShell } from './ScreenShell';

interface FindProvidersScreenProps {
  onSelectProvider: (providerId: string) => void;
  onOpenZoneOutreach?: () => void;
}

const LANGUAGE_CHIPS = ['English', 'Vietnamese', 'Mandarin', 'Arabic'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function compatibilityTone(score: number): 'success' | 'warning' | 'neutral' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'neutral';
}

function ProviderCard({ provider, onPress }: { provider: ProviderSummary; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="bg-white">
        <View className="flex-row items-start gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-dark">
            <Text className="font-heading text-h3 text-white">{initials(provider.name)}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-heading text-h3 text-text-dark">{provider.name}</Text>
              {provider.abnVerificationStatus === 'verified' ? (
                <Ionicons name="checkmark-circle" color="#2D9E6B" size={16} />
              ) : null}
            </View>
            <Text className="mt-0.5 font-body text-caption text-text-mid">{provider.location || 'Location not listed'}</Text>
            <Text className="mt-0.5 font-body text-caption text-text-light">
              {provider.rating !== null ? `${provider.rating.toFixed(1)} rating` : 'New provider'}
              {provider.hourlyRate !== null ? ` - $${provider.hourlyRate}/hr` : ''}
            </Text>
          </View>
          {provider.compatibilityScore !== null ? (
            <Badge label={`${provider.compatibilityScore}% match`} tone={compatibilityTone(provider.compatibilityScore)} />
          ) : null}
        </View>

        {provider.services.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {provider.services.slice(0, 4).map((service) => (
              <Badge key={service} label={service} tone="neutral" />
            ))}
          </View>
        ) : null}

        {!provider.acceptingNewParticipants ? (
          <Text className="mt-2 font-body-medium text-caption text-warning">Not accepting new participants</Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

export function FindProvidersScreen({ onSelectProvider, onOpenZoneOutreach }: FindProvidersScreenProps) {
  const [near, setNear] = useState('');
  const [appliedNear, setAppliedNear] = useState('');
  const [language, setLanguage] = useState<string | null>(null);
  const [topRated, setTopRated] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);

  const loadProviders = useCallback(async (filters: { near: string; language: string | null; topRated: boolean }) => {
    if (hasLoadedRef.current) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await getProviders({
        near: filters.near || undefined,
        language: filters.language || undefined,
        topRated: filters.topRated,
      });
      setProviders(res.providers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Providers could not be loaded.');
      setProviders([]);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProviders({ near: appliedNear, language, topRated });
    }, [appliedNear, language, topRated, loadProviders])
  );

  function runSearch(nextNear: string) {
    setAppliedNear(nextNear);
  }

  function toggleLanguage(option: string) {
    setLanguage((current) => (current === option ? null : option));
  }

  function toggleTopRated() {
    setTopRated((current) => !current);
  }

  function expandSearch() {
    setNear('');
    setAppliedNear('');
  }

  const noResultsFromLocationFilter = !loading && !error && providers.length === 0 && appliedNear.length > 0;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScreenShell eyebrow="Provider matching" title="Find providers" subtitle="Search by area and filter to find a provider that fits.">
        <View className="flex-row items-center gap-2 rounded-md border border-border bg-white px-3">
          <Ionicons name="search" color="#4A5568" size={18} />
          <TextInput
            accessibilityLabel="Search by suburb or area"
            className="h-12 flex-1 font-body text-body text-text-dark"
            onChangeText={setNear}
            onSubmitEditing={() => runSearch(near)}
            placeholder="Search by suburb or area"
            placeholderTextColor="#A0AEC0"
            returnKeyType="search"
            value={near}
          />
          {near.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => runSearch('')}>
              <Ionicons name="close-circle" color="#A0AEC0" size={18} />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: topRated }}
            onPress={toggleTopRated}
            className={`rounded-full border px-3 py-2 ${topRated ? 'border-teal-dark bg-teal-dark' : 'border-border bg-white'}`}
          >
            <Text className={`font-body-medium text-caption ${topRated ? 'text-white' : 'text-text-dark'}`}>Top rated</Text>
          </Pressable>
          {LANGUAGE_CHIPS.map((option) => {
            const selected = language === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggleLanguage(option)}
                className={`rounded-full border px-3 py-2 ${selected ? 'border-teal-dark bg-teal-dark' : 'border-border bg-white'}`}
              >
                <Text className={`font-body-medium text-caption ${selected ? 'text-white' : 'text-text-dark'}`}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View className="items-center justify-center gap-2 py-10">
            <ActivityIndicator color="#0B4F6C" />
            <Text className="font-body text-caption text-text-mid">Loading providers...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center gap-2 py-6">
            <Ionicons name="alert-circle" color="#E53E3E" size={22} />
            <Text className="font-body-medium text-caption text-text-dark text-center">{error}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={refreshing}
              onPress={() => loadProviders({ near: appliedNear, language, topRated })}
              className="mt-2 h-9 min-w-[110px] items-center justify-center rounded-md bg-teal-dark px-4"
            >
              {refreshing ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-body-bold text-caption text-cream">Retry</Text>}
            </Pressable>
          </View>
        ) : providers.length === 0 ? (
          <Card className="bg-white">
            <Text className="font-body text-caption text-text-mid text-center">
              {noResultsFromLocationFilter ? `No providers found in "${appliedNear}".` : 'No providers found yet.'}
            </Text>
            {noResultsFromLocationFilter ? (
              <Pressable
                accessibilityRole="button"
                onPress={expandSearch}
                className="mt-3 h-10 items-center justify-center rounded-md border border-teal-dark bg-white"
              >
                <Text className="font-body-bold text-caption text-teal-dark">Expand search to nearby LGAs</Text>
              </Pressable>
            ) : null}
            {onOpenZoneOutreach ? (
              <Pressable
                accessibilityRole="button"
                onPress={onOpenZoneOutreach}
                className="items-center justify-center rounded-md border border-border bg-white"
                style={{ marginTop: 10, height: 40 }}
              >
                <Text className="font-body-bold text-caption text-text-dark">Notify nearby providers</Text>
              </Pressable>
            ) : null}
          </Card>
        ) : (
          <View className="gap-3">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} onPress={() => onSelectProvider(provider.id)} />
            ))}
          </View>
        )}
      </ScreenShell>
    </>
  );
}
