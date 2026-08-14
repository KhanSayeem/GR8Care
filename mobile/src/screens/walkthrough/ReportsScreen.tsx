import React from 'react';
import { Text } from 'react-native';
import { Badge, Card } from '../../components';
import { ScreenShell } from './ScreenShell';

export function ReportsScreen() {
  return (
    <ScreenShell eyebrow="Admin" title="Reports and Analytics" subtitle="Platform usage, funding, and provider performance reports.">
      <Card variant="highlight">
        <Badge label="Pending" tone="warning" />
        <Text className="mt-3 font-heading text-h2 text-text-dark">Coming soon</Text>
        <Text className="mt-2 font-body text-body text-text-mid">
          Report generation and system health indicators are planned for a future update, once report content and scope (FR-15)
          are confirmed with the client.
        </Text>
      </Card>
    </ScreenShell>
  );
}
