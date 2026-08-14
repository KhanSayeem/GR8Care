import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminUser, getAdminUsers } from '../../api/admin';
import { Badge, Card } from '../../components';

interface UserManagementScreenProps {
  onBack?: () => void;
}

type FilterTab = 'all' | 'participants' | 'providers' | 'suspended';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'participants', label: 'Participants' },
  { key: 'providers', label: 'Providers' },
  { key: 'suspended', label: 'Suspended' },
];

const ROLE_LABELS: Record<string, string> = {
  participant: 'Participant',
  caregiver: 'Caregiver',
  supportWorker: 'Support Worker',
  provider: 'Provider',
  admin: 'Admin',
};

function tabToFilters(tab: FilterTab, search: string) {
  const filters: { role?: string; status?: 'active' | 'suspended'; search?: string } = {};
  if (tab === 'participants') filters.role = 'participant';
  if (tab === 'providers') filters.role = 'provider';
  if (tab === 'suspended') filters.status = 'suspended';
  if (search.trim()) filters.search = search.trim();
  return filters;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserManagementScreen({ onBack }: UserManagementScreenProps) {
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers(tabToFilters(tab, search));
      setUsers(res.users);
      setTotal(res.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Users could not be loaded.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const timeout = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [load, search]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      <ScrollView className="flex-1 bg-cream" contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>
        <View className="w-full self-center" style={{ maxWidth: 390 }}>
          <View className="flex-row items-center gap-3">
            {onBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to admin dashboard"
                onPress={onBack}
                className="h-10 w-10 items-center justify-center rounded-md border border-border bg-white"
              >
                <Ionicons name="arrow-back" color="#1A1A2E" size={20} />
              </Pressable>
            ) : null}
            <Text className="font-heading text-h1 text-text-dark">User Management</Text>
          </View>

          <View className="flex-row items-center rounded-md border border-border bg-white" style={{ marginTop: 20, height: 48, paddingHorizontal: 14 }}>
            <Ionicons name="search" color="#A0AEC0" size={18} />
            <TextInput
              accessibilityLabel="Search users"
              onChangeText={setSearch}
              placeholder="Search by name or email"
              placeholderTextColor="#A0AEC0"
              value={search}
              className="flex-1 font-body text-body text-text-dark"
              style={{ marginLeft: 10 }}
            />
          </View>

          <View className="flex-row rounded-md border border-border bg-white" style={{ marginTop: 16, padding: 4 }}>
            {TABS.map((t) => {
              const selected = tab === t.key;
              return (
                <Pressable
                  key={t.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTab(t.key)}
                  className={`flex-1 items-center justify-center rounded-sm ${selected ? 'bg-teal-dark' : 'bg-transparent'}`}
                  style={{ height: 38 }}
                >
                  <Text className={`font-body-bold text-caption ${selected ? 'text-cream' : 'text-text-mid'}`}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {!loading && !error ? (
            <Text className="font-body text-caption text-text-mid" style={{ marginTop: 12 }}>
              {total} {total === 1 ? 'account' : 'accounts'}
            </Text>
          ) : null}

          <View style={{ marginTop: 8, gap: 10 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ paddingVertical: 32, gap: 8 }}>
                <ActivityIndicator color="#0B4F6C" />
                <Text className="font-body text-caption text-text-mid">Loading accounts...</Text>
              </View>
            ) : error ? (
              <Card>
                <Text className="font-body-medium text-caption text-text-dark text-center">{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={load}
                  className="items-center justify-center rounded-md bg-teal-dark"
                  style={{ marginTop: 12, height: 40 }}
                >
                  <Text className="font-body-bold text-caption text-cream">Retry</Text>
                </Pressable>
              </Card>
            ) : users.length === 0 ? (
              <Card>
                <Text className="font-body text-caption text-text-mid text-center">No accounts match this filter.</Text>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user._id} className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-teal-dark">
                    <Text className="font-heading text-h3 text-white">{initials(user.fullName)}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-body-bold text-body text-text-dark" numberOfLines={1}>
                      {user.fullName}
                    </Text>
                    <Text className="font-body text-caption text-text-mid" style={{ marginTop: 2 }} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                  <View className="items-end" style={{ gap: 6 }}>
                    <Badge label={ROLE_LABELS[user.role] ?? user.role} tone="info" />
                    <Badge label={user.isActive ? 'Active' : 'Suspended'} tone={user.isActive ? 'success' : 'error'} />
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
