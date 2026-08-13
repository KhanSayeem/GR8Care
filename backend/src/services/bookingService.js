const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { BOOKING_STATUSES } = require('../models/Booking');
const ProviderAvailability = require('../models/ProviderAvailability');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

const BOOKING_REQUEST_BOUNDARY =
  'Booking requests remain pending until provider confirmation. Availability and conflict checks do not replace participant consent, worker assignment, or provider policy approval.';
const BOOKING_CANCELLABLE_STATUSES = ['pending', 'confirmed'];
const BOOKING_PROVIDER_UPDATE_STATUSES = ['confirmed', 'inProgress', 'completed', 'declined'];
const BOOKING_WINDOWS = ['upcoming', 'past', 'all'];

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

function formatUtcTime(date) {
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
}

function getWeekdayName(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
}

function minutesFromTime(value) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function availabilityBlockCovers(block, scheduledStart, scheduledEnd) {
  const startTime = formatUtcTime(scheduledStart);
  const endTime = formatUtcTime(scheduledEnd);

  return (
    block.enabled &&
    block.day === getWeekdayName(scheduledStart) &&
    minutesFromTime(block.start) <= minutesFromTime(startTime) &&
    minutesFromTime(block.end) >= minutesFromTime(endTime)
  );
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
    goals: Array.isArray(user.goals) ? user.goals : [],
  };
}

