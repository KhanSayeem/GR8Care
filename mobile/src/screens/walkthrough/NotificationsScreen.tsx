import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification, getNotifications, markNotificationsRead } from '../../api/notifications';
import { Badge, Button, Card } from '../../components';
import { ScreenShell } from './ScreenShell';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type NotificationTone = 'teal' | 'warning' | 'success' | 'purple';

const TONE_STYLES: Record<
  NotificationTone,
  { iconColor: string; iconBg: string; border: string; badge: 'info' | 'success' | 'warning' | 'neutral' }
> = {
  teal: { iconColor: '#0B4F6C', iconBg: '#D0EAF2', border: '#1A7A9A', badge: 'info' },
  warning: { iconColor: '#E53E3E', iconBg: '#FED7D7', border: '#E53E3E', badge: 'warning' },
  success: { iconColor: '#2D9E6B', iconBg: '#D4F0E4', border: '#2D9E6B', badge: 'success' },
  purple: { iconColor: '#2D1B69', iconBg: '#EDE9FF', border: '#2D1B69', badge: 'neutral' },
};

const TYPE_ICON: Record<AppNotification['type'], IoniconName> = {
  booking: 'navigate-circle',
  funding: 'alert-circle',
  education: 'school',
  system: 'notifications',
};

function getNotificationTone(notification: AppNotification): NotificationTone {
  if (notification.priority === 'critical' || notification.priority === 'warning') return 'warning';
  if (notification.priority === 'success') return 'success';
  if (notification.type === 'education') return 'purple';
  return 'teal';
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getGroupLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Earlier';

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfNotificationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDelta = Math.round((startOfToday - startOfNotificationDay) / 86400000);

  if (dayDelta === 0) return 'Today';
  if (dayDelta === 1) return 'Yesterday';
  return 'Earlier';
}

