const User = require('../models/User');

const CONSENT_FIELDS = [
  'dataCollection',
  'telehealthPrivacy',
  'aiTranslation',
  'providerDataSharing',
  'voiceInputProcessing',
  'readAloud',
];

function badRequest(message, details) {
  const error = new Error(message);
  error.status = 400;
  if (details) error.details = details;
  return error;
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function buildProfileUpdate(payload = {}) {
  const updates = {};
  const errors = [];

  if (payload.fullName !== undefined) {
    const fullName = normalizeText(payload.fullName);
    if (!fullName) errors.push('fullName cannot be empty');
    else updates.fullName = fullName;
  }

  if (payload.language !== undefined) {
    updates.language = normalizeText(payload.language) || 'en';
  }

  if (payload.ndisNumber !== undefined) {
    updates.ndisNumber = normalizeText(payload.ndisNumber);
  }

  if (payload.location !== undefined) {
    updates.location = normalizeText(payload.location);
  }

  if (payload.goals !== undefined) {
    if (!Array.isArray(payload.goals)) {
      errors.push('goals must be an array of strings');
    } else {
      updates.goals = payload.goals.map(normalizeText).filter(Boolean);
    }
  }

  if (payload.notificationsEnabled !== undefined) {
    if (typeof payload.notificationsEnabled !== 'boolean') {
      errors.push('notificationsEnabled must be a boolean');
    } else {
      updates.notificationsEnabled = payload.notificationsEnabled;
    }
  }

  if (payload.budgetAlertsEnabled !== undefined) {
    if (typeof payload.budgetAlertsEnabled !== 'boolean') {
      errors.push('budgetAlertsEnabled must be a boolean');
    } else {
      updates.budgetAlertsEnabled = payload.budgetAlertsEnabled;
    }
  }

  if (payload.consent !== undefined) {
    if (typeof payload.consent !== 'object' || payload.consent === null || Array.isArray(payload.consent)) {
      errors.push('consent must be an object');
    } else {
      for (const key of Object.keys(payload.consent)) {
        if (!CONSENT_FIELDS.includes(key)) {
          errors.push(`consent.${key} is not a recognized field`);
        } else if (typeof payload.consent[key] !== 'boolean') {
          errors.push(`consent.${key} must be a boolean`);
        } else {
          updates[`consent.${key}`] = payload.consent[key];
        }
      }
    }
  }

  if (Object.keys(updates).length === 0 && errors.length === 0) {
    errors.push('no recognized fields to update');
  }

  return { updates, errors };
}

async function updateMyProfile(userId, payload = {}) {
  const { updates, errors } = buildProfileUpdate(payload);

  if (errors.length > 0) {
    throw badRequest('Invalid profile update', errors);
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true });

  return { user: user.toSafeJSON() };
}

module.exports = {
  CONSENT_FIELDS,
  updateMyProfile,
};
