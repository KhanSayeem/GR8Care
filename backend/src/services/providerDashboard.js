const ProviderAvailability = require('../models/ProviderAvailability');
const { getTierAccess } = require('./subscriptionAccess');
const { PROVIDER_AVAILABILITY_BOUNDARY } = require('./providerAvailability');

const PROVIDER_DASHBOARD_BOUNDARY =
  'Provider dashboard metrics summarize GR8Care account and availability data only. They do not confirm bookings, payments, ratings, or compliance status.';
const SCHEDULE_RANGES = ['this-week', 'next-week', 'month'];

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
  const availability = await getAvailabilityForProvider(providerId);
  const blocks = getEnabledBlocksForDay(availability, day);

  return {
    mode: 'providerScheduleToday',
    boundary: PROVIDER_AVAILABILITY_BOUNDARY,
    date: targetDate.toISOString().slice(0, 10),
    day,
    schedule: sortBlocks(blocks).map(serializeScheduleBlock),
  };
}

async function getProviderSchedule(providerId, { date, range = 'this-week' } = {}) {
  const targetDate = parseDashboardDate(date);
  const window = getScheduleWindow(targetDate, range);
  const availability = await getAvailabilityForProvider(providerId);
  const schedule = Array.from({ length: window.days }, (_, index) =>
    serializeScheduleDay(addUtcDays(window.start, index), availability)
  );

  return {
    mode: 'providerSchedule',
    boundary: PROVIDER_AVAILABILITY_BOUNDARY,
    range,
    startDate: schedule[0]?.date || null,
    endDate: schedule[schedule.length - 1]?.date || null,
    schedule,
  };
}

async function getProviderStats(provider) {
  const availability = await getAvailabilityForProvider(provider._id);
  const blocks = availability?.blocks || [];
  const activeAvailabilityBlocks = blocks.filter((block) => block.enabled).length;
  const tierAccess = getTierAccess(provider.subscriptionTier);

  return {
    mode: 'providerStats',
    boundary: PROVIDER_DASHBOARD_BOUNDARY,
    stats: {
      providerId: String(provider._id),
      displayName: provider.fullName,
      verified: false,
      subscriptionTier: provider.subscriptionTier,
      subscriptionAccess: tierAccess,
      sessionsToday: 0,
      sessionsThisWeek: 0,
      earningsThisWeek: 0,
      rating: null,
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
