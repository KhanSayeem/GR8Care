const Booking = require('../models/Booking');
const ProviderAvailability = require('../models/ProviderAvailability');
const ProviderProfile = require('../models/ProviderProfile');
const { getTierAccess } = require('./subscriptionAccess');
const { PROVIDER_AVAILABILITY_BOUNDARY } = require('./providerAvailability');

const PROVIDER_DASHBOARD_BOUNDARY =
  'Provider dashboard metrics summarize GR8Care bookings and availability only. Earnings are an estimate from booked hours at your listed rate. They are not a payment record, an invoice, or confirmation of compliance status.';
const SCHEDULE_RANGES = ['this-week', 'next-week', 'month'];

// A cancelled or declined booking is not work the provider still has to do, so it
// is left out of the counts and off the schedule.
const LIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'inProgress', 'completed'];
const EARNING_STATUSES = ['confirmed', 'inProgress', 'completed'];

function parseDashboardDate(value) {
  if (!value) return new Date();
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    const error = new Error('date must use YYYY-MM-DD');
    error.status = 400;
    throw error;
  }
  return date;
}

function getWeekdayName(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcWeek(date) {
  const normalized = startOfUtcDay(date);
  const day = normalized.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addUtcDays(normalized, mondayOffset);
}

function getScheduleWindow(date, range = 'this-week') {
  if (!SCHEDULE_RANGES.includes(range)) {
    const error = new Error('range must be one of: this-week, next-week, month');
    error.status = 400;
    throw error;
  }

  if (range === 'month') {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    return { start, days: Math.round((end - start) / 86400000) };
  }

  const weekStart = startOfUtcWeek(date);
  return {
    start: range === 'next-week' ? addUtcDays(weekStart, 7) : weekStart,
    days: 7,
  };
}

function sortBlocks(blocks = []) {
  return [...blocks].sort((a, b) => a.start.localeCompare(b.start));
}

function serializeScheduleBlock(block) {
  return {
    id: String(block._id),
    start: block.start,
    end: block.end,
    service: block.service,
    status: 'available',
  };
}

// A booking reaches a provider either as the provider on it or as the assigned
// support worker, which is how one account can hold both kinds of work.
function bookingsForProviderQuery(providerId) {
  return { $or: [{ provider: providerId }, { supportWorker: providerId }] };
}

async function getBookingsBetween(providerId, start, end) {
  return Booking.find({
    ...bookingsForProviderQuery(providerId),
    status: { $in: LIVE_BOOKING_STATUSES },
    scheduledStart: { $gte: start, $lt: end },
  })
    .populate('participant', 'fullName')
    .sort({ scheduledStart: 1 });
}

function hoursBetween(booking) {
  return (booking.scheduledEnd - booking.scheduledStart) / 3600000;
}

function formatBlockTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
}

// Availability blocks and booked sessions share one shape so a screen can render
// them in a single list, with 'status' saying which is which.
function serializeBookedSession(booking) {
  return {
    id: String(booking._id),
    start: formatBlockTime(booking.scheduledStart),
    end: formatBlockTime(booking.scheduledEnd),
    service: booking.service,
    status: 'booked',
    bookingId: String(booking._id),
    bookingStatus: booking.status,
    participantName: booking.participant?.fullName || 'Participant',
  };
}

async function getAvailabilityForProvider(providerId) {
  return ProviderAvailability.findOne({ provider: providerId });
}

function getEnabledBlocksForDay(availability, day) {
  return availability?.blocks?.filter((block) => block.enabled && block.day === day) || [];
}

function serializeScheduleDay(date, availability) {
  const day = getWeekdayName(date);
  return {
    date: date.toISOString().slice(0, 10),
    day,
    blocks: sortBlocks(getEnabledBlocksForDay(availability, day)).map(serializeScheduleBlock),
  };
}

