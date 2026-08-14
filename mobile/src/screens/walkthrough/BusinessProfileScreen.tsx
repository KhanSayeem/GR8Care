import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyProviderProfile, saveMyProviderProfile } from '../../api/providers';

interface BusinessProfileScreenProps {
  onBack: () => void;
}

function ChipList({
  label,
  values,
  inputValue,
  onChangeInput,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  values: string[];
  inputValue: string;
  onChangeInput: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  return (
    <View>
      <Text className="font-caption text-label uppercase text-text-mid" style={{ marginBottom: 6 }}>
        {label}
      </Text>
      {values.length > 0 ? (
        <View className="flex-row flex-wrap" style={{ marginBottom: 10, gap: 8 }}>
          {values.map((value, index) => (
            <Pressable
              key={`${value}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${value}`}
              onPress={() => onRemove(index)}
              className="flex-row items-center rounded-full border border-teal-dark bg-teal-light"
              style={{ gap: 6, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text className="font-body-medium text-caption text-teal-dark">{value}</Text>
              <Ionicons name="close-circle" color="#0B4F6C" size={14} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <TextInput
          accessibilityLabel={label}
          onChangeText={onChangeInput}
          onSubmitEditing={onAdd}
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          value={inputValue}
          className="flex-1 rounded-md border border-border bg-white font-body text-body text-text-dark"
          style={{ height: 48, paddingHorizontal: 16 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${label}`}
          onPress={onAdd}
          className="items-center justify-center rounded-md bg-teal-dark"
          style={{ height: 48, width: 48 }}
        >
          <Ionicons name="add" color="#F7F3EE" size={22} />
        </Pressable>
      </View>
    </View>
  );
}

export function BusinessProfileScreen({ onBack }: BusinessProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [acceptingNewParticipants, setAcceptingNewParticipants] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyProviderProfile()
      .then((res) => {
        if (!res.profile) return;
        setLocation(res.profile.location ?? '');
        setLanguages(res.profile.languages ?? []);
        setServices(res.profile.services ?? []);
        setHourlyRate(res.profile.hourlyRate != null ? String(res.profile.hourlyRate) : '');
        setBio(res.profile.bio ?? '');
        setAcceptingNewParticipants(res.profile.acceptingNewParticipants ?? true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your business profile.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!location.trim()) {
      setError('Location is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const rate = hourlyRate.trim() ? Number(hourlyRate.trim()) : undefined;
      if (hourlyRate.trim() && (!Number.isFinite(rate) || (rate as number) < 0)) {
        setError('Hourly rate must be a non-negative number.');
        setSubmitting(false);
        return;
      }

      await saveMyProviderProfile({
        location: location.trim(),
        languages,
        services,
        hourlyRate: rate,
        bio: bio.trim(),
        acceptingNewParticipants,
      });
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your business profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to profile"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Business Profile</Text>
          </View>

          {loading ? (
            <View className="items-center justify-center" style={{ marginTop: 32, gap: 8, paddingVertical: 24 }}>
              <ActivityIndicator color="#0B4F6C" />
              <Text className="font-body text-caption text-text-mid">Loading your business profile...</Text>
            </View>
          ) : (
            <View style={{ marginTop: 24, gap: 20 }}>
              <View>
                <Text className="font-caption text-label uppercase text-text-mid" style={{ marginBottom: 6 }}>
                  Location
                </Text>
                <TextInput
                  accessibilityLabel="Location"
                  onChangeText={setLocation}
                  placeholder="e.g. Parramatta LGA"
                  placeholderTextColor="#A0AEC0"
                  value={location}
                  className="rounded-md border border-border bg-white font-body text-body text-text-dark"
                  style={{ height: 48, paddingHorizontal: 16 }}
                />
              </View>

              <ChipList
                label="Languages"
                values={languages}
                inputValue={languageInput}
                onChangeInput={setLanguageInput}
                onAdd={() => {
                  const value = languageInput.trim();
                  if (!value) return;
                  setLanguages((prev) => [...prev, value]);
                  setLanguageInput('');
                }}
                onRemove={(index) => setLanguages((prev) => prev.filter((_, i) => i !== index))}
                placeholder="Add a language"
              />

              <ChipList
                label="Services"
                values={services}
                inputValue={serviceInput}
                onChangeInput={setServiceInput}
                onAdd={() => {
                  const value = serviceInput.trim();
                  if (!value) return;
                  setServices((prev) => [...prev, value]);
                  setServiceInput('');
                }}
                onRemove={(index) => setServices((prev) => prev.filter((_, i) => i !== index))}
                placeholder="Add a service"
              />

              <View>
                <Text className="font-caption text-label uppercase text-text-mid" style={{ marginBottom: 6 }}>
                  Hourly rate (AUD)
                </Text>
                <TextInput
                  accessibilityLabel="Hourly rate"
                  keyboardType="decimal-pad"
                  onChangeText={setHourlyRate}
                  placeholder="Optional"
                  placeholderTextColor="#A0AEC0"
                  value={hourlyRate}
                  className="rounded-md border border-border bg-white font-body text-body text-text-dark"
                  style={{ height: 48, paddingHorizontal: 16 }}
                />
              </View>

              <View>
                <Text className="font-caption text-label uppercase text-text-mid" style={{ marginBottom: 6 }}>
                  Bio
                </Text>
                <TextInput
                  accessibilityLabel="Bio"
                  multiline
                  onChangeText={setBio}
                  placeholder="Tell participants about your experience"
                  placeholderTextColor="#A0AEC0"
                  value={bio}
                  className="rounded-md border border-border bg-white font-body text-body text-text-dark"
                  style={{ minHeight: 96, paddingHorizontal: 16, paddingTop: 12, textAlignVertical: 'top' }}
                />
              </View>

              <View className="flex-row items-center justify-between rounded-md border border-border bg-white" style={{ padding: 16 }}>
                <View className="min-w-0 flex-1">
                  <Text className="font-body-bold text-body text-text-dark">Accepting new participants</Text>
                  <Text className="font-body text-caption text-text-mid" style={{ marginTop: 2 }}>
                    Show up in participant searches.
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Accepting new participants"
                  value={acceptingNewParticipants}
                  onValueChange={setAcceptingNewParticipants}
                  trackColor={{ false: '#E8E0D6', true: '#0B4F6C' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          {error ? (
            <View className="flex-row items-center gap-2 rounded-md border border-[#E53E3E] bg-[#FED7D7]" style={{ marginTop: 16, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Ionicons name="alert-circle" color="#E53E3E" size={18} />
              <Text className="flex-1 font-body-medium text-caption text-[#E53E3E]">{error}</Text>
            </View>
          ) : null}

          {!loading ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting }}
              disabled={submitting}
              onPress={handleSave}
              className={`flex-row items-center justify-center rounded-md bg-teal-dark ${submitting ? 'opacity-50' : ''}`}
              style={{ marginTop: 24, height: 56 }}
            >
              {submitting ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-subheading text-h3 text-cream">Save changes</Text>}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
