const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const { isExpired } = require('../models/ServiceRequest');
const User = require('../models/User');

const INSTANT_REQUEST_BOUNDARY =
  'Instant requests notify a provider directly and do not confirm a booking, participant consent, or provider policy approval. The provider should follow up to confirm details before delivering support.';
const EXPIRY_MINUTES = 5;
const INSTANT_REQUEST_WINDOWS = ['live', 'past', 'all'];
const INSTANT_REQUEST_PAST_STATUSES = ['accepted', 'declined', 'expired'];

function badRequest(message, details) {
  const error = new Error(message);
  error.status = 400;
  if (details) error.details = details;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function forbidden(message) {
  const error = new Error(message);
  error.status = 403;
  return error;
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function parseDateTime(value, fieldName) {
  if (!value) {
    throw badRequest(`${fieldName} is required`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`${fieldName} must be a valid date-time`);
  }

  return date;
}

function getRefId(value) {
  return value?._id ? String(value._id) : String(value);
}

function serializeUserSummary(user) {
  if (!user || !user._id) return null;
  return {
    id: String(user._id),
    displayName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

function assertInstantRequester(user, participantId) {
  if (!['participant', 'caregiver', 'admin'].includes(user.role)) {
    throw forbidden('Only participants, caregivers, or admins can send instant requests');
  }

  if (user.role === 'participant' && participantId && String(participantId) !== String(user._id)) {
    throw forbidden('Participants can only send instant requests for their own account');
  }
}

function assertInstantResponder(user) {
  if (!['provider', 'supportWorker', 'admin'].includes(user.role)) {
    throw forbidden('Only providers, support workers, or admins can respond to instant requests');
  }
}

async function findActiveUser(id, roles, label) {
  if (!mongoose.isValidObjectId(id)) {
    throw notFound(`${label} not found`);
  }

  const user = await User.findOne({ _id: id, role: { $in: roles }, isActive: true });
  if (!user) {
    throw notFound(`${label} not found`);
  }

  return user;
}

function serializeInstantRequest(request) {
  return {
    id: String(request._id),
    participantId: getRefId(request.participant),
    participant: serializeUserSummary(request.participant),
    requestedById: getRefId(request.requestedBy),
    preferredProviderId: request.preferredProvider ? getRefId(request.preferredProvider) : null,
    title: request.title,
    service: request.service,
    description: request.description,
    supportCategory: request.supportCategory,
    preferredStartDate: request.preferredStartDate,
    preferredEndDate: request.preferredEndDate,
    status: request.status,
    source: request.source,
    notes: request.notes,
    expiresAt: request.expiresAt,
    respondedAt: request.respondedAt,
    declineReason: request.declineReason,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

async function createInstantRequest(requester, payload = {}, io) {
  const participantId = payload.participantId || requester._id;
  const preferredProviderId = payload.preferredProviderId;
  const service = normalizeText(payload.service);
  const title = normalizeText(payload.title) || service;
  const preferredStartDate = parseDateTime(payload.preferredStartDate, 'preferredStartDate');
  const preferredEndDate = parseDateTime(payload.preferredEndDate, 'preferredEndDate');

  assertInstantRequester(requester, participantId);

  if (!preferredProviderId) {
    throw badRequest('preferredProviderId is required');
  }
  if (!service) {
    throw badRequest('service is required');
  }
  if (preferredStartDate >= preferredEndDate) {
    throw badRequest('preferredEndDate must be after preferredStartDate');
  }

  const [participant, provider] = await Promise.all([
    findActiveUser(participantId, ['participant', 'caregiver'], 'Participant'),
    findActiveUser(preferredProviderId, ['provider', 'supportWorker'], 'Provider'),
  ]);

  const created = await ServiceRequest.create({
    participant: participant._id,
    requestedBy: requester._id,
    preferredProvider: provider._id,
    title,
    service,
    description: normalizeText(payload.description),
    supportCategory: normalizeText(payload.supportCategory || 'core'),
    preferredStartDate,
    preferredEndDate,
    status: 'submitted',
    source: requester.role === 'admin' ? 'admin' : requester.role,
    notes: normalizeText(payload.notes),
    expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60000),
  });

  const serialized = serializeInstantRequest(created);

  if (io) {
    io.to(`provider:${provider._id}`).emit('request:new', serialized);
  }

  return {
    mode: 'instantRequestCreated',
    boundary: INSTANT_REQUEST_BOUNDARY,
    request: serialized,
  };
}

function parseInstantRequestWindow(value = 'live') {
  if (!INSTANT_REQUEST_WINDOWS.includes(value)) {
    throw badRequest('window must be one of: live, past, all');
  }
  return value;
}

function getAccessQuery(user) {
  if (user.role === 'admin') return {};
  if (['provider', 'supportWorker'].includes(user.role)) return { preferredProvider: user._id };
  if (['participant', 'caregiver'].includes(user.role)) return { participant: user._id };

  return { _id: null };
}

async function listInstantRequests(user, filters = {}) {
  const window = parseInstantRequestWindow(filters.window);
  const asOf = filters.asOf ? parseDateTime(filters.asOf, 'asOf') : new Date();
  const query = { ...getAccessQuery(user) };

  if (window === 'live') {
    query.status = 'submitted';
    query.expiresAt = { $gt: asOf };
  } else if (window === 'past') {
    query.$or = [
      { status: { $in: INSTANT_REQUEST_PAST_STATUSES } },
      { status: 'submitted', expiresAt: { $lte: asOf } },
    ];
  }

  let requests = await ServiceRequest.find(query)
    .populate('participant', 'fullName email role')
    .sort({ createdAt: -1 })
    .limit(100);

  const staleIds = requests
    .filter((request) => isExpired(request, asOf))
    .map((request) => request._id);

  if (staleIds.length > 0) {
    await ServiceRequest.updateMany(
      { _id: { $in: staleIds } },
      { $set: { status: 'expired' } }
    );

    if (window === 'live') {
      // Stale requests no longer belong in the live window.
      requests = requests.filter((request) => !isExpired(request, asOf));
    } else {
      requests = requests.map((request) => {
        if (staleIds.some((id) => String(id) === String(request._id))) {
          request.status = 'expired';
        }
        return request;
      });
    }
  }

  return {
    mode: 'instantRequests',
    boundary: INSTANT_REQUEST_BOUNDARY,
    filter: { window, asOf },
    requests: requests.map(serializeInstantRequest),
  };
}

async function findAccessibleInstantRequest(user, requestId) {
  if (!mongoose.isValidObjectId(requestId)) {
    throw notFound('Instant request not found');
  }

  const request = await ServiceRequest.findOne({
    _id: requestId,
    preferredProvider: user._id,
  });

  if (!request) {
    throw notFound('Instant request not found');
  }

  return request;
}

async function respondToInstantRequest(user, requestId, action, payload = {}, io) {
  const request = await findAccessibleInstantRequest(user, requestId);
  assertInstantResponder(user);
  const asOf = new Date();

  if (isExpired(request, asOf)) {
    request.status = 'expired';
    await request.save();
    throw conflict('This request has expired');
  }

  if (request.status !== 'submitted') {
    throw conflict('This request has already been responded to');
  }

  request.status = action === 'accept' ? 'accepted' : 'declined';
  request.respondedAt = asOf;
  if (action === 'decline') {
    request.declineReason = normalizeText(payload.reason);
  }

  await request.save();

  const serialized = serializeInstantRequest(request);

  if (io) {
    io.to(`participant:${getRefId(request.participant)}`).emit('request:responded', serialized);
  }

  return {
    mode: 'instantRequestResponded',
    boundary: INSTANT_REQUEST_BOUNDARY,
    request: serialized,
  };
}

async function acceptInstantRequest(user, requestId, payload, io) {
  return respondToInstantRequest(user, requestId, 'accept', payload, io);
}

async function declineInstantRequest(user, requestId, payload, io) {
  return respondToInstantRequest(user, requestId, 'decline', payload, io);
}

module.exports = {
  INSTANT_REQUEST_BOUNDARY,
  EXPIRY_MINUTES,
  acceptInstantRequest,
  createInstantRequest,
  declineInstantRequest,
  listInstantRequests,
  respondToInstantRequest,
  serializeInstantRequest,
};
