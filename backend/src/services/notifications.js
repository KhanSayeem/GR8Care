const Notification = require('../models/Notification');

const NOTIFICATION_BOUNDARY =
  'Notifications are user-scoped app updates only. Funding and booking alerts provide context, not NDIS approval or emergency advice.';

function serializeNotification(notification) {
  const obj = notification.toObject({ virtuals: true });
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

function normalizeNotificationIds(ids = []) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids.filter((id) => id !== null && id !== undefined).map((id) => String(id).trim()).filter(Boolean);
}

async function listNotificationsForUser(userId, { unreadOnly = false } = {}) {
  const query = { recipient: userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  const notifications = await Notification.find(query).sort({ createdAt: -1, _id: -1 });
  const unreadCount = await Notification.countDocuments({ recipient: userId, readAt: null });

  return {
    mode: 'notifications',
    boundary: NOTIFICATION_BOUNDARY,
    unreadCount,
    notifications: notifications.map(serializeNotification),
  };
}

async function markNotificationsReadForUser(userId, ids = []) {
  const notificationIds = normalizeNotificationIds(ids);
  const filter = { recipient: userId, readAt: null };
  if (notificationIds.length > 0) {
    filter._id = { $in: notificationIds };
  }

  const readAt = new Date();
  const result = await Notification.updateMany(filter, { $set: { readAt } });

  return {
    mode: 'notifications',
    boundary: NOTIFICATION_BOUNDARY,
    readAt,
    updatedCount: result.modifiedCount,
  };
}

// Notifications had read and mark-read paths but nothing ever wrote one, so the
// screen was permanently empty. Booking events call this.
async function createNotification({
  recipient,
  type,
  priority = 'info',
  title,
  body,
  category,
  contextLabel,
  contextValue,
  actionLabel,
  metadata = {},
}) {
  if (!recipient || !type || !title || !body) {
    return null;
  }

  return Notification.create({
    recipient,
    type,
    priority,
    title,
    body,
    category,
    contextLabel,
    contextValue,
    actionLabel,
    metadata,
  });
}

// A notification is a side effect: never let one failing take down the booking
// action that triggered it.
async function safeCreateNotification(input) {
  try {
    return await createNotification(input);
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

module.exports = {
  NOTIFICATION_BOUNDARY,
  createNotification,
  safeCreateNotification,
  listNotificationsForUser,
  markNotificationsReadForUser,
  normalizeNotificationIds,
  serializeNotification,
};