function serializeBooking(booking) {
  return {
    id: String(booking._id),
    participantId: getRefId(booking.participant),
    providerId: getRefId(booking.provider),
    supportWorkerId: booking.supportWorker ? getRefId(booking.supportWorker) : null,
    serviceRequestId: booking.serviceRequest ? getRefId(booking.serviceRequest) : null,
    availabilityBlockId: booking.availabilityBlockId ? String(booking.availabilityBlockId) : null,
    service: booking.service,
    supportCategory: booking.supportCategory,
    scheduledStart: booking.scheduledStart,
    scheduledEnd: booking.scheduledEnd,
    status: booking.status,
    location: booking.location,
    notes: booking.notes,
    cancellationReason: booking.cancellationReason,
    cancelledAt: booking.cancelledAt,
    cancelledById: booking.cancelledBy ? String(booking.cancelledBy) : null,
    completedAt: booking.completedAt,
    completedById: booking.completedBy ? String(booking.completedBy) : null,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

function serializeBookingDetail(booking) {
  return {
    ...serializeBooking(booking),
    participant: serializeUserSummary(booking.participant),
    provider: serializeUserSummary(booking.provider),
    supportWorker: serializeUserSummary(booking.supportWorker),
  };
}

function assertBookingRequester(user, participantId) {
  if (!['participant', 'caregiver', 'admin'].includes(user.role)) {
    throw forbidden('Only participants, caregivers, or admins can request bookings');
  }

  if (user.role === 'participant' && participantId && String(participantId) !== String(user._id)) {
    throw forbidden('Participants can only request bookings for their own account');
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

async function createBooking(requester, payload = {}) {
  const providerId = payload.providerId;
  const participantId = payload.participantId || requester._id;
  const service = normalizeText(payload.service);
  const scheduledStart = parseDateTime(payload.scheduledStart, 'scheduledStart');
  const scheduledEnd = parseDateTime(payload.scheduledEnd, 'scheduledEnd');

  assertBookingRequester(requester, participantId);

  if (!providerId) {
    throw badRequest('providerId is required');
  }
  if (!service) {
    throw badRequest('service is required');
  }
  if (scheduledStart >= scheduledEnd) {
    throw badRequest('scheduledEnd must be after scheduledStart');
  }

  const [participant, provider] = await Promise.all([
    findActiveUser(participantId, ['participant', 'caregiver'], 'Participant'),
    findActiveUser(providerId, ['provider', 'supportWorker'], 'Provider'),
  ]);

  let supportWorker = null;
  if (payload.supportWorkerId) {
    supportWorker = await findActiveUser(payload.supportWorkerId, ['supportWorker'], 'Support worker');
  }

  let serviceRequest = null;
  if (payload.serviceRequestId) {
    if (!mongoose.isValidObjectId(payload.serviceRequestId)) {
      throw notFound('Service request not found');
    }

    serviceRequest = await ServiceRequest.findOne({
      _id: payload.serviceRequestId,
      participant: participant._id,
    });
    if (!serviceRequest) {
      throw notFound('Service request not found');
    }
  }

  const availability = await ProviderAvailability.findOne({ provider: provider._id });
  const matchingBlock = availability?.blocks?.find((block) => availabilityBlockCovers(block, scheduledStart, scheduledEnd));
  if (!matchingBlock) {
    throw conflict('Requested time is outside provider availability');
  }

  const conflicts = await Booking.findProviderConflicts(provider._id, scheduledStart, scheduledEnd);
  if (conflicts.length > 0) {
    throw conflict('Requested time conflicts with an existing booking');
  }

  const booking = await Booking.create({
    participant: participant._id,
    provider: provider._id,
    supportWorker: supportWorker?._id || null,
    serviceRequest: serviceRequest?._id || null,
    availabilityBlockId: matchingBlock._id,
    service,
    supportCategory: normalizeText(payload.supportCategory || 'core'),
    scheduledStart,
    scheduledEnd,
    location: normalizeText(payload.location),
    notes: normalizeText(payload.notes),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
  });

  return {
    mode: 'bookingCreated',
    boundary: BOOKING_REQUEST_BOUNDARY,
    booking: serializeBooking(booking),
  };
}

function getAccessQuery(user) {
  if (user.role === 'admin') return {};
  if (['participant', 'caregiver'].includes(user.role)) return { participant: user._id };
  if (user.role === 'provider') return { provider: user._id };
  if (user.role === 'supportWorker') {
    return {
      $or: [{ provider: user._id }, { supportWorker: user._id }],
    };
  }

  return { _id: null };
}

function parseBookingWindow(value = 'upcoming') {
  if (!BOOKING_WINDOWS.includes(value)) {
    throw badRequest('window must be one of: upcoming, past, all');
  }
  return value;
}

function buildBookingListQuery(user, filters = {}) {
  const window = parseBookingWindow(filters.window);
  const query = { ...getAccessQuery(user) };
  const asOf = filters.asOf ? parseDateTime(filters.asOf, 'asOf') : new Date();

  if (filters.status) {
    if (!BOOKING_STATUSES.includes(filters.status)) {
      throw badRequest('status is not supported');
    }
    query.status = filters.status;
  }

  if (window === 'upcoming') {
    query.scheduledEnd = { $gte: asOf };
  } else if (window === 'past') {
    query.scheduledEnd = { $lt: asOf };
  }

  return { query, window, asOf };
}

async function listBookings(user, filters = {}) {
  const { query, window, asOf } = buildBookingListQuery(user, filters);
  const sort = window === 'past' ? { scheduledStart: -1 } : { scheduledStart: 1 };
  const bookings = await Booking.find(query).sort(sort).limit(100);

  return {
    mode: 'bookings',
    boundary: BOOKING_REQUEST_BOUNDARY,
    filter: {
      window,
      status: filters.status || null,
      asOf,
    },
    bookings: bookings.map(serializeBooking),
  };
}

async function findAccessibleBooking(user, bookingId, options = {}) {
  if (!mongoose.isValidObjectId(bookingId)) {
    throw notFound('Booking not found');
  }

  let query = Booking.findOne({
    _id: bookingId,
    ...getAccessQuery(user),
  });
  if (options.populate) {
    query = query
      .populate('participant', 'fullName email role goals')
      .populate('provider', 'fullName email role')
      .populate('supportWorker', 'fullName email role');
  }

  const booking = await query;

  if (!booking) {
    throw notFound('Booking not found');
  }

  return booking;
}

async function getBookingDetail(user, bookingId) {
  const booking = await findAccessibleBooking(user, bookingId, { populate: true });

  return {
    mode: 'bookingDetail',
    boundary: BOOKING_REQUEST_BOUNDARY,
    booking: serializeBookingDetail(booking),
  };
}

function assertProviderUpdatePermission(user) {
  if (!['provider', 'supportWorker', 'admin'].includes(user.role)) {
    throw forbidden('Only providers, support workers, or admins can update booking status');
  }
}

async function updateBooking(user, bookingId, payload = {}) {
  const booking = await findAccessibleBooking(user, bookingId);
  let changed = false;

  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    booking.notes = normalizeText(payload.notes);
    changed = true;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    assertProviderUpdatePermission(user);
    if (!BOOKING_PROVIDER_UPDATE_STATUSES.includes(payload.status)) {
      throw badRequest('status must be one of: confirmed, inProgress, completed, declined');
    }
    if (booking.status === 'cancelled') {
      throw conflict('Cancelled bookings cannot be updated');
    }

    booking.status = payload.status;
    if (payload.status === 'completed') {
      booking.completedAt = new Date();
      booking.completedBy = user._id;
    }
    changed = true;
  }

  if (!changed) {
    throw badRequest('notes or status is required');
  }

  await booking.save();
  const populated = await findAccessibleBooking(user, booking._id, { populate: true });

  return {
    mode: 'bookingUpdated',
    boundary: BOOKING_REQUEST_BOUNDARY,
    booking: serializeBookingDetail(populated),
  };
}

async function cancelBooking(user, bookingId, payload = {}) {
  const booking = await findAccessibleBooking(user, bookingId);

  if (booking.status === 'cancelled') {
    return {
      mode: 'bookingCancelled',
      boundary: BOOKING_REQUEST_BOUNDARY,
      booking: serializeBooking(booking),
    };
  }

  if (!BOOKING_CANCELLABLE_STATUSES.includes(booking.status)) {
    throw conflict('Only pending or confirmed bookings can be cancelled');
  }

  booking.status = 'cancelled';
  booking.cancellationReason = normalizeText(payload.reason || payload.cancellationReason);
  booking.cancelledAt = new Date();
  booking.cancelledBy = user._id;
  await booking.save();

  return {
    mode: 'bookingCancelled',
    boundary: BOOKING_REQUEST_BOUNDARY,
    booking: serializeBooking(booking),
  };
}

module.exports = {
  BOOKING_REQUEST_BOUNDARY,
  cancelBooking,
  createBooking,
  getBookingDetail,
  listBookings,
  serializeBooking,
  serializeBookingDetail,
  updateBooking,
};
