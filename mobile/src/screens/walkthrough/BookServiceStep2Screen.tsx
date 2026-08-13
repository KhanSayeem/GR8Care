import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';

interface BookServiceStep2ScreenProps {
  onBack: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CALENDAR_ROWS: Array<Array<number | null>> = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
];
const BOOKED_DAYS = new Set([4, 5, 8, 11, 12, 18]);
const BOOKED_SLOTS = new Set(['8:00 AM', '9:00 AM', '12:00 PM']);
const TIME_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

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

export function BookServiceStep2Screen({ onBack }: BookServiceStep2ScreenProps) {
  const [selectedDay, setSelectedDay] = useState(15);
  const [selectedSlot, setSelectedSlot] = useState('2:00 PM');
  const [confirmed, setConfirmed] = useState(false);

  const selectedLabel = useMemo(() => `Wed ${selectedDay} Jan`, [selectedDay]);

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
            <View className="flex-row items-center justify-between">
              <Text className="font-heading text-h3 text-text-dark">January 2025</Text>
              <View className="flex-row items-center gap-3">
                <Ionicons name="chevron-back" color="#0B4F6C" size={18} />
                <Ionicons name="chevron-forward" color="#0B4F6C" size={18} />
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
              {CALENDAR_ROWS.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-between">
                  {row.map((day, columnIndex) => {
                    if (day === null) {
                      return <View key={`blank-${columnIndex}`} className="h-8 w-8" />;
                    }

                    const booked = BOOKED_DAYS.has(day);
                    const selected = selectedDay === day;
                    return (
                      <Pressable
                        key={day}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: booked, selected }}
                        disabled={booked}
                        onPress={() => {
                          setSelectedDay(day);
                          setConfirmed(false);
                        }}
                        className={`h-8 w-8 items-center justify-center rounded-full ${selected ? 'bg-teal-dark' : 'bg-white'}`}
                      >
                        <Text className={`font-body text-caption ${booked ? 'text-[#D0D0D0]' : selected ? 'text-white' : 'text-text-dark'}`}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </Card>

          <View className="mt-5 gap-3">
            <Text className="font-caption text-label text-text-light">Available Time Slots - Jan {selectedDay}</Text>
            <View className="flex-row flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => {
                const booked = BOOKED_SLOTS.has(slot);
                const selected = selectedSlot === slot;
                return (
                  <Pressable
                    key={slot}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: booked, selected }}
                    disabled={booked}
                    onPress={() => {
                      setSelectedSlot(slot);
                      setConfirmed(false);
                    }}
                    className={`h-10 w-[23%] items-center justify-center rounded-sm border ${
                      booked ? 'border-border bg-border' : selected ? 'border-teal-dark bg-teal-dark' : 'border-border bg-white'
                    }`}
                  >
                    <Text className={`font-body-medium text-caption ${booked ? 'text-text-light' : selected ? 'text-white' : 'text-text-dark'}`}>
                      {slot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Card variant="warning" className="mt-5 bg-[#FEF3C7] p-3">
            <Text className="font-body text-caption text-[#92400E]">
              Locked slots are booked · Selected: {selectedLabel} · {selectedSlot}
            </Text>
          </Card>

          <View className="mt-5 gap-3">
            <Button
              label={confirmed ? 'Schedule selection saved' : 'Next: Confirm Booking'}
              onPress={() => setConfirmed(true)}
            />
            <Button label="← Change Service" variant="outline" onPress={onBack} />
          </View>

          {confirmed ? (
            <Card variant="highlight" className="mt-4">
              <Text className="font-caption text-label uppercase text-teal-dark">Ready to confirm</Text>
              <Text className="mt-1 font-body text-body text-text-mid">
                Daily Living Support · {selectedLabel} · {selectedSlot}
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
