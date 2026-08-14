const mongoose = require('mongoose');
const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');

const PROVIDER_MATCHING_BOUNDARY =
  'Compatibility scores are a matching guide based on stated location, language, and goal overlap. They do not verify quality of care, ABN status is provider-declared and not independently confirmed by GR8Care, and a high score does not replace your own assessment of fit.';

const PROVIDER_LIST_LIMIT = 100;
const SCORING_REQUESTER_ROLES = ['participant', 'caregiver'];

function badRequest(message, details) {
  const error = new Error(message);
  error.status = 400;
  if (details) error.details = details;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function stringsOverlap(a, b) {
  const x = normalizeText(a).toLowerCase();
  const y = normalizeText(b).toLowerCase();
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x);
}

function computeLocationScore(participant, providerProfile) {
  const participantLocation = normalizeText(participant?.location);
  if (!participantLocation) return 50;
  return stringsOverlap(participantLocation, providerProfile?.location) ? 100 : 0;
}

// participant.language stores an ISO 639-1 code (e.g. "en") while ProviderProfile.languages
// holds freeform names a provider typed in (e.g. "English") - map the codes this app's UI
// actually offers so a code and its name are treated as the same language.
const LANGUAGE_CODE_NAMES = {
  en: 'english',
  vi: 'vietnamese',
  zh: 'mandarin',
  ar: 'arabic',
};

function computeLanguageScore(participant, providerProfile) {
  const participantLanguage = normalizeText(participant?.language);
  if (!participantLanguage) return 50;

  const languages = Array.isArray(providerProfile?.languages) ? providerProfile.languages : [];
  const target = participantLanguage.toLowerCase();
  const targetName = LANGUAGE_CODE_NAMES[target];
  if (languages.some((language) => {
    const value = normalizeText(language).toLowerCase();
    return value === target || (targetName && value === targetName);
  })) {
    return 100;
  }
  if (target === 'en' && languages.length === 0) return 100;
  return 0;
}

function computeGoalsScore(participant, providerProfile) {
  const goals = Array.isArray(participant?.goals) ? participant.goals.filter(Boolean) : [];
  if (goals.length === 0) return 50;

  const services = Array.isArray(providerProfile?.services) ? providerProfile.services.filter(Boolean) : [];
  if (services.length === 0) return 0;

  const matched = goals.filter((goal) => services.some((service) => stringsOverlap(goal, service)));
  return Math.round((matched.length / goals.length) * 100);
}

function computeCompatibilityScore(participant, providerProfile) {
  const breakdown = {
    location: computeLocationScore(participant, providerProfile),
    language: computeLanguageScore(participant, providerProfile),
    goals: computeGoalsScore(participant, providerProfile),
  };

  const score = Math.round((breakdown.location + breakdown.language + breakdown.goals) / 3);
  return { score, breakdown };
}

function serializeProviderSummary(user, profile) {
  return {
    id: String(user._id),
    name: user.fullName,
    location: profile.location,
    languages: profile.languages,
    services: profile.services,
    hourlyRate: profile.hourlyRate,
    acceptingNewParticipants: profile.acceptingNewParticipants,
    abnVerificationStatus: profile.abnVerificationStatus,
    rating: profile.rating,
  };
}

