const mongoose = require('mongoose');

const SERVICE_REQUEST_STATUSES = ['draft', 'submitted', 'matched', 'booked', 'cancelled'];
const SERVICE_REQUEST_SOURCES = ['participant', 'caregiver', 'provider', 'admin'];

const serviceRequestSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    preferredProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    service: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    supportCategory: { type: String, trim: true, default: 'core' },
    preferredStartDate: { type: Date, required: true },
    preferredEndDate: { type: Date, required: true },
    status: {
      type: String,
      enum: SERVICE_REQUEST_STATUSES,
      default: 'submitted',
      index: true,
    },
    source: {
      type: String,
      enum: SERVICE_REQUEST_SOURCES,
      default: 'participant',
    },
    notes: { type: String, trim: true, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ participant: 1, status: 1, preferredStartDate: 1 });
serviceRequestSchema.index({ preferredProvider: 1, status: 1, preferredStartDate: 1 });

serviceRequestSchema.pre('validate', function validatePreferredWindow(next) {
  if (this.preferredStartDate && this.preferredEndDate && this.preferredStartDate >= this.preferredEndDate) {
    this.invalidate('preferredEndDate', 'preferredEndDate must be after preferredStartDate');
  }
  next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports.SERVICE_REQUEST_STATUSES = SERVICE_REQUEST_STATUSES;
module.exports.SERVICE_REQUEST_SOURCES = SERVICE_REQUEST_SOURCES;
