import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Badge, Button, Card } from '../../components';
import { providerAvailabilityBlocks } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

type AvailabilityBlock = (typeof providerAvailabilityBlocks)[number];

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function createBlock(day: string, index: number): AvailabilityBlock {
  return {
    id: `${day.toLowerCase()}-${Date.now()}-${index}`,
    day,
    start: '09:00',
    end: '12:00',
    service: 'General support',
    enabled: true,
  };
}

interface SetAvailabilityScreenProps {
  onBack?: () => void;
}

export function SetAvailabilityScreen({ onBack }: SetAvailabilityScreenProps) {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(providerAvailabilityBlocks);
  const [selectedDay, setSelectedDay] = useState(providerAvailabilityBlocks[0]?.day ?? 'Monday');
  const [saved, setSaved] = useState(false);

  const selectedBlocks = useMemo(() => blocks.filter((block) => block.day === selectedDay), [blocks, selectedDay]);
  const availableBlockCount = blocks.filter((block) => block.enabled).length;

  const updateBlock = (id: string, patch: Partial<AvailabilityBlock>) => {
    setSaved(false);
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  };

  const addBlock = () => {
    setSaved(false);
    setBlocks((current) => [...current, createBlock(selectedDay, current.length + 1)]);
  };

  const removeBlock = (id: string) => {
    setSaved(false);
    setBlocks((current) => current.filter((block) => block.id !== id));
  };

  const saveAvailability = () => {
    setSaved(true);
  };

  return (
    <ScreenShell
      eyebrow="Provider schedule"
      title="Set availability"
      subtitle="Choose the days and time blocks participants can request before your team confirms a booking."
    >
      {onBack ? <Button label="Back to home" variant="outline" onPress={onBack} /> : null}

      <Card variant="highlight">
        <View className="flex-row flex-wrap items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-teal-dark">This week</Text>
            <Text className="mt-2 font-heading text-h2 text-text-dark">{availableBlockCount} available blocks</Text>
            <Text className="mt-2 font-body text-body text-text-mid">
              Toggle blocks off when you are unavailable, or add a new block for the selected day.
            </Text>
          </View>
          <Badge label={saved ? 'Saved' : 'Draft'} tone={saved ? 'success' : 'warning'} />
        </View>
      </Card>

      <View className="flex-row flex-wrap gap-2">
        {weekdays.map((day) => {
          const isSelected = day === selectedDay;
          const dayBlocks = blocks.filter((block) => block.day === day && block.enabled).length;

          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={`rounded-md border px-3 py-2 ${isSelected ? 'border-teal-dark bg-teal-dark' : 'border-border bg-white'}`}
              onPress={() => setSelectedDay(day)}
            >
              <Text className={`font-body-medium text-caption ${isSelected ? 'text-white' : 'text-text-dark'}`}>{day.slice(0, 3)}</Text>
              <Text className={`mt-0.5 font-caption text-label ${isSelected ? 'text-teal-light' : 'text-text-mid'}`}>
                {dayBlocks} on
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card>
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="font-heading text-h2 text-text-dark">{selectedDay}</Text>
            <Text className="mt-1 font-body text-body text-text-mid">Manage time blocks for this day.</Text>
          </View>
          <View className="w-32">
            <Button label="Add block" variant="outline" onPress={addBlock} />
          </View>
        </View>

        <View className="mt-4 gap-3">
          {selectedBlocks.length === 0 ? (
            <View className="rounded-md border border-border bg-cream p-4">
              <Text className="font-body-medium text-caption text-text-dark">No blocks for {selectedDay}</Text>
              <Text className="mt-1 font-body text-caption text-text-mid">Add a block to show availability on this day.</Text>
            </View>
          ) : (
            selectedBlocks.map((block) => (
              <View key={block.id} className="rounded-md border border-border bg-cream p-3">
                <View className="flex-row flex-wrap items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-body-medium text-caption text-text-dark">{block.service}</Text>
                    <Text className="mt-1 font-body text-caption text-text-mid">
                      {block.start} to {block.end}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityState={{ checked: block.enabled }}
                    className={`min-w-24 rounded-md px-3 py-2 ${block.enabled ? 'bg-provider-green' : 'bg-border'}`}
                    onPress={() => updateBlock(block.id, { enabled: !block.enabled })}
                  >
                    <Text className={`text-center font-body-medium text-caption ${block.enabled ? 'text-white' : 'text-text-mid'}`}>
                      {block.enabled ? 'Available' : 'Hidden'}
                    </Text>
                  </Pressable>
                </View>

                <View className="mt-3 flex-row gap-2">
                  <View className="flex-1">
                    <Text className="mb-1 font-caption text-label uppercase text-text-mid">Start</Text>
                    <TextInput
                      accessibilityLabel={`${block.day} availability start time`}
                      className="h-11 rounded-md border border-border bg-white px-3 font-body text-body text-text-dark"
                      onChangeText={(start) => updateBlock(block.id, { start })}
                      placeholder="09:00"
                      placeholderTextColor="#A0AEC0"
                      value={block.start}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 font-caption text-label uppercase text-text-mid">End</Text>
                    <TextInput
                      accessibilityLabel={`${block.day} availability end time`}
                      className="h-11 rounded-md border border-border bg-white px-3 font-body text-body text-text-dark"
                      onChangeText={(end) => updateBlock(block.id, { end })}
                      placeholder="12:00"
                      placeholderTextColor="#A0AEC0"
                      value={block.end}
                    />
                  </View>
                </View>

                <View className="mt-3">
                  <Text className="mb-1 font-caption text-label uppercase text-text-mid">Service type</Text>
                  <TextInput
                    accessibilityLabel={`${block.day} availability service type`}
                    className="h-11 rounded-md border border-border bg-white px-3 font-body text-body text-text-dark"
                    onChangeText={(service) => updateBlock(block.id, { service })}
                    placeholder="General support"
                    placeholderTextColor="#A0AEC0"
                    value={block.service}
                  />
                </View>

                <Pressable accessibilityRole="button" className="mt-3 self-start rounded-md px-1 py-2" onPress={() => removeBlock(block.id)}>
                  <Text className="font-body-medium text-caption text-error">Remove block</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </Card>

      <Card variant="warning">
        <Text className="font-caption text-label uppercase text-warning">Booking boundary</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Availability blocks are a scheduling guide only. Confirm participant consent, worker assignment, and provider policy before accepting a service.
        </Text>
      </Card>

      <Button label={saved ? 'Availability saved' : 'Save availability'} variant="primary" onPress={saveAvailability} />
    </ScreenShell>
  );
}
