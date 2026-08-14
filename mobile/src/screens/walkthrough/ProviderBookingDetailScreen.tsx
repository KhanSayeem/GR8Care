import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card } from '../../components';
import { BookingDetailRecord, BookingStatus, getBookingDetail, updateBooking } from '../../api/booking';

interface ProviderBookingDetailScreenProps {
  bookingId: string;
  onBack: () => void;
}

const STATUS_BADGE: Record<BookingStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  inProgress: { label: 'In Progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  declined: { label: 'Declined', tone: 'error' },
};

const COMPLETABLE_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'inProgress'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatTime12h(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

function formatTimeRange(startIso: string, endIso: string) {
  return `${formatTime12h(new Date(startIso))} - ${formatTime12h(new Date(endIso))}`;
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border py-2">
      <Text className="font-body text-caption text-text-light">{label}</Text>
      <Text className="font-body-medium text-caption text-text-dark">{value}</Text>
    </View>
  );
}

export function ProviderBookingDetailScreen({ bookingId, onBack }: ProviderBookingDetailScreenProps) {
  const [booking, setBooking] = useState<BookingDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBookingDetail(bookingId);
      setBooking(result.booking);
      setNotes(result.booking.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const participantName = booking?.participant?.displayName ?? 'Participant';
  const goals = useMemo(() => booking?.participant?.goals ?? [], [booking]);
  const notesChanged = booking !== null && notes !== booking.notes;
  const canComplete = booking !== null && COMPLETABLE_STATUSES.includes(booking.status);

  async function handleSaveNotes() {
    if (!booking) return;
    setSavingNotes(true);
    setActionError(null);
    try {
      const result = await updateBooking(booking.id, { notes });
      setBooking(result.booking);
      setNotes(result.booking.notes);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Notes could not be saved.');
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleMarkComplete() {
    if (!booking) return;
    setCompleting(true);
    setActionError(null);
    try {
      const result = await updateBooking(booking.id, { status: 'completed' });
      setBooking(result.booking);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Session could not be marked complete.');
    } finally {
      setCompleting(false);
    }
  }

  function handleContactParticipant() {
    if (!booking?.participant?.email) return;
    Linking.openURL(`mailto:${booking.participant.email}`).catch(() => {
      setActionError('Could not open an email client on this device.');
    });
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to schedule"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Session Detail</Text>
          </View>

          {loading ? (
            <View className="mt-10 items-center justify-center gap-2 py-10">
              <ActivityIndicator color="#0B4F6C" />
              <Text className="font-body text-caption text-text-mid">Loading session...</Text>
            </View>
          ) : error || !booking ? (
            <View className="mt-10 items-center justify-center gap-2 py-6">
              <Ionicons name="alert-circle" color="#E53E3E" size={22} />
              <Text className="font-body-medium text-caption text-text-dark text-center">{error ?? 'Session not found.'}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={loadBooking}
                className="mt-2 h-9 min-w-[110px] items-center justify-center rounded-md bg-teal-dark px-4"
              >
                <Text className="font-body-bold text-caption text-cream">Retry</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Card className="mt-5 bg-white">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-teal-dark">
                    <Text className="font-heading text-h3 text-white">{initials(participantName)}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-heading text-h3 text-text-dark">{participantName}</Text>
                    {booking.participant?.email ? <Text className="mt-0.5 font-body text-caption text-text-mid">{booking.participant.email}</Text> : null}
                  </View>
                  <Badge label={STATUS_BADGE[booking.status].label} tone={STATUS_BADGE[booking.status].tone} />
                </View>
              </Card>

              <Card className="mt-5 bg-white">
                <Text className="font-heading text-h3 text-text-dark">Session Details</Text>
                <View className="mt-2">
                  <SummaryRow label="Service" value={booking.service} />
                  <SummaryRow label="Date" value={formatDateLong(booking.scheduledStart)} />
                  <SummaryRow label="Time" value={formatTimeRange(booking.scheduledStart, booking.scheduledEnd)} />
                  <SummaryRow label="Funding" value={booking.supportCategory} />
                  {booking.location ? <SummaryRow label="Session" value={booking.location} /> : null}
                </View>
              </Card>

              <View className="mt-5 gap-2">
                <Text className="font-caption text-label uppercase text-text-light">Participant Goals</Text>
                {goals.length === 0 ? (
                  <Card className="bg-white">
                    <Text className="font-body text-caption text-text-mid">No goals recorded for this participant.</Text>
                  </Card>
                ) : (
                  <Card className="bg-white">
                    {goals.map((goal, index) => (
                      <View key={`${goal}-${index}`} className={`flex-row items-start gap-2 ${index > 0 ? 'mt-2' : ''}`}>
                        <Ionicons name="flag" color="#0B4F6C" size={16} />
                        <Text className="flex-1 font-body text-caption text-text-dark">{goal}</Text>
                      </View>
                    ))}
                  </Card>
                )}
              </View>

              <View className="mt-5 gap-2">
                <Text className="font-caption text-label uppercase text-text-light">Session Notes</Text>
                <Card className="bg-white">
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes about this session..."
                    placeholderTextColor="#A0AEC0"
                    multiline
                    className="min-h-[88px] font-body text-body text-text-dark"
                    textAlignVertical="top"
                  />
                </Card>
                <Button label={savingNotes ? 'Saving...' : 'Save Notes'} variant="outline" loading={savingNotes} disabled={!notesChanged} onPress={handleSaveNotes} />
              </View>

              {actionError ? (
                <Card className="mt-5 border-[#E53E3E] bg-[#FED7D7]">
                  <Text className="font-body-medium text-caption text-[#9B2C2C]">{actionError}</Text>
                </Card>
              ) : null}

              <View className="mt-5 gap-3">
                <Button label="Contact Participant" variant="outline" onPress={handleContactParticipant} />
                {canComplete ? (
                  <Button label="Mark Session Complete" loading={completing} onPress={handleMarkComplete} />
                ) : null}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}
