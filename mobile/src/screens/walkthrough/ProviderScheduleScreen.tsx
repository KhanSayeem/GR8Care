import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Badge, Button, Card } from '../../components';
import { BookingDetailRecord, BookingStatus, getBookingDetail, getBookings } from '../../api/booking';

interface ProviderScheduleScreenProps {
  onBack: () => void;
  onOpenAvailability?: () => void;
  onSelectBooking?: (bookingId: string) => void;
}

type RangeKey = 'this-week' | 'next-week' | 'month';

const RANGE_LABELS: Record<RangeKey, string> = {
  'this-week': 'This Week',
  'next-week': 'Next Week',
  month: 'Month',
};

const STATUS_BADGE: Record<BookingStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'error' | 'info' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  inProgress: { label: 'In Progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  declined: { label: 'Declined', tone: 'error' },
};

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcWeek(date: Date) {
  const normalized = startOfUtcDay(date);
  const day = normalized.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addUtcDays(normalized, mondayOffset);
}

function getRangeWindow(range: RangeKey) {
  const now = new Date();
  if (range === 'month') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { start, end };
  }
  const weekStart = startOfUtcWeek(now);
  const start = range === 'next-week' ? addUtcDays(weekStart, 7) : weekStart;
  return { start, end: addUtcDays(start, 7) };
}

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayHeading(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatTime12h(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

function formatTimeRange(startIso: string, endIso: string) {
  return `${formatTime12h(new Date(startIso))} - ${formatTime12h(new Date(endIso))}`;
}

function SessionCard({ booking, onPress }: { booking: BookingDetailRecord; onPress?: () => void }) {
  const badge = STATUS_BADGE[booking.status];
  const participantName = booking.participant?.displayName ?? 'Participant';

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card className="bg-white">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-heading text-h3 text-text-dark">{participantName}</Text>
            <Text className="mt-0.5 font-body text-caption text-text-mid">{booking.service}</Text>
            <Text className="mt-0.5 font-body text-caption text-text-light">{formatTimeRange(booking.scheduledStart, booking.scheduledEnd)}</Text>
          </View>
          <Badge label={badge.label} tone={badge.tone} />
        </View>
      </Card>
    </Pressable>
  );
}

export function ProviderScheduleScreen({ onBack, onOpenAvailability, onSelectBooking }: ProviderScheduleScreenProps) {
  const [range, setRange] = useState<RangeKey>('this-week');
  const [bookings, setBookings] = useState<BookingDetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (opts.silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const list = await getBookings('all');
      const details = await Promise.all(list.bookings.map((booking) => getBookingDetail(booking.id).then((res) => res.booking)));
      setBookings(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Schedule could not be loaded.');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const days = useMemo(() => {
    const { start, end } = getRangeWindow(range);
    const inRange = bookings.filter((booking) => {
      const scheduled = new Date(booking.scheduledStart);
      return scheduled >= start && scheduled < end && booking.status !== 'cancelled' && booking.status !== 'declined';
    });

    const byDay = new Map<string, BookingDetailRecord[]>();
    inRange.forEach((booking) => {
      const key = utcDateKey(new Date(booking.scheduledStart));
      const existing = byDay.get(key) ?? [];
      existing.push(booking);
      byDay.set(key, existing);
    });

    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sessions]) => ({
        date,
        sessions: sessions.sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart)),
      }));
  }, [bookings, range]);

  const totalSessions = days.reduce((sum, day) => sum + day.sessions.length, 0);

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
            <Text className="font-heading text-h1 text-text-dark">My Schedule</Text>
          </View>

          <View className="mt-5 flex-row rounded-md border border-border bg-white p-1">
            {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => {
              const selected = range === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setRange(key)}
                  className={`h-10 flex-1 items-center justify-center rounded-sm ${selected ? 'bg-teal-dark' : 'bg-transparent'}`}
                >
                  <Text className={`font-body-bold text-caption ${selected ? 'text-cream' : 'text-text-mid'}`}>{RANGE_LABELS[key]}</Text>
                </Pressable>
              );
            })}
          </View>

          {!loading && !error ? (
            <Text className="mt-4 font-caption text-label text-text-light">
              {totalSessions} session{totalSessions === 1 ? '' : 's'} - {RANGE_LABELS[range].toLowerCase()}
            </Text>
          ) : null}

          <View className="mt-3 gap-4">
            {loading ? (
              <View className="items-center justify-center gap-2 py-10">
                <ActivityIndicator color="#0B4F6C" />
                <Text className="font-body text-caption text-text-mid">Loading schedule...</Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center gap-2 py-6">
                <Ionicons name="alert-circle" color="#E53E3E" size={22} />
                <Text className="font-body-medium text-caption text-text-dark text-center">{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={refreshing}
                  onPress={() => loadBookings({ silent: true })}
                  className="mt-2 h-9 min-w-[110px] items-center justify-center rounded-md bg-teal-dark px-4"
                >
                  {refreshing ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-body-bold text-caption text-cream">Retry</Text>}
                </Pressable>
              </View>
            ) : days.length === 0 ? (
              <Card className="bg-white">
                <Text className="font-body text-caption text-text-mid text-center">No sessions {RANGE_LABELS[range].toLowerCase()}.</Text>
              </Card>
            ) : (
              days.map((day) => (
                <View key={day.date} className="gap-2">
                  <Text className="font-caption text-label uppercase text-text-light">{formatDayHeading(day.date)}</Text>
                  <View className="gap-2">
                    {day.sessions.map((booking) => (
                      <SessionCard key={booking.id} booking={booking} onPress={() => onSelectBooking?.(booking.id)} />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>

          <View className="mt-5">
            <Button label="+ Availability" variant="outline" onPress={onOpenAvailability} />
          </View>
        </View>
      </ScrollView>
    </>
  );
}
