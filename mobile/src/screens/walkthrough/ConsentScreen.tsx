import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card } from '../../components';
import { ConsentPurpose, ConsentRecord, getConsents, grantConsent, revokeConsent } from '../../api/consent';

interface ConsentScreenProps {
  onBack: () => void;
}

// The client brief treats consent as a first-class record, not a checkbox: a
// participant must be able to see exactly what they agreed to share, with whom,
// and take it back. Revoking writes a new revoked record rather than deleting
// history, so the trail stays auditable.
const CONSENT_OPTIONS: Array<{
  purpose: ConsentPurpose;
  title: string;
  plain: string;
  scope: string[];
  recipients: string[];
}> = [
  {
    purpose: 'providerDiscovery',
    title: 'Show me to providers',
    plain: 'Let matching providers see your suburb, language, and support type so they can offer help.',
    scope: ['suburb', 'preferredLanguage', 'supportCategory'],
    recipients: ['Matched providers'],
  },
  {
    purpose: 'providerContact',
    title: 'Let a provider contact me',
    plain: 'Share your name and contact details with a provider you have booked.',
    scope: ['displayName', 'contactDetails'],
    recipients: ['Booked provider'],
  },
  {
    purpose: 'dataSharing',
    title: 'Share my support notes',
    plain: 'Let your booked provider and support worker read the notes on your bookings.',
    scope: ['bookingNotes', 'supportCategory'],
    recipients: ['Booked provider', 'Assigned support worker'],
  },
  {
    purpose: 'aiTranslation',
    title: 'Translate my messages',
    plain: 'Allow the app to translate what you write into another language.',
    scope: ['messageText'],
    recipients: ['Translation service'],
  },
  {
    purpose: 'voiceInputProcessing',
    title: 'Use my voice input',
    plain: 'Allow spoken input to be turned into text so you can talk instead of type.',
    scope: ['voiceRecording', 'transcript'],
    recipients: ['Speech to text service'],
  },
  {
    purpose: 'documentation',
    title: 'Keep a record of supports',
    plain: 'Keep a written record of your supports so you can look back on them later.',
    scope: ['bookingHistory', 'feedback'],
    recipients: ['GR8Care app record'],
  },
];

function latestFor(consents: ConsentRecord[], purpose: ConsentPurpose) {
  return consents.find((consent) => consent.purpose === purpose) ?? null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ConsentScreen({ onBack }: ConsentScreenProps) {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [boundary, setBoundary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyPurpose, setBusyPurpose] = useState<ConsentPurpose | null>(null);

  const load = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const res = await getConsents();
      setConsents(res.consents);
      setBoundary(res.boundary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Consent records could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(option: (typeof CONSENT_OPTIONS)[number], active: ConsentRecord | null) {
    setBusyPurpose(option.purpose);
    try {
      if (active && active.decision === 'granted') {
        await revokeConsent(active.id);
      } else {
        await grantConsent({
          purpose: option.purpose,
          scope: option.scope,
          recipients: option.recipients,
          reason: option.plain,
        });
      }
      await load({ silent: true });
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyPurpose(null);
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
              accessibilityLabel="Back"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <View className="flex-1">
              <Text className="font-heading text-h2 text-text-dark">Privacy and consent</Text>
              <Text className="font-body text-caption text-text-mid">What you share, and who sees it</Text>
            </View>
          </View>

          {boundary ? (
            <View style={{ marginTop: 16 }} className="rounded-md border border-teal-light bg-white p-3">
              <Text className="font-body text-caption text-text-mid">{boundary}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={{ marginTop: 32 }} className="items-center">
              <ActivityIndicator color="#0B4F6C" />
            </View>
          ) : null}

          {error ? (
            <Card className="bg-white" style={{ marginTop: 16 }}>
              <Text className="font-body text-caption text-text-mid">{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => load()}
                style={{ marginTop: 12 }}
                className="h-10 items-center justify-center rounded-md bg-teal-dark"
              >
                <Text className="font-body-bold text-caption text-cream">Try again</Text>
              </Pressable>
            </Card>
          ) : null}

          {!loading && !error
            ? CONSENT_OPTIONS.map((option) => {
                const record = latestFor(consents, option.purpose);
                const granted = record?.decision === 'granted';
                const busy = busyPurpose === option.purpose;

                return (
                  <View key={option.purpose} style={{ marginTop: 16 }}>
                    <Card className="bg-white">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="flex-1 font-heading text-h3 text-text-dark">{option.title}</Text>
                        <Badge label={granted ? 'On' : 'Off'} tone={granted ? 'success' : 'neutral'} />
                      </View>
                      <Text style={{ marginTop: 6 }} className="font-body text-caption text-text-mid">
                        {option.plain}
                      </Text>
                      <Text style={{ marginTop: 8 }} className="font-body-medium text-label text-text-dark">
                        Shared with: {option.recipients.join(', ')}
                      </Text>
                      {record ? (
                        <Text style={{ marginTop: 4 }} className="font-body text-label text-text-light">
                          {granted ? 'Agreed ' : 'Withdrawn '}
                          {formatDate(granted ? record.decidedAt : record.revokedAt ?? record.decidedAt)}
                        </Text>
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${granted ? 'Withdraw' : 'Give'} consent for ${option.title}`}
                        disabled={busy}
                        onPress={() => toggle(option, record)}
                        style={{ marginTop: 12 }}
                        className={`h-10 items-center justify-center rounded-md ${
                          granted ? 'border border-border bg-white' : 'bg-teal-dark'
                        } ${busy ? 'opacity-50' : ''}`}
                      >
                        {busy ? (
                          <ActivityIndicator color={granted ? '#0B4F6C' : '#F7F3EE'} />
                        ) : (
                          <Text className={`font-body-bold text-caption ${granted ? 'text-text-dark' : 'text-cream'}`}>
                            {granted ? 'Withdraw consent' : 'Give consent'}
                          </Text>
                        )}
                      </Pressable>
                    </Card>
                  </View>
                );
              })
            : null}
        </View>
      </ScrollView>
    </>
  );
}
