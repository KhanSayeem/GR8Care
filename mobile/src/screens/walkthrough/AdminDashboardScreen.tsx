import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminStats, getAdminStats } from '../../api/admin';
import { API_BASE_URL } from '../../api/client';
import { Badge, Card } from '../../components';

interface AdminDashboardScreenProps {
  onOpenUsers?: () => void;
  onOpenVerification?: () => void;
  onOpenReports?: () => void;
}

type HealthState = 'checking' | 'healthy' | 'unreachable';

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <Card style={{ width: '48%', marginTop: 12 }}>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-teal-light">
        <Ionicons name={icon} color="#0B4F6C" size={18} />
      </View>
      <Text className="font-heading text-h1 text-text-dark" style={{ marginTop: 10 }}>
        {value}
      </Text>
      <Text className="font-body text-caption text-text-mid" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </Card>
  );
}

function QuickActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={{ marginTop: 12 }}>
      <Card className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-teal-light">
          <Ionicons name={icon} color="#0B4F6C" size={18} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-body-bold text-body text-text-dark">{title}</Text>
          <Text className="font-body text-caption text-text-mid" style={{ marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Ionicons name="chevron-forward" color="#A0AEC0" size={18} />
      </Card>
    </Pressable>
  );
}

export function AdminDashboardScreen({ onOpenUsers, onOpenVerification, onOpenReports }: AdminDashboardScreenProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>('checking');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminStats();
      setStats(res.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin stats could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/health`)
      .then((res) => {
        if (!cancelled) setHealth(res.ok ? 'healthy' : 'unreachable');
      })
      .catch(() => {
        if (!cancelled) setHealth('unreachable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <Text className="font-caption text-label uppercase text-coral">Admin</Text>
          <Text className="font-heading text-display-sm text-text-dark" style={{ marginTop: 8 }}>
            Admin Dashboard
          </Text>
          <Text className="font-body text-body text-text-mid" style={{ marginTop: 8 }}>
            Platform overview and quick actions.
          </Text>

          {loading ? (
            <View className="items-center justify-center" style={{ marginTop: 32, gap: 8, paddingVertical: 24 }}>
              <ActivityIndicator color="#0B4F6C" />
              <Text className="font-body text-caption text-text-mid">Loading platform stats...</Text>
            </View>
          ) : error ? (
            <Card style={{ marginTop: 20 }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle" color="#E53E3E" size={20} />
                <Text className="flex-1 font-body-medium text-caption text-text-dark">{error}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={load}
                className="items-center justify-center rounded-md bg-teal-dark"
                style={{ marginTop: 12, height: 40 }}
              >
                <Text className="font-body-bold text-caption text-cream">Retry</Text>
              </Pressable>
            </Card>
          ) : stats ? (
            <View className="flex-row flex-wrap justify-between">
              <StatCard label="Total users" value={String(stats.totalUsers)} icon="people" />
              <StatCard label="Providers" value={String(stats.totalProviders)} icon="briefcase" />
              <StatCard label="Bookings today" value={String(stats.bookingsToday)} icon="calendar" />
              <StatCard label="Pending verifications" value={String(stats.pendingVerifications)} icon="shield-checkmark" />
            </View>
          ) : null}

          <Text className="font-caption text-label uppercase text-text-mid" style={{ marginTop: 24 }}>
            Quick actions
          </Text>
          <QuickActionRow icon="people" title="User Management" subtitle="Search and manage participant and provider accounts" onPress={onOpenUsers} />
          <QuickActionRow
            icon="shield-checkmark"
            title="Provider Verification"
            subtitle={stats ? `${stats.pendingVerifications} pending review` : 'Review pending provider applications'}
            onPress={onOpenVerification}
          />
          <QuickActionRow icon="bar-chart" title="Reports and Analytics" subtitle="Coming soon" onPress={onOpenReports} />

          <Card variant="highlight" style={{ marginTop: 24 }}>
            <View className="flex-row items-center justify-between">
              <Text className="font-caption text-label uppercase text-teal-dark">System health</Text>
              <Badge
                label={health === 'checking' ? 'Checking' : health === 'healthy' ? 'API healthy' : 'API unreachable'}
                tone={health === 'checking' ? 'neutral' : health === 'healthy' ? 'success' : 'error'}
              />
            </View>
            <Text className="font-body text-body text-text-mid" style={{ marginTop: 8 }}>
              Reflects whether the backend API is currently reachable. It is not a full infrastructure or compliance monitoring
              system.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
