const mongoose = require('mongoose');
const {
  listNotificationsForUser,
  markNotificationsReadForUser,
  normalizeNotificationIds,
} = require('../services/notifications');

async function getMyNotifications(req, res) {
  const unreadOnly = req.query.unread === 'true';
  const result = await listNotificationsForUser(req.user._id, { unreadOnly });
  res.json(result);
}

async function markMyNotificationsRead(req, res) {
  const ids = normalizeNotificationIds(req.body?.ids);
  const invalidIds = ids.filter((id) => !mongoose.isValidObjectId(id));
  if (invalidIds.length > 0) {
    return res.status(400).json({
      error: 'Invalid notification ids',
      details: invalidIds,
    });
  }

  const result = await markNotificationsReadForUser(req.user._id, ids);
  res.json(result);
}

module.exports = {
  getMyNotifications,
  markMyNotificationsRead,
};
