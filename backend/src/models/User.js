const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { SUBSCRIPTION_TIERS, getTierAccess } = require('../services/subscriptionAccess');

const ROLES = ['participant', 'caregiver', 'supportWorker', 'provider', 'admin'];

const consentSchema = new mongoose.Schema(
  {
    dataCollection: { type: Boolean, default: false },
    telehealthPrivacy: { type: Boolean, default: false },
    aiTranslation: { type: Boolean, default: false },
    providerDataSharing: { type: Boolean, default: false },
    voiceInputProcessing: { type: Boolean, default: false },
    readAloud: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'participant' },

    // Participant / caregiver fields
    ndisNumber: { type: String, trim: true },
    goals: [{ type: String }],
    whodasScore: { type: mongoose.Schema.Types.Mixed, default: null },
    location: { type: String, trim: true, default: '' },

    // Provider fields (denormalized pointer; full detail lives in ProviderProfile)
    providerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile' },
    subscriptionTier: { type: String, enum: SUBSCRIPTION_TIERS, default: 'starter' },

    // Shared preferences
    language: { type: String, default: 'en' },
    notificationsEnabled: { type: Boolean, default: true },
    budgetAlertsEnabled: { type: Boolean, default: true },
    consent: { type: consentSchema, default: () => ({}) },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.password;
  obj.subscriptionAccess = getTierAccess(obj.subscriptionTier);
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
