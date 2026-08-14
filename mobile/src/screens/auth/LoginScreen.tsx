import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiError } from '../../api/client';
import { login } from '../../api/auth';
import { AuthUser } from '../../store/authStore';

interface LoginScreenProps {
  onLoggedIn: (token: string, user: AuthUser) => void;
  onSwitchToRegister: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ onLoggedIn, onSwitchToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedEmail = email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const session = await login({ email: trimmedEmail, password });
      onLoggedIn(session.token, session.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Incorrect email or password.');
      } else {
        setError(err instanceof Error ? err.message : 'Could not log in.');
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
            <Text className="font-heading text-h1 text-text-dark">Welcome back</Text>
            <Text className="mt-2 font-body text-body text-text-mid">Log in with your email and password.</Text>

            <View className="mt-8 gap-4">
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
                    autoComplete="password"
                    onChangeText={setPassword}
                    placeholder="Your password"
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
              {submitting ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-subheading text-h3 text-cream">Log in</Text>}
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onSwitchToRegister} className="mt-5 items-center py-2">
              <Text className="font-body-medium text-body text-teal-dark">Don't have an account? Register</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
