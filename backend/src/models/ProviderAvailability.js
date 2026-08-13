const mongoose = require('mongoose');

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const availabilityBlockSchema = new mongoose.Schema(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true },
    service: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
  },
  { _id: true }
);

const providerAvailabilitySchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    blocks: { type: [availabilityBlockSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProviderAvailability', providerAvailabilitySchema);
module.exports.WEEKDAYS = WEEKDAYS;
