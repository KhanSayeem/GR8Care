const mongoose = require('mongoose');

// A consent decision is an event, not a setting. The boolean flags on User say
// what a participant currently allows; this records each individual decision so
// there is an auditable answer to who consented, to what, why, who receives it,
// and when.
const CONSENT_PURPOSES = [
  'providerDiscovery',
  'providerContact',
  'dataSharing',
  'aiTranslation',
  'voiceInputProcessing',
  'documentation',
];

const CONSENT_DECISIONS = ['granted', 'revoked'];

const consentRecordSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Who actually pressed the button. Usually the participant, but a caregiver
    // may act on their behalf, and that distinction matters for an audit trail.
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    purpose: { type: String, enum: CONSENT_PURPOSES, required: true, index: true },
    decision: { type: String, enum: CONSENT_DECISIONS, default: 'granted', index: true },
    // WHAT information the decision covers.
    scope: { type: [String], default: [] },
    // WHY it is being shared, in the participant's own terms.
    reason: { type: String, trim: true, default: '' },
    // WHO receives it.
    recipients: { type: [String], default: [] },
    decidedAt: { type: Date, default: Date.now, index: true },
    revokedAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

consentRecordSchema.index({ participant: 1, purpose: 1, decidedAt: -1 });

module.exports = mongoose.model('ConsentRecord', consentRecordSchema);
module.exports.CONSENT_PURPOSES = CONSENT_PURPOSES;
module.exports.CONSENT_DECISIONS = CONSENT_DECISIONS;