function groupNotifications(notifications: AppNotification[]) {
  const grouped = notifications.reduce<Record<string, AppNotification[]>>((acc, notification) => {
    const label = getGroupLabel(notification.createdAt);
    acc[label] = [...(acc[label] ?? []), notification];
    return acc;
  }, {});

  return ['Today', 'Yesterday', 'Earlier']
    .filter((label) => grouped[label]?.length)
    .map((label) => ({ label, items: grouped[label] }));
}

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [boundary, setBoundary] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingIds, setMarkingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const notificationGroups = useMemo(() => groupNotifications(notifications), [notifications]);

  const loadNotifications = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setBoundary(result.boundary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notifications could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = async () => {
    setMarkingIds(new Set(notifications.filter((notification) => !notification.isRead).map((notification) => notification.id)));
    setError(null);

    try {
      const result = await markNotificationsRead();
      const readAt = result.readAt;
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? readAt,
          isRead: true,
        })),
      );
      setUnreadCount(0);
      setBoundary(result.boundary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notifications could not be marked read.');
    } finally {
      setMarkingIds(new Set());
    }
  };

  const markOneRead = async (id: string) => {
    setMarkingIds((current) => new Set(current).add(id));
    setError(null);

    try {
      const result = await markNotificationsRead([id]);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                readAt: result.readAt,
                isRead: true,
              }
            : notification,
        ),
      );
      setUnreadCount((current) => Math.max(current - result.updatedCount, 0));
      setBoundary(result.boundary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Notification could not be marked read.');
    } finally {
      setMarkingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const renderStatusCard = () => {
    if (loading) {
      return (
        <Card variant="highlight">
          <View className="items-center justify-center gap-3" style={{ minHeight: 112 }}>
            <ActivityIndicator color="#0B4F6C" />
            <Text className="font-body-medium text-body text-text-mid">Loading notifications</Text>
          </View>
        </Card>
      );
    }

    if (error) {
      return (
        <Card variant="warning">
          <View className="gap-3">
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: '#FED7D7' }}>
                <Ionicons name="alert-circle" color="#E53E3E" size={22} />
              </View>
              <View className="flex-1">
                <Text className="font-caption text-label uppercase text-warning">Notifications unavailable</Text>
                <Text className="mt-1 font-body text-body text-text-mid">{error}</Text>
              </View>
            </View>
            <Button label="Retry" variant="outline" loading={refreshing} onPress={() => loadNotifications({ silent: true })} />
          </View>
        </Card>
      );
    }

    if (notifications.length === 0) {
      return (
        <Card variant="highlight">
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <Ionicons name="notifications" color="#0B4F6C" size={22} />
            </View>
            <View className="flex-1">
              <Text className="font-caption text-label uppercase text-teal-dark">Participant alerts</Text>
              <Text className="mt-1 font-heading text-h2 text-text-dark">No notifications yet</Text>
              <Text className="mt-2 font-body text-body text-text-mid">
                Booking, funding, and education updates will appear here when the API has records for this account.
              </Text>
            </View>
          </View>
        </Card>
      );
    }

    return (
      <Card variant="highlight">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Ionicons name="notifications" color="#0B4F6C" size={22} />
          </View>
          <View className="flex-1">
            <Text className="font-caption text-label uppercase text-teal-dark">Participant alerts</Text>
            <Text className="mt-1 font-heading text-h2 text-text-dark">
              {unreadCount === 0 ? 'All updates have been read' : `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`}
            </Text>
            <Text className="mt-2 font-body text-body text-text-mid">
              {boundary || 'Funding-related alerts stay visible beside booking updates so the next decision has context.'}
            </Text>
          </View>
        </View>
        <View className="mt-4">
          <Button
            label="Mark all read"
            variant={unreadCount === 0 ? 'outline' : 'secondary'}
            disabled={unreadCount === 0}
            loading={markingIds.size > 0 && markingIds.size === unreadCount}
            onPress={markAllRead}
          />
        </View>
      </Card>
    );
  };

  const renderNotificationGroups = () => {
    if (loading || error || notifications.length === 0) return null;

    return notificationGroups.map((group) => (
      <View key={group.label} className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-body-medium text-caption text-text-dark">{group.label}</Text>
          <Text className="font-caption text-label uppercase text-text-light">
            {group.items.filter((item) => !item.isRead).length} unread
          </Text>
        </View>

        <View className="gap-3">
          {group.items.map((item) => {
            const isRead = item.isRead;
            const toneKey = getNotificationTone(item);
            const tone = TONE_STYLES[toneKey];
            const isMarking = markingIds.has(item.id);
            const meta = [item.contextLabel, item.contextValue].filter(Boolean).join('  ');

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${isRead ? 'Read' : 'Unread'}. ${isRead ? 'Already read.' : 'Mark read.'}`}
                accessibilityState={{ selected: !isRead, disabled: isRead || isMarking }}
                disabled={isRead || isMarking}
                onPress={() => markOneRead(item.id)}
              >
                <Card
                  className={isRead ? 'bg-white' : 'bg-teal-light'}
                  style={{
                    borderColor: isRead ? '#E8E0D6' : tone.border,
                    opacity: isRead ? 0.78 : 1,
                  }}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="mt-0.5 h-11 w-11 items-center justify-center rounded-md" style={{ backgroundColor: tone.iconBg }}>
                      <Ionicons name={TYPE_ICON[item.type]} color={tone.iconColor} size={23} />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            {!isRead ? <View className="h-2.5 w-2.5 rounded-full bg-coral" /> : null}
                            <Text className="flex-1 font-heading text-h3 text-text-dark">{item.title}</Text>
                          </View>
                          <Text className="mt-1 font-body text-body text-text-mid">{item.body}</Text>
                        </View>
                        <Text className="font-body text-label text-text-light">{formatNotificationTime(item.createdAt)}</Text>
                      </View>

                      <View className="mt-3 flex-row flex-wrap items-center justify-between gap-2">
                        <View className="flex-row flex-wrap items-center gap-2">
                          {item.category ? <Badge label={item.category} tone={tone.badge} /> : null}
                          {meta ? <Text className="font-body-medium text-label text-text-mid">{meta}</Text> : null}
                        </View>
                        {isMarking ? (
                          <ActivityIndicator color="#0B4F6C" />
                        ) : (
                          <Text className="font-caption text-label uppercase text-teal-dark">
                            {isRead ? 'Read' : item.actionLabel || 'Mark read'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </View>
    ));
  };

  return (
    <ScreenShell
      eyebrow="Notifications"
      title="Updates that affect today's supports"
      subtitle="Booking movement, funding alerts, confirmations, and education suggestions for Amina's plan."
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />
      {renderStatusCard()}
      {renderNotificationGroups()}
    </ScreenShell>
  );
}
