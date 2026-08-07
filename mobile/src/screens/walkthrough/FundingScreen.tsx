import React from 'react';
import { Text, View } from 'react-native';
import { Badge, Card, ProgressBar } from '../../components';
import { fundingTransactions } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

export function FundingScreen() {
  return (
    <ScreenShell
      eyebrow="Funding"
      title="Plan budget tracker"
      subtitle="A simple view of plan usage, recent transactions, and threshold alerts."
    >
      <Card variant="highlight">
        <Text className="font-caption text-label uppercase text-teal-dark">Core supports</Text>
        <Text className="mt-2 font-heading text-display-sm text-text-dark">$8,420 remaining</Text>
        <Text className="mt-1 font-body text-body text-text-mid">$11,580 used from a $20,000 allocation.</Text>
        <View className="mt-5">
          <ProgressBar progress={0.58} />
        </View>
      </Card>

      <View className="gap-3">
        {fundingTransactions.map((item) => (
          <Card key={item.label}>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-body-medium text-body text-text-dark">{item.label}</Text>
                <Text className="mt-1 font-body text-caption text-text-mid">{item.date}</Text>
              </View>
              <Badge label={item.amount} tone={item.tone} />
            </View>
          </Card>
        ))}
      </View>
    </ScreenShell>
  );
}
