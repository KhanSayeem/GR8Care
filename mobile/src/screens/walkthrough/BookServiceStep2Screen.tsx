import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { AvailabilityDay, AvailabilitySlot, getProviderAvailability } from '../../api/booking';
import { ScheduleSelection } from '../../types/bookingDraft';

// Placeholder until a "Find Providers" flow supplies a real selection. Override for local
// testing with EXPO_PUBLIC_DEMO_PROVIDER_ID; an empty value shows the "no provider" state.
const DEMO_PROVIDER_ID = process.env.EXPO_PUBLIC_DEMO_PROVIDER_ID ?? '';

interface BookServiceStep2ScreenProps {
  onBack: () => void;
  onContinue?: (schedule: ScheduleSelection) => void;
  providerId?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatYMD(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseYMD(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function formatTime12h(value: string) {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minuteStr} ${period}`;
}

function formatTimeRange(start: string, end: string) {
  return `${formatTime12h(start)} - ${formatTime12h(end)}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDayHeading(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSelectedLabel(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

type CalendarCell = { day: number; dateStr: string } | null;

function StepIndicator() {
  return (
    <View className="mt-5 flex-row items-start px-10">
      {[1, 2, 3].map((step, index) => {
        const complete = step === 1;
        const active = step === 2;
        return (
          <React.Fragment key={step}>
            <View className="items-center">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${
                  complete ? 'bg-provider-green' : active ? 'bg-teal-dark' : 'bg-border'
                }`}
              >
                <Text className={`font-body-bold text-[13px] ${complete || active ? 'text-white' : 'text-text-light'}`}>
                  {complete ? '✓' : step}
                </Text>
              </View>
              <Text className={`mt-1 font-caption text-label ${active ? 'text-teal-dark' : 'text-text-light'}`}>
                {step === 1 ? 'Service' : step === 2 ? 'Schedule' : 'Confirm'}
              </Text>
            </View>
            {index < 2 ? <View className={`mt-3 h-0.5 flex-1 ${step === 1 ? 'bg-provider-green' : 'bg-border'}`} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function TimeSlotRow({ slot, selected, onPress }: { slot: AvailabilitySlot; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-14 flex-row items-center justify-between rounded-md border px-3 py-2 ${
        selected ? 'border-2 border-teal-dark bg-teal-light' : 'border-border bg-white'
      }`}
    >
      <View>
        <Text className="font-heading text-h3 text-text-dark">{formatTimeRange(slot.start, slot.end)}</Text>
        <Text className="mt-0.5 font-body text-caption text-text-mid">{slot.service}</Text>
      </View>
      {selected ? <Ionicons name="checkmark" color="#0B4F6C" size={20} /> : null}
    </Pressable>
  );
}

export function BookServiceStep2Screen({ onBack, onContinue, providerId = DEMO_PROVIDER_ID }: BookServiceStep2ScreenProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDay[]>([]);
  const [providerName, setProviderName] = useState('');
  const [boundary, setBoundary] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const todayStr = useMemo(() => formatYMD(new Date()), []);

  const loadAvailability = useCallback(
    async (month: Date, opts: { silent?: boolean } = {}) => {
      if (opts.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const startDate = formatYMD(startOfMonth(month));
        const endDate = formatYMD(endOfMonth(month));
        const result = await getProviderAvailability(providerId, startDate, endDate);
        setAvailabilityDays(result.days);
        setBoundary(result.boundary);
        setProviderName(result.provider.displayName);
        const firstOpenDay = result.days.find((day) => day.date >= todayStr && day.openSlots.length > 0);
        setSelectedDate(firstOpenDay?.date ?? null);
        setSelectedSlotId(null);
        setConfirmed(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Availability could not be loaded.');
        setAvailabilityDays([]);
        setSelectedDate(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [providerId, todayStr]
  );

  useEffect(() => {
    if (!providerId) {
      setLoading(false);
      setError(null);
      setAvailabilityDays([]);
      setSelectedDate(null);
      return;
    }
    loadAvailability(visibleMonth);
  }, [visibleMonth, providerId, loadAvailability]);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, AvailabilityDay>();
    availabilityDays.forEach((entry) => map.set(entry.date, entry));
    return map;
  }, [availabilityDays]);

  const monthGrid = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    const daysInMonth = endOfMonth(visibleMonth).getDate();
    const leadingBlanks = first.getDay();
    const cells: CalendarCell[] = [];
    for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, dateStr: formatYMD(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)) });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [visibleMonth]);

  const canGoBackMonth = formatYMD(startOfMonth(visibleMonth)) > formatYMD(startOfMonth(new Date()));
  const daySlots = (selectedDate ? availabilityByDate.get(selectedDate)?.openSlots : undefined) ?? [];
  const selectedSlot = daySlots.find((slot) => slot.id === selectedSlotId) ?? null;

  function handleSelectDay(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlotId(null);
    setConfirmed(false);
  }

  function handleSelectSlot(slotId: string) {
    setSelectedSlotId(slotId);
    setConfirmed(false);
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change service"
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
            >
              <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
            </Pressable>
            <Text className="font-heading text-h1 text-text-dark">Select Date & Time</Text>
          </View>

          <StepIndicator />

          <Card className="mt-5 bg-white">
            {!providerId ? (
              <View className="items-center justify-center gap-2 py-8">
                <Ionicons name="calendar-outline" color="#0B4F6C" size={22} />
                <Text className="font-body-medium text-caption text-text-dark text-center">No provider selected yet</Text>
                <Text className="font-body text-caption text-text-mid text-center">
                  Choose a provider from Step 1 to see their real availability.
                </Text>
              </View>
            ) : loading ? (
              <View className="items-center justify-center gap-2 py-10">
                <ActivityIndicator color="#0B4F6C" />
                <Text className="font-body text-caption text-text-mid">Loading availability...</Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center gap-2 py-6">
                <Ionicons name="alert-circle" color="#E53E3E" size={22} />
                <Text className="font-body-medium text-caption text-text-dark text-center">{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={refreshing}
                  onPress={() => loadAvailability(visibleMonth, { silent: true })}
                  className="mt-2 h-9 min-w-[110px] items-center justify-center rounded-md bg-teal-dark px-4"
                >
                  {refreshing ? <ActivityIndicator color="#F7F3EE" /> : <Text className="font-body-bold text-caption text-cream">Retry</Text>}
                </Pressable>
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between">
                  <Text className="font-heading text-h3 text-text-dark">{formatMonthLabel(visibleMonth)}</Text>
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous month"
                      accessibilityState={{ disabled: !canGoBackMonth }}
                      disabled={!canGoBackMonth}
                      onPress={() => setVisibleMonth((prev) => addMonths(prev, -1))}
                    >
                      <Ionicons name="chevron-back" color={canGoBackMonth ? '#0B4F6C' : '#D0D0D0'} size={18} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next month"
                      onPress={() => setVisibleMonth((prev) => addMonths(prev, 1))}
                    >
                      <Ionicons name="chevron-forward" color="#0B4F6C" size={18} />
                    </Pressable>
                  </View>
                </View>

                <View className="mt-4 flex-row justify-between">
                  {WEEKDAYS.map((day) => (
                    <Text key={day} className="w-8 text-center font-caption text-label text-text-light">
                      {day}
                    </Text>
                  ))}
                </View>

                <View className="mt-3 gap-2">
                  {monthGrid.map((row, rowIndex) => (
                    <View key={rowIndex} className="flex-row justify-between">
                      {row.map((cell, columnIndex) => {
                        if (!cell) {
                          return <View key={`blank-${rowIndex}-${columnIndex}`} className="h-8 w-8" />;
                        }

                        const entry = availabilityByDate.get(cell.dateStr);
                        const hasSlots = Boolean(entry && entry.openSlots.length > 0);
                        const isPast = cell.dateStr < todayStr;
                        const disabled = isPast || !hasSlots;
                        const selected = selectedDate === cell.dateStr;
                        return (
                          <Pressable
                            key={cell.dateStr}
                            accessibilityRole="button"
                            accessibilityState={{ disabled, selected }}
                            disabled={disabled}
                            onPress={() => handleSelectDay(cell.dateStr)}
                            className={`h-8 w-8 items-center justify-center rounded-full ${selected ? 'bg-teal-dark' : 'bg-white'}`}
                          >
                            <Text className={`font-body text-caption ${disabled ? 'text-[#D0D0D0]' : selected ? 'text-white' : 'text-text-dark'}`}>
                              {cell.day}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card>

          {providerId && !loading && !error ? (
            <View className="mt-5 gap-3">
              <Text className="font-caption text-label text-text-light">
                Available Time Slots{selectedDate ? ` - ${formatDayHeading(parseYMD(selectedDate))}` : ''}
              </Text>
              {selectedDate && daySlots.length > 0 ? (
                <View className="gap-2">
                  {daySlots.map((slot) => (
                    <TimeSlotRow key={slot.id} slot={slot} selected={slot.id === selectedSlotId} onPress={() => handleSelectSlot(slot.id)} />
                  ))}
                </View>
              ) : (
                <Card className="bg-white">
                  <Text className="font-body text-caption text-text-mid text-center">
                    No open availability in {formatMonthLabel(visibleMonth)}. Try another month using the arrows above.
                  </Text>
                </Card>
              )}
            </View>
          ) : null}

          {providerId && !loading && !error && boundary ? (
            <Card variant="warning" className="mt-5 bg-[#FEF3C7] p-3">
              <Text className="font-body text-caption text-[#92400E]">{boundary}</Text>
              {selectedSlot && selectedDate ? (
                <Text className="mt-1 font-body-medium text-caption text-[#92400E]">
                  Selected: {formatSelectedLabel(parseYMD(selectedDate))} · {formatTimeRange(selectedSlot.start, selectedSlot.end)}
                </Text>
              ) : null}
            </Card>
          ) : null}

          <View className="mt-5 gap-3">
            <Button
              label={confirmed ? 'Next: Confirm Booking' : 'Save schedule selection'}
              disabled={!selectedSlot}
              onPress={() => {
                if (confirmed && selectedSlot && selectedDate) {
                  onContinue?.({ provider: { id: providerId, name: providerName }, date: selectedDate, slot: selectedSlot });
                  return;
                }
                setConfirmed(true);
              }}
            />
            <Button label="← Change Service" variant="outline" onPress={onBack} />
          </View>

          {confirmed && selectedSlot && selectedDate ? (
            <Card variant="highlight" className="mt-4">
              <Text className="font-caption text-label uppercase text-teal-dark">Ready to confirm</Text>
              <Text className="mt-1 font-body text-body text-text-mid">
                {selectedSlot.service} · {formatSelectedLabel(parseYMD(selectedDate))} · {formatTimeRange(selectedSlot.start, selectedSlot.end)}
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