async function getProviderScheduleToday(providerId, { date } = {}) {
  const targetDate = parseDashboardDate(date);
  const day = getWeekdayName(targetDate);
  const dayStart = startOfUtcDay(targetDate);
  const dayEnd = addUtcDays(dayStart, 1);

  const [availability, bookings] = await Promise.all([
    getAvailabilityForProvider(providerId),
    getBookingsBetween(providerId, dayStart, dayEnd),
  ]);

  const sessions = bookings.map(serializeBookedSession);
  const open = sortBlocks(getEnabledBlocksForDay(availability, day)).map(serializeScheduleBlock);

  return {
    mode: 'providerScheduleToday',
    boundary: PROVIDER_AVAILABILITY_BOUNDARY,
    date: targetDate.toISOString().slice(0, 10),
    day,
    bookedCount: sessions.length,
    availableCount: open.length,
    // Booked work first: it is what the provider has to turn up to.
    schedule: [...sessions, ...open],
  };
}

async function getProviderSchedule(providerId, { date, range = 'this-week' } = {}) {
  const targetDate = parseDashboardDate(date);
  const window = getScheduleWindow(targetDate, range);
  const windowEnd = addUtcDays(window.start, window.days);

  const [availability, bookings] = await Promise.all([
    getAvailabilityForProvider(providerId),
    getBookingsBetween(providerId, window.start, windowEnd),
  ]);

  const sessionsByDate = new Map();
  bookings.forEach((booking) => {
    const key = startOfUtcDay(booking.scheduledStart).toISOString().slice(0, 10);
    if (!sessionsByDate.has(key)) sessionsByDate.set(key, []);
    sessionsByDate.get(key).push(serializeBookedSession(booking));
  });

  const schedule = Array.from({ length: window.days }, (_, index) => {
    const day = serializeScheduleDay(addUtcDays(window.start, index), availability);
    const sessions = sessionsByDate.get(day.date) || [];
    return { ...day, blocks: [...sessions, ...day.blocks] };
  });

  return {
    mode: 'providerSchedule',
    boundary: PROVIDER_AVAILABILITY_BOUNDARY,
    range,
    startDate: schedule[0]?.date || null,
    endDate: schedule[schedule.length - 1]?.date || null,
    schedule,
  };
}

async function getProviderStats(provider, { date } = {}) {
  const today = parseDashboardDate(date);
  const dayStart = startOfUtcDay(today);
  const weekStart = startOfUtcWeek(today);

  const [availability, profile, todayBookings, weekBookings] = await Promise.all([
    getAvailabilityForProvider(provider._id),
    ProviderProfile.findOne({ provider: provider._id }),
    getBookingsBetween(provider._id, dayStart, addUtcDays(dayStart, 1)),
    getBookingsBetween(provider._id, weekStart, addUtcDays(weekStart, 7)),
  ]);
  const blocks = availability?.blocks || [];
  const activeAvailabilityBlocks = blocks.filter((block) => block.enabled).length;
  const tierAccess = getTierAccess(provider.subscriptionTier);

  // An estimate, not an invoice: booked hours at the rate the provider lists.
  const hourlyRate = profile?.hourlyRate || 0;
  const estimatedEarnings = Math.round(
    weekBookings
      .filter((booking) => EARNING_STATUSES.includes(booking.status))
      .reduce((total, booking) => total + hoursBetween(booking) * hourlyRate, 0)
  );

  return {
    mode: 'providerStats',
    boundary: PROVIDER_DASHBOARD_BOUNDARY,
    stats: {
      providerId: String(provider._id),
      displayName: provider.fullName,
      verified: profile?.abnVerificationStatus === 'verified',
      subscriptionTier: provider.subscriptionTier,
      subscriptionAccess: tierAccess,
      sessionsToday: todayBookings.length,
      sessionsThisWeek: weekBookings.length,
      earningsThisWeek: estimatedEarnings,
      rating: profile?.rating ?? null,
      availabilityBlocks: blocks.length,
      activeAvailabilityBlocks,
      lastAvailabilityUpdate: availability?.updatedAt || null,
    },
  };
}

module.exports = {
  PROVIDER_DASHBOARD_BOUNDARY,
  getProviderSchedule,
  getProviderScheduleToday,
  getProviderStats,
  parseDashboardDate,
};
