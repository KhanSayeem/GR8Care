const mongoose = require('mongoose');

const BOOKING_STATUSES = ['pending', 'confirmed', 'inProgress', 'completed', 'cancelled', 'declined'];
const BOOKING_CONFLICT_STATUSES = ['pending', 'confirmed', 'inProgress'];

const bookingSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    supportWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    serviceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      default: null,
      index: true,
    },
    availabilityBlockId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    service: { type: String, required: true, trim: true },
    supportCategory: { type: String, trim: true, default: 'core' },
    scheduledStart: { type: Date, required: true, index: true },
    scheduledEnd: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending',
      index: true,
    },
    location: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    cancellationReason: { type: String, trim: true, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

bookingSchema.index({ provider: 1, status: 1, scheduledStart: 1, scheduledEnd: 1 });
bookingSchema.index({ supportWorker: 1, status: 1, scheduledStart: 1, scheduledEnd: 1 });
bookingSchema.index({ participant: 1, scheduledStart: -1 });

bookingSchema.pre('validate', function validateScheduledWindow(next) {
  if (this.scheduledStart && this.scheduledEnd && this.scheduledStart >= this.scheduledEnd) {
    this.invalidate('scheduledEnd', 'scheduledEnd must be after scheduledStart');
  }
  next();
});

bookingSchema.statics.findProviderConflicts = function findProviderConflicts(providerId, scheduledStart, scheduledEnd, options = {}) {
  const query = {
    provider: providerId,
    status: { $in: options.statuses || BOOKING_CONFLICT_STATUSES },
    scheduledStart: { $lt: scheduledEnd },
    scheduledEnd: { $gt: scheduledStart },
  };

  if (options.excludeBookingId) {
    query._id = { $ne: options.excludeBookingId };
  }

  return this.find(query).sort({ scheduledStart: 1 });
};

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_CONFLICT_STATUSES = BOOKING_CONFLICT_STATUSES;
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