function serializeProviderDetail(user, profile) {
  return {
    ...serializeProviderSummary(user, profile),
    bio: profile.bio,
    abn: profile.abn,
    email: user.email,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function canScoreCompatibility(requester) {
  return SCORING_REQUESTER_ROLES.includes(requester?.role);
}

function normalizeGoalsFilter(value) {
  if (!value) return null;
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const goals = raw.map((goal) => normalizeText(goal)).filter(Boolean);
  return goals.length > 0 ? goals : null;
}

function parseBooleanFilter(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return false;
}

function matchesNear(profile, near) {
  if (!near) return true;
  return stringsOverlap(profile.location, near);
}

function matchesLanguage(profile, language) {
  if (!language) return true;
  const target = language.toLowerCase();
  return (profile.languages || []).some((entry) => normalizeText(entry).toLowerCase() === target);
}

function matchesGoals(profile, goals) {
  if (!goals) return true;
  const services = profile.services || [];
  return goals.some((goal) => services.some((service) => stringsOverlap(goal, service)));
}

function sortProviderEntries(entries, { topRated, canScore }) {
  if (topRated) {
    return entries.sort((a, b) => {
      if (a.profile.rating === null && b.profile.rating === null) {
        return b.profile.createdAt - a.profile.createdAt;
      }
      if (a.profile.rating === null) return 1;
      if (b.profile.rating === null) return -1;
      if (b.profile.rating !== a.profile.rating) return b.profile.rating - a.profile.rating;
      return b.profile.createdAt - a.profile.createdAt;
    });
  }

  if (canScore) {
    return entries.sort((a, b) => {
      if (b.compatibilityScore !== a.compatibilityScore) return b.compatibilityScore - a.compatibilityScore;
      return b.profile.createdAt - a.profile.createdAt;
    });
  }

  return entries.sort((a, b) => b.profile.createdAt - a.profile.createdAt);
}

async function listProviders(requester, filters = {}) {
  const near = normalizeText(filters.near) || null;
  const language = normalizeText(filters.language) || null;
  const goals = normalizeGoalsFilter(filters.goals);
  const topRated = parseBooleanFilter(filters.topRated);
  const canScore = canScoreCompatibility(requester);

  const profiles = await ProviderProfile.find({}).populate({
    path: 'provider',
    select: 'fullName email isActive role',
    match: { role: 'provider', isActive: true },
  });

  let entries = profiles
    .filter((profile) => profile.provider)
    .filter((profile) => matchesNear(profile, near))
    .filter((profile) => matchesLanguage(profile, language))
    .filter((profile) => matchesGoals(profile, goals))
    .map((profile) => {
      const compatibility = canScore ? computeCompatibilityScore(requester, profile) : null;
      return {
        profile,
        user: profile.provider,
        compatibilityScore: compatibility ? compatibility.score : null,
        compatibilityBreakdown: compatibility ? compatibility.breakdown : null,
      };
    });

  entries = sortProviderEntries(entries, { topRated, canScore }).slice(0, PROVIDER_LIST_LIMIT);

  return {
    mode: 'providers',
    boundary: PROVIDER_MATCHING_BOUNDARY,
    filter: { near, language, goals, topRated },
    providers: entries.map((entry) => ({
      ...serializeProviderSummary(entry.user, entry.profile),
      compatibilityScore: entry.compatibilityScore,
      compatibilityBreakdown: entry.compatibilityBreakdown,
    })),
  };
}

async function getProviderById(requester, providerId) {
  if (!mongoose.isValidObjectId(providerId)) {
    throw notFound('Provider not found');
  }

  const user = await User.findOne({ _id: providerId, role: 'provider', isActive: true });
  if (!user) {
    throw notFound('Provider not found');
  }

  const profile = await ProviderProfile.findOne({ provider: user._id });
  if (!profile) {
    throw notFound('Provider not found');
  }

  const compatibility = canScoreCompatibility(requester) ? computeCompatibilityScore(requester, profile) : null;

  return {
    mode: 'providerDetail',
    boundary: PROVIDER_MATCHING_BOUNDARY,
    provider: {
      ...serializeProviderDetail(user, profile),
      compatibilityScore: compatibility ? compatibility.score : null,
      compatibilityBreakdown: compatibility ? compatibility.breakdown : null,
    },
  };
}

async function getMyProviderProfile(providerId) {
  const profile = await ProviderProfile.findOne({ provider: providerId }).populate('provider', 'fullName email');

  if (!profile) {
    return {
      mode: 'providerProfile',
      boundary: PROVIDER_MATCHING_BOUNDARY,
      profile: null,
    };
  }

  return {
    mode: 'providerProfile',
    boundary: PROVIDER_MATCHING_BOUNDARY,
    profile: serializeProviderDetail(profile.provider, profile),
  };
}

function normalizeStringArray(value, fieldName, errors) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array of strings`);
    return [];
  }
  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function validateProviderProfilePayload(payload) {
  const errors = [];
  const location = normalizeText(payload.location);
  if (!location) {
    errors.push('location is required');
  }

  const languages = normalizeStringArray(payload.languages, 'languages', errors);
  const services = normalizeStringArray(payload.services, 'services', errors);

  let hourlyRate;
  if (payload.hourlyRate !== undefined && payload.hourlyRate !== null && payload.hourlyRate !== '') {
    hourlyRate = Number(payload.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      errors.push('hourlyRate must be a non-negative number');
    }
  }

  let acceptingNewParticipants = true;
  if (payload.acceptingNewParticipants !== undefined) {
    if (typeof payload.acceptingNewParticipants !== 'boolean') {
      errors.push('acceptingNewParticipants must be a boolean');
    } else {
      acceptingNewParticipants = payload.acceptingNewParticipants;
    }
  }

  return {
    errors,
    values: {
      location,
      languages,
      services,
      hourlyRate,
      bio: normalizeText(payload.bio),
      abn: normalizeText(payload.abn),
      acceptingNewParticipants,
    },
  };
}

async function saveMyProviderProfile(providerId, payload = {}) {
  const { errors, values } = validateProviderProfilePayload(payload);
  if (errors.length > 0) {
    throw badRequest('Invalid provider profile', errors);
  }

  const setFields = {
    provider: providerId,
    location: values.location,
    languages: values.languages,
    services: values.services,
    bio: values.bio,
    abn: values.abn,
    acceptingNewParticipants: values.acceptingNewParticipants,
  };
  if (values.hourlyRate !== undefined) {
    setFields.hourlyRate = values.hourlyRate;
  }

  // $set (not a whole-document replace) so platform-controlled fields like
  // rating/abnVerificationStatus are left untouched on an existing profile.
  await ProviderProfile.findOneAndUpdate(
    { provider: providerId },
    { $set: setFields },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const updated = await ProviderProfile.findOne({ provider: providerId }).populate('provider', 'fullName email');

  return {
    mode: 'providerProfile',
    boundary: PROVIDER_MATCHING_BOUNDARY,
    profile: serializeProviderDetail(updated.provider, updated),
  };
}

module.exports = {
  PROVIDER_MATCHING_BOUNDARY,
  computeCompatibilityScore,
  getMyProviderProfile,
  getProviderById,
  listProviders,
  saveMyProviderProfile,
};
