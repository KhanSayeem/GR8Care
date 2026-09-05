const ConsentRecord = require('../models/ConsentRecord');
const { CONSENT_PURPOSES } = require('../models/ConsentRecord');

const CONSENT_BOUNDARY =
  'Consent records show what a participant agreed to share, with whom, and when. They are an app-level record only and are not an NDIS legal instrument, a service agreement, or proof of provider acceptance.';

function badRequest(message, details) {
  const error = new Error(message);
  error.status = 400;
  error.details = details;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function serializeConsent(record) {
  const obj = record.toObject({ virtuals: true });
  obj.id = obj._id.toString();
  obj.participant = obj.participant?.toString();
  obj.decidedBy = obj.decidedBy?.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function recordConsent(user, payload = {}) {
  const purpose = String(payload.purpose || '').trim();
  if (!CONSENT_PURPOSES.includes(purpose)) {
    throw badRequest('purpose must be one of: ' + CONSENT_PURPOSES.join(', '));
  }

  const scope = normalizeList(payload.scope);
  if (scope.length === 0) {
    throw badRequest('scope is required: record what information the consent covers');
  }

  const recipients = normalizeList(payload.recipients);
  if (recipients.length === 0) {
    throw badRequest('recipients is required: record who receives the information');
  }

  const record = await ConsentRecord.create({
    participant: user._id,
    decidedBy: user._id,
    purpose,
    decision: 'granted',
    scope,
    recipients,
    reason: String(payload.reason || '').trim(),
    decidedAt: new Date(),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  });

  return {
    mode: 'consentRecorded',
    boundary: CONSENT_BOUNDARY,
    consent: serializeConsent(record),
  };
}

async function listConsents(user, { purpose } = {}) {
  const query = { participant: user._id };
  if (purpose) {
    if (!CONSENT_PURPOSES.includes(purpose)) {
      throw badRequest('Unsupported consent purpose');
    }
    query.purpose = purpose;
  }

  const records = await ConsentRecord.find(query).sort({ decidedAt: -1, _id: -1 });

  return {
    mode: 'consentHistory',
    boundary: CONSENT_BOUNDARY,
    purposes: CONSENT_PURPOSES,
    consents: records.map(serializeConsent),
  };
}

// Revoking writes a new state onto the original decision rather than deleting
// it: the fact that consent was once given is itself part of the record.
async function revokeConsent(user, consentId) {
  const record = await ConsentRecord.findOne({ _id: consentId, participant: user._id });
  if (!record) {
    throw notFound('Consent record not found');
  }

  if (record.decision === 'revoked') {
    return {
      mode: 'consentRevoked',
      boundary: CONSENT_BOUNDARY,
      consent: serializeConsent(record),
    };
  }

  record.decision = 'revoked';
  record.revokedAt = new Date();
  await record.save();

  return {
    mode: 'consentRevoked',
    boundary: CONSENT_BOUNDARY,
    consent: serializeConsent(record),
  };
}

// True only while a granted decision stands unrevoked.
async function hasActiveConsent(participantId, purpose) {
  const latest = await ConsentRecord.findOne({ participant: participantId, purpose }).sort({ decidedAt: -1, _id: -1 });
  return Boolean(latest && latest.decision === 'granted');
}

module.exports = {
  CONSENT_BOUNDARY,
  hasActiveConsent,
  listConsents,
  recordConsent,
  revokeConsent,
  serializeConsent,
};
