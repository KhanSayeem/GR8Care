import React, { useMemo, useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card } from '../../components';
import type { NotificationTone } from '../../data/walkthroughData';
import { notificationGroups } from '../../data/walkthroughData';
import { ScreenShell } from './ScreenShell';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TONE_STYLES: Record<NotificationTone, { iconColor: string; iconBg: string; border: string; badge: 'info' | 'success' | 'warning' | 'neutral' }> = {
  teal: { iconColor: '#0B4F6C', iconBg: '#D0EAF2', border: '#1A7A9A', badge: 'info' },
  warning: { iconColor: '#E53E3E', iconBg: '#FED7D7', border: '#E53E3E', badge: 'warning' },
  success: { iconColor: '#2D9E6B', iconBg: '#D4F0E4', border: '#2D9E6B', badge: 'success' },
  purple: { iconColor: '#2D1B69', iconBg: '#EDE9FF', border: '#2D1B69', badge: 'neutral' },
};

export function NotificationsScreen() {
  const initiallyReadIds = useMemo(
    () => notificationGroups.flatMap((group) => group.items.filter((item) => !item.unread).map((item) => item.id)),
    [],
  );
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(initiallyReadIds));

  const notifications = notificationGroups.flatMap((group) => group.items);
  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((item) => item.id)));
  };

  const toggleRead = (id: string) => {
    setReadIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <ScreenShell
      eyebrow="Notifications"
      title="Updates that affect today's supports"
      subtitle="Booking movement, funding alerts, confirmations, and education suggestions for Amina's plan."
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F7F3EE" />

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
              Funding-related alerts stay visible beside booking updates so the next decision has context.
            </Text>
          </View>
        </View>
        <View className="mt-4">
          <Button label="Mark all read" variant={unreadCount === 0 ? 'outline' : 'secondary'} disabled={unreadCount === 0} onPress={markAllRead} />
        </View>
      </Card>

      {notificationGroups.map((group) => (
        <View key={group.label} className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-body-medium text-caption text-text-dark">{group.label}</Text>
            <Text className="font-caption text-label uppercase text-text-light">
              {group.items.filter((item) => !readIds.has(item.id)).length} unread
            </Text>
          </View>

          <View className="gap-3">
            {group.items.map((item) => {
              const isRead = readIds.has(item.id);
              const tone = TONE_STYLES[item.tone];

              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${isRead ? 'Read' : 'Unread'}. Toggle read state.`}
                  accessibilityState={{ selected: !isRead }}
                  onPress={() => toggleRead(item.id)}
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
                        <Ionicons name={item.icon as IoniconName} color={tone.iconColor} size={23} />
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
                          <Text className="font-body text-label text-text-light">{item.time}</Text>
                        </View>

                        <View className="mt-3 flex-row flex-wrap items-center justify-between gap-2">
                          <View className="flex-row flex-wrap items-center gap-2">
                            <Badge label={item.category} tone={tone.badge} />
                            <Text className="font-body-medium text-label text-text-mid">{item.meta}</Text>
                          </View>
                          <Text className="font-caption text-label uppercase text-teal-dark">
                            {isRead ? 'Mark unread' : 'Mark read'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScreenShell>
  );
}
