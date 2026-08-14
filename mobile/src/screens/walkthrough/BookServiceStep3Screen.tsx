import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';
import { BookingDraft } from '../../types/bookingDraft';
import { BookingRecord, createBooking, ConflictError } from '../../api/booking';
import { FundingCategoryKey, FundingSummary, getFundingSummary } from '../../api/funding';

interface BookServiceStep3ScreenProps {
  draft: BookingDraft;
  onBack: () => void;
  onDone: () => void;
}

function parseYMD(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
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

function formatDateLong(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
}

function parseHourlyRate(rate: string) {
  const match = rate.match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function computeCost(rate: string, start: string, end: string) {
  const hours = minutesBetween(start, end) / 60;
  return Math.round(parseHourlyRate(rate) * hours);
}

function mapCategoryToFundingKey(category: string): FundingCategoryKey | null {
  if (category.includes('Core')) return 'core';
  if (category.includes('Capacity')) return 'capacity';
  if (category.includes('Capital')) return 'capital';
  return null;
}

function toIsoDateTime(date: string, time: string) {
  return `${date}T${time}:00.000Z`;
}

function shortReference(bookingId: string) {
  return `#BK-${bookingId.slice(-8).toUpperCase()}`;
}

function StepIndicator() {
  return (
    <View className="mt-5 flex-row items-start px-10">
      {[1, 2, 3].map((step, index) => {
        const complete = step < 3;
        const active = step === 3;
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
            {index < 2 ? <View className="mt-3 h-0.5 flex-1 bg-provider-green" /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border py-2">
      <Text className="font-body text-caption text-text-light">{label}</Text>
      <Text className="font-body-medium text-caption text-text-dark">{value}</Text>
    </View>
  );
}

function AssignmentOption({
  title,
  detail,
  icon,
  selected,
  onPress,
}: {
  title: string;
  detail: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-14 flex-1 rounded-md border px-3 py-2 ${selected ? 'border-2 border-teal-dark bg-teal-light' : 'border-border bg-white'}`}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} color={selected ? '#0B4F6C' : '#4A5568'} size={18} />
        <Text className={`font-heading text-h3 ${selected ? 'text-teal-dark' : 'text-text-mid'}`}>{title}</Text>
      </View>
      <Text className="mt-1 font-body text-caption text-text-mid">{detail}</Text>
    </Pressable>
  );
}

export function BookServiceStep3Screen({ draft, onBack, onDone }: BookServiceStep3ScreenProps) {
  const [assignmentMethod, setAssignmentMethod] = useState(draft.assignmentMethod);
  const [funding, setFunding] = useState<FundingSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [booking, setBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    getFundingSummary()
      .then((result) => setFunding(result.summary))
      .catch(() => setFunding(null));
  }, []);

  const scheduleDate = useMemo(() => parseYMD(draft.date), [draft.date]);
  const cost = useMemo(() => computeCost(draft.service.rate, draft.slot.start, draft.slot.end), [draft.service.rate, draft.slot.start, draft.slot.end]);

  const fundingCategory = useMemo(() => {
    const key = mapCategoryToFundingKey(draft.service.category);
    return key ? funding?.categories.find((category) => category.category === key) ?? null : null;
  }, [funding, draft.service.category]);

  const fundingSufficient = fundingCategory ? fundingCategory.remaining >= cost : null;

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    setConflict(false);

    try {
      const result = await createBooking({
        providerId: draft.provider.id,
        service: draft.slot.service,
        scheduledStart: toIsoDateTime(draft.date, draft.slot.start),
        scheduledEnd: toIsoDateTime(draft.date, draft.slot.end),
        supportCategory: mapCategoryToFundingKey(draft.service.category) ?? 'core',
        location: draft.sessionType === 'inPerson' ? 'In-Person' : 'Remote',
        notes: assignmentMethod === 'auto' ? 'Auto-assign requested' : 'Manual worker selection requested',
      });
      setBooking(result.booking);
    } catch (err) {
      if (err instanceof ConflictError) {
        setConflict(true);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Booking could not be confirmed.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (booking) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
        <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
          <View className="w-full items-center self-center" style={{ maxWidth: 390 }}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
            <Text className="mt-2 font-heading text-h1 text-text-dark text-center">Booking Requested!</Text>
            <Text className="mt-1 font-body text-body text-text-mid text-center">
              Sent to {draft.provider.name} - it stays pending until they confirm.
            </Text>

            <Text className="mt-5 font-caption text-label uppercase text-text-light">Booking Reference</Text>
            <Text className="mt-1 font-heading text-h2 text-teal-dark">{shortReference(booking.id)}</Text>

            <Card className="mt-5 w-full bg-white">
              <SummaryRow label="Provider" value={draft.provider.name} />
              <SummaryRow label="Date & Time" value={`${formatDateLong(scheduleDate)} - ${formatTimeRange(draft.slot.start, draft.slot.end)}`} />
              <SummaryRow label="Status" value="Pending confirmation" />
              <SummaryRow label="Cost" value={formatCurrency(cost)} />
            </Card>

            <View className="mt-5 w-full gap-3">
              <Button label="Back to Dashboard" onPress={onDone} />
            </View>
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <Text className="font-heading text-h1 text-text-dark">Confirm Booking</Text>

          <StepIndicator />

          <Card className="mt-5 bg-white">
            <Text className="font-heading text-h3 text-text-dark">Booking Summary</Text>
            <View className="mt-2">
              <SummaryRow label="Provider" value={draft.provider.name} />
              <SummaryRow label="Service" value={draft.service.title} />
              <SummaryRow label="Session" value={draft.sessionType === 'inPerson' ? 'In-Person' : 'Remote'} />
              <SummaryRow label="Date" value={formatDateLong(scheduleDate)} />
              <SummaryRow label="Time" value={formatTimeRange(draft.slot.start, draft.slot.end)} />
              <SummaryRow label="Funding" value={draft.service.category} />
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-body-bold text-body text-text-dark">Total Cost</Text>
              <Text className="font-heading text-h2 text-teal-dark">{formatCurrency(cost)}</Text>
            </View>
          </Card>

          {fundingCategory ? (
            <Card variant={fundingSufficient ? 'highlight' : 'warning'} className="mt-5">
              <Text className="font-body-medium text-caption text-text-dark">
                {fundingCategory.label} remaining: {formatCurrency(fundingCategory.remaining)}
                {fundingSufficient ? ' - sufficient' : ' - over budget for this booking'}
              </Text>
            </Card>
          ) : null}

          <View className="mt-5 gap-2">
            <Text className="font-caption text-label uppercase text-text-light">Assignment Method</Text>
            <View className="flex-row gap-3">
              <AssignmentOption
                title="Auto match"
                detail="GR8Care suggests the best available worker"
                icon="sparkles"
                selected={assignmentMethod === 'auto'}
                onPress={() => setAssignmentMethod('auto')}
              />
              <AssignmentOption
                title="Manual choice"
                detail="Choose from available workers yourself"
                icon="people"
                selected={assignmentMethod === 'manual'}
                onPress={() => setAssignmentMethod('manual')}
              />
            </View>
          </View>

          {error ? (
            <Card className="mt-5 border-[#E53E3E] bg-[#FED7D7]">
              <View className="flex-row items-start gap-2">
                <Ionicons name="alert-circle" color="#E53E3E" size={20} />
                <Text className="flex-1 font-body-medium text-caption text-[#9B2C2C]">{error}</Text>
              </View>
            </Card>
          ) : null}

          <View className="mt-5 gap-3">
            <Button
              label={conflict ? 'Choose a different time' : 'Confirm Booking'}
              loading={submitting}
              onPress={conflict ? onBack : handleConfirm}
            />
            <Button label="← Change Schedule" variant="outline" onPress={onBack} />
          </View>
        </View>
      </ScrollView>
    </>
  );
}
