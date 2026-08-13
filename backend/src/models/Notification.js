const mongoose = require('mongoose');

const NOTIFICATION_TYPES = ['booking', 'funding', 'education', 'system'];
const NOTIFICATION_PRIORITIES = ['info', 'success', 'warning', 'critical'];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: 'info',
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    contextLabel: { type: String, trim: true },
    contextValue: { type: String, trim: true },
    actionLabel: { type: String, trim: true },
    actionUrl: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

notificationSchema.virtual('isRead').get(function isRead() {
  return Boolean(this.readAt);
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
module.exports.NOTIFICATION_PRIORITIES = NOTIFICATION_PRIORITIES;
