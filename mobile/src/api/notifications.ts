import { apiFetch } from './client';

export type NotificationType = 'booking' | 'funding' | 'education' | 'system';
export type NotificationPriority = 'info' | 'success' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  category?: string;
  contextLabel?: string;
  contextValue?: string;
  actionLabel?: string;
  actionUrl?: string;
  readAt: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  mode: 'notifications';
  boundary: string;
  unreadCount: number;
  notifications: AppNotification[];
}

export interface MarkReadResponse {
  mode: 'notifications';
  boundary: string;
  readAt: string;
  updatedCount: number;
}

export async function getNotifications({ unreadOnly = false }: { unreadOnly?: boolean } = {}) {
  const query = unreadOnly ? '?unread=true' : '';
  return apiFetch(`/notifications${query}`) as Promise<NotificationsResponse>;
}

export async function markNotificationsRead(ids?: string[]) {
  return apiFetch('/notifications/mark-read', {
    method: 'PATCH',
    body: JSON.stringify(ids && ids.length > 0 ? { ids } : {}),
  }) as Promise<MarkReadResponse>;
}
