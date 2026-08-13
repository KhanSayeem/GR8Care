const ProviderAvailability = require('../models/ProviderAvailability');
const { getTierAccess } = require('./subscriptionAccess');
const { PROVIDER_AVAILABILITY_BOUNDARY } = require('./providerAvailability');

const PROVIDER_DASHBOARD_BOUNDARY =
  'Provider dashboard metrics summarize GR8Care account and availability data only. They do not confirm bookings, payments, ratings, or compliance status.';

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

async function getProviderScheduleToday(providerId, { date } = {}) {
  const targetDate = parseDashboardDate(date);
  const day = getWeekdayName(targetDate);
  const availability = await getAvailabilityForProvider(providerId);
  const blocks = availability?.blocks?.filter((block) => block.enabled && block.day === day) || [];

  return {
    mode: 'providerScheduleToday',
    boundary: PROVIDER_AVAILABILITY_BOUNDARY,
    date: targetDate.toISOString().slice(0, 10),
    day,
    schedule: sortBlocks(blocks).map(serializeScheduleBlock),
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
  getProviderScheduleToday,
  getProviderStats,
  parseDashboardDate,
};
