import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMyProfile } from '../../api/auth';
import { AuthUser } from '../../store/authStore';

interface PersonalInformationScreenProps {
  token: string;
  user: AuthUser;
  onBack: () => void;
  onSaved: (user: AuthUser) => void;
}

export function PersonalInformationScreen({ token, user, onBack, onSaved }: PersonalInformationScreenProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [ndisNumber, setNdisNumber] = useState(user.ndisNumber ?? '');
  const [location, setLocation] = useState(user.location ?? '');
  const [goals, setGoals] = useState<string[]>(user.goals ?? []);
  const [goalInput, setGoalInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addGoal() {
    const value = goalInput.trim();
    if (!value) return;
    setGoals((prev) => [...prev, value]);
    setGoalInput('');
  }

  function removeGoal(index: number) {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await updateMyProfile(token, {
        fullName: fullName.trim(),
        ndisNumber: ndisNumber.trim(),
        location: location.trim(),
        goals,
      });
      onSaved(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your changes.');
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
            <Text className="font-heading text-h1 text-text-dark">Personal Information</Text>
          </View>

          <View className="mt-6 gap-4">
            <View>
              <Text className="mb-1.5 font-caption text-label uppercase text-text-mid">Full name</Text>
              <TextInput
                accessibilityLabel="Full name"
                autoComplete="name"
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor="#A0AEC0"
                value={fullName}
                className="h-14 rounded-md border border-border bg-white px-4 font-body text-body text-text-dark"
              />
            </View>

            <View>
              <Text className="mb-1.5 font-caption text-label uppercase text-text-mid">NDIS number</Text>
              <TextInput
                accessibilityLabel="NDIS number"
                onChangeText={setNdisNumber}
                placeholder="Optional"
                placeholderTextColor="#A0AEC0"
                value={ndisNumber}
                className="h-14 rounded-md border border-border bg-white px-4 font-body text-body text-text-dark"
              />
            </View>

            <View>
              <Text className="mb-1.5 font-caption text-label uppercase text-text-mid">Location</Text>
              <TextInput
                accessibilityLabel="Location"
                onChangeText={setLocation}
                placeholder="e.g. Parramatta LGA"
                placeholderTextColor="#A0AEC0"
                value={location}
                className="h-14 rounded-md border border-border bg-white px-4 font-body text-body text-text-dark"
              />
            </View>

            <View>
              <Text className="mb-1.5 font-caption text-label uppercase text-text-mid">My NDIS goals</Text>
              {goals.length > 0 ? (
                <View className="mb-3 flex-row flex-wrap gap-2">
                  {goals.map((goal, index) => (
                    <Pressable
                      key={`${goal}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove goal: ${goal}`}
                      onPress={() => removeGoal(index)}
                      className="flex-row items-center gap-1.5 rounded-full border border-teal-dark bg-teal-light px-3 py-1.5"
                    >
                      <Text className="font-body-medium text-caption text-teal-dark">{goal}</Text>
                      <Ionicons name="close-circle" color="#0B4F6C" size={14} />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text className="mb-3 font-body text-caption text-text-mid">No goals added yet.</Text>
              )}
              <View className="flex-row items-center gap-2">
                <TextInput
                  accessibilityLabel="Add a goal"
                  onChangeText={setGoalInput}
                  onSubmitEditing={addGoal}
                  placeholder="Add a goal"
                  placeholderTextColor="#A0AEC0"
                  value={goalInput}
                  className="h-12 flex-1 rounded-md border border-border bg-white px-4 font-body text-body text-text-dark"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add goal"
                  onPress={addGoal}
                  className="h-12 w-12 items-center justify-center rounded-md bg-teal-dark"
                >
                  <Ionicons name="add" color="#F7F3EE" size={22} />
                </Pressable>
              </View>
            </View>
          </View>

          {error ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-md border border-[#E53E3E] bg-[#FED7D7] px-3 py-2.5">
              <Ionicons name="alert-circle" color="#E53E3E" size={18} />
              <Text className="flex-1 font-body-medium text-caption text-[#E53E3E]">{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: submitting }}
            disabled={submitting}
            onPress={handleSave}
            className={`mt-6 h-14 flex-row items-center justify-center rounded-md bg-teal-dark px-4 ${submitting ? 'opacity-50' : ''}`}
          >
            {submitting ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-subheading text-h3 text-cream">Save changes</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
