const mongoose = require('mongoose');

const providerProfileSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    location: { type: String, required: true, trim: true },
    languages: { type: [String], default: [] },
    services: { type: [String], default: [] },
    hourlyRate: { type: Number, min: 0 },
    bio: { type: String, default: '', trim: true },
    acceptingNewParticipants: { type: Boolean, default: true },
    abn: { type: String, trim: true, default: '' },
    abnVerificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
    rating: { type: Number, min: 0, max: 5, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
