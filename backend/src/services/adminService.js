const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');

const ADMIN_STATS_BOUNDARY =
  'Admin metrics summarize account, provider, and booking counts only. They are not a substitute for financial reconciliation, compliance audit, or official NDIS reporting.';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw badRequest(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function getRefId(value) {
  return value?._id ? String(value._id) : String(value);
}

function serializePendingProvider(profile) {
  return {
    id: String(profile._id),
    provider: {
      id: getRefId(profile.provider),
      fullName: profile.provider.fullName,
      email: profile.provider.email,
    },
    location: profile.location,
    services: profile.services,
    languages: profile.languages,
    hourlyRate: profile.hourlyRate,
    bio: profile.bio,
    abn: profile.abn,
    submittedAt: profile.createdAt,
  };
}

function serializeProviderVerification(profile) {
  return {
    id: String(profile._id),
    providerId: getRefId(profile.provider),
    location: profile.location,
    services: profile.services,
    languages: profile.languages,
    hourlyRate: profile.hourlyRate,
    bio: profile.bio,
    abn: profile.abn,
    abnVerificationStatus: profile.abnVerificationStatus,
    rating: profile.rating,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

async function getPlatformStats() {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

  const [
    totalUsers,
    totalParticipants,
    totalProviders,
    pendingVerifications,
    bookingsToday,
    activeBookings,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: { $in: ['participant', 'caregiver'] } }),
    User.countDocuments({ role: { $in: ['provider', 'supportWorker'] } }),
    ProviderProfile.countDocuments({ abnVerificationStatus: 'pending' }),
    Booking.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
    Booking.countDocuments({ status: { $in: ['confirmed', 'inProgress'] } }),
  ]);

  return {
    mode: 'adminStats',
    boundary: ADMIN_STATS_BOUNDARY,
    stats: {
      totalUsers,
      totalParticipants,
      totalProviders,
      pendingVerifications,
      bookingsToday,
      activeBookings,
    },
  };
}

async function listUsers(filters = {}) {
  const query = {};

  if (filters.role) {
    if (!User.ROLES.includes(filters.role)) {
      throw badRequest('role must be one of: ' + User.ROLES.join(', '));
    }
    query.role = filters.role;
  }

  if (filters.status) {
    if (!['active', 'suspended'].includes(filters.status)) {
      throw badRequest('status must be one of: active, suspended');
    }
    query.isActive = filters.status === 'active';
  }

  if (filters.search) {
    const escaped = escapeRegex(String(filters.search).trim());
    if (escaped) {
      query.$or = [
        { fullName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }
  }

  const page = parsePositiveInt(filters.page, 'page') || DEFAULT_PAGE;
  let limit = parsePositiveInt(filters.limit, 'limit') || DEFAULT_LIMIT;
  limit = Math.min(limit, MAX_LIMIT);

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    mode: 'adminUserList',
    boundary: ADMIN_STATS_BOUNDARY,
    users: users.map((user) => user.toSafeJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

async function listPendingProviders() {
  const profiles = await ProviderProfile.find({ abnVerificationStatus: 'pending' })
    .populate('provider', 'fullName email createdAt')
    .sort({ createdAt: 1 });

  const providers = profiles
    .filter((profile) => profile.provider)
    .map(serializePendingProvider);

  return {
    mode: 'adminPendingProviders',
    boundary: ADMIN_STATS_BOUNDARY,
    providers,
  };
}

async function findPendingProviderProfile(profileId) {
  if (!mongoose.isValidObjectId(profileId)) {
    throw notFound('Provider profile not found');
  }

  const profile = await ProviderProfile.findById(profileId);
  if (!profile) {
    throw notFound('Provider profile not found');
  }

  return profile;
}

async function approveProvider(profileId) {
  const profile = await findPendingProviderProfile(profileId);

  if (profile.abnVerificationStatus !== 'pending') {
    throw badRequest('Only pending providers can be approved');
  }

  await ProviderProfile.updateOne({ _id: profile._id }, { $set: { abnVerificationStatus: 'verified' } });
  const updated = await ProviderProfile.findById(profile._id);

  return {
    mode: 'adminProviderVerification',
    boundary: ADMIN_STATS_BOUNDARY,
    provider: serializeProviderVerification(updated),
  };
}

async function rejectProvider(profileId) {
  const profile = await findPendingProviderProfile(profileId);

  if (profile.abnVerificationStatus !== 'pending') {
    throw badRequest('Only pending providers can be rejected');
  }

  await ProviderProfile.updateOne({ _id: profile._id }, { $set: { abnVerificationStatus: 'rejected' } });
  const updated = await ProviderProfile.findById(profile._id);

  return {
    mode: 'adminProviderVerification',
    boundary: ADMIN_STATS_BOUNDARY,
    provider: serializeProviderVerification(updated),
  };
}

module.exports = {
  ADMIN_STATS_BOUNDARY,
  approveProvider,
  escapeRegex,
  getPlatformStats,
  listPendingProviders,
  listUsers,
  rejectProvider,
};
