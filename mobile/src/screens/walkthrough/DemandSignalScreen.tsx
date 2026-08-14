import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Badge, Card } from '../../components';
import {
  InstantRequestRecord,
  InstantRequestWindow,
  acceptInstantRequest,
  declineInstantRequest,
  getInstantRequests,
} from '../../api/instantRequests';

interface DemandSignalScreenProps {
  onBack: () => void;
}

const PAST_STATUS_BADGE: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'error' | 'info' }> = {
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'error' },
  expired: { label: 'Expired', tone: 'neutral' },
};

const REFRESH_INTERVAL_MS = 20000;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatCountdown(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatRespondedAt(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

function LiveRequestCard({
  request,
  now,
  onAccept,
  onDecline,
  actingAction,
}: {
  request: InstantRequestRecord;
  now: number;
  onAccept: () => void;
  onDecline: () => void;
  actingAction: 'accept' | 'decline' | null;
}) {
  const participantName = request.participant?.displayName ?? 'Participant';
  const msRemaining = new Date(request.expiresAt).getTime() - now;
  const isUrgent = msRemaining <= 60000;
  const busy = actingAction !== null;

  return (
    <Card className="bg-white">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-dark">
          <Text className="font-heading text-h3 text-white">{initials(participantName)}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-heading text-h3 text-text-dark">{participantName}</Text>
          <Text className="mt-0.5 font-body text-caption text-text-mid">{request.title || request.service}</Text>
          {request.description ? (
            <Text className="mt-0.5 font-body text-caption text-text-light" numberOfLines={2}>
              {request.description}
            </Text>
          ) : null}
        </View>
        <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${isUrgent ? 'bg-[#FED7D7]' : 'bg-[#D0EAF2]'}`}>
          <Ionicons name="time" color={isUrgent ? '#E53E3E' : '#0B4F6C'} size={13} />
          <Text className={`font-body-bold text-caption ${isUrgent ? 'text-[#E53E3E]' : 'text-teal-dark'}`}>
            {formatCountdown(msRemaining)}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onDecline}
          className="h-10 flex-1 items-center justify-center rounded-md border border-border bg-white"
        >
          {actingAction === 'decline' ? (
            <ActivityIndicator color="#0B4F6C" />
          ) : (
            <Text className="font-body-bold text-caption text-text-dark">Decline</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onAccept}
          className={`h-10 flex-1 items-center justify-center rounded-md bg-teal-dark ${busy ? 'opacity-50' : ''}`}
        >
          {actingAction === 'accept' ? (
            <ActivityIndicator color="#F7F3EE" />
          ) : (
            <Text className="font-body-bold text-caption text-cream">Accept</Text>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

function PastRequestCard({ request }: { request: InstantRequestRecord }) {
  const participantName = request.participant?.displayName ?? 'Participant';
  const badge = PAST_STATUS_BADGE[request.status] ?? { label: request.status, tone: 'neutral' as const };

  return (
    <Card className="bg-white">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-dark">
          <Text className="font-heading text-h3 text-white">{initials(participantName)}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-heading text-h3 text-text-dark">{participantName}</Text>
          <Text className="mt-0.5 font-body text-caption text-text-mid">{request.title || request.service}</Text>
          {request.respondedAt ? (
            <Text className="mt-0.5 font-body text-caption text-text-light">Responded {formatRespondedAt(request.respondedAt)}</Text>
          ) : null}
          {request.status === 'declined' && request.declineReason ? (
            <Text className="mt-0.5 font-body text-caption text-text-light">Reason: {request.declineReason}</Text>
          ) : null}
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>
    </Card>
  );
}

export function DemandSignalScreen({ onBack }: DemandSignalScreenProps) {
  const [tab, setTab] = useState<InstantRequestWindow>('live');
  const [requests, setRequests] = useState<InstantRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actingAction, setActingAction] = useState<'accept' | 'decline' | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadRequests = useCallback(async (window: InstantRequestWindow, opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await getInstantRequests(window);
      setRequests(result.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Requests could not be loaded.');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests(tab);
    }, [tab, loadRequests])
  );

  useEffect(() => {
    if (tab !== 'live') return undefined;
    const interval = setInterval(() => loadRequests('live', { silent: true }), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tab, loadRequests]);

  useEffect(() => {
    if (tab !== 'live') return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [tab]);

  async function respond(request: InstantRequestRecord, action: 'accept' | 'decline') {
    setActingId(request.id);
    setActingAction(action);
    try {
      if (action === 'accept') {
        await acceptInstantRequest(request.id);
      } else {
        await declineInstantRequest(request.id);
      }
      await loadRequests('live', { silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} this request.`);
      await loadRequests('live', { silent: true });
    } finally {
      setActingId(null);
      setActingAction(null);
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
              accessibilityLabel="Back to home"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Instant Requests</Text>
          </View>
          <Text className="mt-1 font-body text-caption text-text-mid">
            Live requests notify you directly. Respond before they expire, then confirm details with the participant.
          </Text>

          <View className="mt-5 flex-row rounded-md border border-border bg-white p-1">
            {(['live', 'past'] as const).map((key) => {
              const selected = tab === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTab(key)}
                  className={`h-10 flex-1 items-center justify-center rounded-sm ${selected ? 'bg-teal-dark' : 'bg-transparent'}`}
                >
                  <Text className={`font-body-bold text-caption ${selected ? 'text-cream' : 'text-text-mid'}`}>
                    {key === 'live' ? 'Live' : 'Past'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-5 gap-3">
            {loading ? (
              <View className="items-center justify-center gap-2 py-10">
                <ActivityIndicator color="#0B4F6C" />
                <Text className="font-body text-caption text-text-mid">Loading requests...</Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center gap-2 py-6">
                <Ionicons name="alert-circle" color="#E53E3E" size={22} />
                <Text className="font-body-medium text-caption text-text-dark text-center">{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={refreshing}
                  onPress={() => loadRequests(tab, { silent: true })}
                  className="mt-2 h-9 min-w-[110px] items-center justify-center rounded-md bg-teal-dark px-4"
                >
                  {refreshing ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-body-bold text-caption text-cream">Retry</Text>}
                </Pressable>
              </View>
            ) : requests.length === 0 ? (
              <Card className="bg-white">
                <Text className="font-body text-caption text-text-mid text-center">
                  {tab === 'live' ? 'No live requests right now.' : 'No past requests yet.'}
                </Text>
              </Card>
            ) : tab === 'live' ? (
              requests.map((request) => (
                <LiveRequestCard
                  key={request.id}
                  request={request}
                  now={now}
                  actingAction={actingId === request.id ? actingAction : null}
                  onAccept={() => respond(request, 'accept')}
                  onDecline={() => respond(request, 'decline')}
                />
              ))
            ) : (
              requests.map((request) => <PastRequestCard key={request.id} request={request} />)
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
