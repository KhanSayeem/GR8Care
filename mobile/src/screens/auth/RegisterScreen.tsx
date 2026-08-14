import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '../../api/client';
import { register } from '../../api/auth';
import { AuthUser, Role } from '../../store/authStore';

interface RegisterScreenProps {
  role: Role;
  language: string;
  onRegistered: (token: string, user: AuthUser) => void;
  onSwitchToLogin: () => void;
  onChangeRole: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_LABELS: Record<Role, string> = {
  participant: 'Participant',
  caregiver: 'Caregiver',
  supportWorker: 'Support Worker',
  provider: 'Provider',
  admin: 'Admin / Staff',
};

export function RegisterScreen({ role, language, onRegistered, onSwitchToLogin, onChangeRole }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (!fullName.trim()) return 'Enter your full name.';
    if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const session = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        language,
      });
      onRegistered(session.token, session.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('An account with this email already exists.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not create your account.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}>
          <View className="w-full self-center" style={{ maxWidth: 390 }}>
            <Text className="font-heading text-h1 text-text-dark">Create your account</Text>

            <View className="mt-3 flex-row items-center gap-2 self-start rounded-full border border-teal-dark bg-teal-light px-3 py-1.5">
              <Text className="font-body-medium text-caption text-teal-dark">{ROLE_LABELS[role]}</Text>
              <Pressable accessibilityRole="button" onPress={onChangeRole}>
                <Text className="font-body-bold text-caption text-teal-dark">Change</Text>
              </Pressable>
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
                <Text className="mb-1.5 font-caption text-label uppercase text-text-mid">Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  className="h-14 rounded-md border border-border bg-white px-4 font-body text-body text-text-dark"
                />
              </View>

              <View>
                <Text className="mb-1.5 font-caption text-label uppercase text-text-mid">Password</Text>
                <View className="flex-row items-center rounded-md border border-border bg-white">
                  <TextInput
                    accessibilityLabel="Password"
                    autoCapitalize="none"
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={!showPassword}
                    value={password}
                    className="h-14 flex-1 px-4 font-body text-body text-text-dark"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((prev) => !prev)}
                    className="h-14 w-12 items-center justify-center"
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} color="#4A5568" size={20} />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text className="mb-1.5 font-caption text-label uppercase text-text-mid">Confirm password</Text>
                <TextInput
                  accessibilityLabel="Confirm password"
                  autoCapitalize="none"
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  className="h-14 rounded-md border border-border bg-white px-4 font-body text-body text-text-dark"
                />
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
              onPress={handleSubmit}
              className={`mt-6 h-14 flex-row items-center justify-center rounded-md bg-teal-dark px-4 ${submitting ? 'opacity-50' : ''}`}
            >
              {submitting ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-subheading text-h3 text-cream">Create account</Text>}
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onSwitchToLogin} className="mt-5 items-center py-2">
              <Text className="font-body-medium text-body text-teal-dark">Already have an account? Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
