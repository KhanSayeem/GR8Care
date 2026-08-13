import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card } from '../../components';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface BookServiceStep1ScreenProps {
  onBack: () => void;
}

const SERVICE_OPTIONS: Array<{
  id: string;
  title: string;
  category: string;
  rate: string;
  icon: IoniconName;
}> = [
  { id: 'daily-living', title: 'Daily Living Support', category: 'Core Supports', rate: '$95/hr', icon: 'home' },
  { id: 'transport', title: 'Transport Assistance', category: 'Core Supports', rate: '$75/hr', icon: 'car' },
  { id: 'capacity', title: 'Capacity Building', category: 'Capacity Building', rate: '$105/hr', icon: 'school' },
  { id: 'home-modification', title: 'Home Modification', category: 'Capital Supports', rate: '$120/hr', icon: 'construct' },
];

const ASSIGNMENT_OPTIONS: Array<{
  id: 'auto' | 'manual';
  title: string;
  detail: string;
  icon: IoniconName;
}> = [
  { id: 'auto', title: 'Auto match', detail: 'GR8Care suggests the best available worker', icon: 'sparkles' },
  { id: 'manual', title: 'Manual choice', detail: 'Choose from available workers yourself', icon: 'people' },
];

const SESSION_OPTIONS: Array<{
  id: 'inPerson' | 'remote';
  title: string;
  icon: IoniconName;
}> = [
  { id: 'inPerson', title: 'In-Person', icon: 'people' },
  { id: 'remote', title: 'Remote', icon: 'laptop' },
];

function StepIndicator() {
  return (
    <View className="mt-5 flex-row items-start px-10">
      {[1, 2, 3].map((step, index) => {
        const active = step === 1;
        return (
          <React.Fragment key={step}>
            <View className="items-center">
              <View className={`h-7 w-7 items-center justify-center rounded-full ${active ? 'bg-teal-dark' : 'bg-border'}`}>
                <Text className={`font-body-bold text-[13px] ${active ? 'text-white' : 'text-text-light'}`}>{step}</Text>
              </View>
              <Text className={`mt-1 font-caption text-label ${active ? 'text-teal-dark' : 'text-text-light'}`}>
                {step === 1 ? 'Service' : step === 2 ? 'Schedule' : 'Confirm'}
              </Text>
            </View>
            {index < 2 ? <View className="mt-3 h-0.5 flex-1 bg-border" /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SelectCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: IoniconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`min-h-14 rounded-md border px-3 py-2 ${selected ? 'border-2 border-teal-dark bg-teal-light' : 'border-border bg-white'}`}
    >
      <View className="flex-row items-center gap-3">
        <View className={`h-9 w-9 items-center justify-center rounded-full ${selected ? 'bg-white' : 'bg-cream'}`}>
          <Ionicons name={icon} color={selected ? '#0B4F6C' : '#4A5568'} size={20} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-heading text-h3 text-text-dark">{title}</Text>
          {subtitle ? <Text className="mt-0.5 font-body text-caption text-text-mid">{subtitle}</Text> : null}
        </View>
        {selected ? <Ionicons name="checkmark" color="#0B4F6C" size={20} /> : null}
      </View>
    </Pressable>
  );
}

export function BookServiceStep1Screen({ onBack }: BookServiceStep1ScreenProps) {
  const [serviceId, setServiceId] = useState(SERVICE_OPTIONS[0].id);
  const [assignmentMethod, setAssignmentMethod] = useState<'auto' | 'manual'>('auto');
  const [sessionType, setSessionType] = useState<'inPerson' | 'remote'>('inPerson');
  const [saved, setSaved] = useState(false);

  const selectedService = useMemo(
    () => SERVICE_OPTIONS.find((service) => service.id === serviceId) ?? SERVICE_OPTIONS[0],
    [serviceId]
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 132 }}>
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
            <Text className="font-heading text-h1 text-text-dark">Book a Service</Text>
          </View>

          <StepIndicator />

          <Card className="mt-5 bg-white">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-dark">
                <Text className="font-heading text-h3 text-white">MR</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-heading text-h3 text-text-dark">Maria Rodriguez</Text>
                <Text className="mt-1 font-body text-caption text-text-mid">Occupational Therapist · $95/hr</Text>
              </View>
            </View>
          </Card>

          <View className="mt-5 gap-2">
            <Text className="font-caption text-label uppercase text-text-light">Select Service Type</Text>
            {SERVICE_OPTIONS.map((service) => (
              <SelectCard
                key={service.id}
                title={service.title}
                subtitle={`${service.category} · ${service.rate}`}
                icon={service.icon}
                selected={service.id === serviceId}
                onPress={() => {
                  setServiceId(service.id);
                  setSaved(false);
                }}
              />
            ))}
          </View>

          <View className="mt-5 gap-2">
            <Text className="font-caption text-label uppercase text-text-light">Assignment Method</Text>
            {ASSIGNMENT_OPTIONS.map((option) => (
              <SelectCard
                key={option.id}
                title={option.title}
                subtitle={option.detail}
                icon={option.icon}
                selected={option.id === assignmentMethod}
                onPress={() => {
                  setAssignmentMethod(option.id);
                  setSaved(false);
                }}
              />
            ))}
          </View>

          <View className="mt-5 gap-2">
            <Text className="font-caption text-label uppercase text-text-light">Session Type</Text>
            <View className="flex-row gap-3">
              {SESSION_OPTIONS.map((option) => {
                const selected = option.id === sessionType;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setSessionType(option.id);
                      setSaved(false);
                    }}
                    className={`h-14 flex-1 flex-row items-center justify-center gap-2 rounded-md border ${
                      selected ? 'border-2 border-teal-dark bg-teal-light' : 'border-border bg-white'
                    }`}
                  >
                    <Ionicons name={option.icon} color={selected ? '#0B4F6C' : '#4A5568'} size={18} />
                    <Text className={`font-heading text-h3 ${selected ? 'text-teal-dark' : 'text-text-mid'}`}>{option.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-5 gap-3">
            <Button label="Speak your request instead" variant="secondary" />
            <Button
              label={saved ? 'Service preferences saved' : 'Next: Choose Date & Time'}
              onPress={() => setSaved(true)}
            />
          </View>

          {saved ? (
            <Card variant="highlight" className="mt-4">
              <Text className="font-caption text-label uppercase text-teal-dark">Ready for schedule</Text>
              <Text className="mt-1 font-body text-body text-text-mid">
                {selectedService.title} · {assignmentMethod === 'auto' ? 'Auto match' : 'Manual choice'} ·{' '}
                {sessionType === 'inPerson' ? 'In-Person' : 'Remote'}
              </Text>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
