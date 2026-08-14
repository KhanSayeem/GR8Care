import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card } from '../../components';
import { BookingDetailRecord, BookingStatus, BookingWindow, cancelBooking, getBookingDetail, getBookings } from '../../api/booking';

interface MyBookingsScreenProps {
  onBack: () => void;
  onTrackProvider?: (booking: BookingDetailRecord) => void;
}

const CANCELLABLE_STATUSES: BookingStatus[] = ['pending', 'confirmed'];
const TRACKABLE_STATUSES: BookingStatus[] = ['confirmed', 'inProgress'];

const STATUS_BADGE: Record<BookingStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  inProgress: { label: 'In Progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  declined: { label: 'Declined', tone: 'error' },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// Provider availability blocks are UTC-anchored wall-clock times (see backend
// providerAvailability.js), so scheduledStart/End must be read back in UTC too -
// otherwise a booking made for "9:00 AM" shows a different, device-timezone-shifted
// time here than what Step 2/Step 3 displayed when the booking was created.
function formatTime12h(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

function isSameUtcDay(a: Date, b: Date) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function formatWhen(scheduledStart: string, scheduledEnd: string) {
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);
  const isToday = isSameUtcDay(start, new Date());
  const dayLabel = isToday
    ? 'Today'
    : start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${dayLabel} - ${formatTime12h(start)} - ${formatTime12h(end)}`;
}

function BookingCard({
  booking,
  onCancel,
  onTrack,
  cancelling,
}: {
  booking: BookingDetailRecord;
  onCancel: () => void;
  onTrack?: () => void;
  cancelling: boolean;
}) {
  const providerName = booking.provider?.displayName ?? 'Provider';
  const badge = STATUS_BADGE[booking.status];
  const canCancel = CANCELLABLE_STATUSES.includes(booking.status);
  const canTrack = TRACKABLE_STATUSES.includes(booking.status) && Boolean(onTrack);

  return (
    <Card className="bg-white">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-dark">
          <Text className="font-heading text-h3 text-white">{initials(providerName)}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-heading text-h3 text-text-dark">{providerName}</Text>
          <Text className="mt-0.5 font-body text-caption text-text-mid">{booking.service}</Text>
          <Text className="mt-0.5 font-body text-caption text-text-light">{formatWhen(booking.scheduledStart, booking.scheduledEnd)}</Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>

      <View className="mt-3 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={!canTrack}
          onPress={onTrack}
          className={`h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-md bg-teal-dark ${canTrack ? '' : 'opacity-50'}`}
        >
          <Ionicons name="location" color="#F7F3EE" size={14} />
          <Text className="font-body-bold text-caption text-cream">Track Provider</Text>
        </Pressable>
        {canCancel ? (
          <Pressable
            accessibilityRole="button"
            disabled={cancelling}
            onPress={onCancel}
            className="h-10 flex-1 items-center justify-center rounded-md border border-border bg-white"
          >
            {cancelling ? <ActivityIndicator color="#0B4F6C" /> : <Text className="font-body-bold text-caption text-text-dark">Cancel</Text>}
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export function MyBookingsScreen({ onBack, onTrackProvider }: MyBookingsScreenProps) {
  const [tab, setTab] = useState<BookingWindow>('upcoming');
  const [bookings, setBookings] = useState<BookingDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(
    async (window: BookingWindow, opts: { silent?: boolean } = {}) => {
      if (opts.silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const list = await getBookings(window);
        const details = await Promise.all(list.bookings.map((booking) => getBookingDetail(booking.id).then((res) => res.booking)));
        setBookings(details);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bookings could not be loaded.');
        setBookings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadBookings(tab);
  }, [tab, loadBookings]);

  function confirmCancel(booking: BookingDetailRecord) {
    Alert.alert('Cancel this booking?', `${booking.provider?.displayName ?? 'This provider'} will be notified. This cannot be undone.`, [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          setCancellingId(booking.id);
          try {
            await cancelBooking(booking.id);
            await loadBookings(tab, { silent: true });
          } catch (err) {
            Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setCancellingId(null);
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">My Bookings</Text>
          </View>

          <View className="mt-5 flex-row rounded-md border border-border bg-white p-1">
            {(['upcoming', 'past'] as const).map((key) => {
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
                    {key === 'upcoming' ? 'Upcoming' : 'Past'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-5 gap-3">
            {loading ? (
              <View className="items-center justify-center gap-2 py-10">
                <ActivityIndicator color="#0B4F6C" />
                <Text className="font-body text-caption text-text-mid">Loading bookings...</Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center gap-2 py-6">
                <Ionicons name="alert-circle" color="#E53E3E" size={22} />
                <Text className="font-body-medium text-caption text-text-dark text-center">{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={refreshing}
                  onPress={() => loadBookings(tab, { silent: true })}
                  className="mt-2 h-9 min-w-[110px] items-center justify-center rounded-md bg-teal-dark px-4"
                >
                  {refreshing ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-body-bold text-caption text-cream">Retry</Text>}
                </Pressable>
              </View>
            ) : bookings.length === 0 ? (
              <Card className="bg-white">
                <Text className="font-body text-caption text-text-mid text-center">
                  No {tab === 'upcoming' ? 'upcoming' : 'past'} bookings yet.
                </Text>
              </Card>
            ) : (
              bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  cancelling={cancellingId === booking.id}
                  onCancel={() => confirmCancel(booking)}
                  onTrack={onTrackProvider ? () => onTrackProvider(booking) : undefined}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
