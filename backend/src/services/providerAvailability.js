const mongoose = require('mongoose');
const ProviderAvailability = require('../models/ProviderAvailability');
const { WEEKDAYS } = require('../models/ProviderAvailability');
const User = require('../models/User');

const PROVIDER_AVAILABILITY_BOUNDARY =
  'Provider availability is a scheduling guide only. It does not confirm a booking, worker assignment, participant consent, or provider policy approval.';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AVAILABILITY_RANGE_DAYS = 31;

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeAvailabilityBlock(block = {}) {
  return {
    day: normalizeText(block.day),
    start: normalizeText(block.start),
    end: normalizeText(block.end),
    service: normalizeText(block.service || 'General support'),
    enabled: block.enabled !== false,
  };
}

function minutesFromTime(value) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function parseAvailabilityDate(value, fieldName) {
  if (!value) {
    const error = new Error(`${fieldName} is required`);
    error.status = 400;
    throw error;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (!DATE_PATTERN.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    const error = new Error(`${fieldName} must use YYYY-MM-DD`);
    error.status = 400;
    throw error;
  }

  return date;
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getWeekdayName(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
}

function validateAvailabilityBlock(block) {
  const errors = [];

  if (!WEEKDAYS.includes(block.day)) {
    errors.push('day must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday');
  }

  if (!TIME_PATTERN.test(block.start)) {
    errors.push('start must use HH:mm 24-hour time');
  }

  if (!TIME_PATTERN.test(block.end)) {
    errors.push('end must use HH:mm 24-hour time');
  }

  if (TIME_PATTERN.test(block.start) && TIME_PATTERN.test(block.end) && minutesFromTime(block.start) >= minutesFromTime(block.end)) {
    errors.push('start must be before end');
  }

  if (!block.service) {
    errors.push('service is required');
  }

  return errors;
}

function validateAvailabilityBlocks(blocks = []) {
  if (!Array.isArray(blocks)) {
    return ['blocks must be an array'];
  }

  if (blocks.length === 0) {
    return ['at least one availability block is required'];
  }

  return blocks.flatMap((block, index) =>
    validateAvailabilityBlock(normalizeAvailabilityBlock(block)).map((error) => `blocks[${index}]: ${error}`)
  );
}

function serializeAvailability(availability) {
  return {
    providerId: String(availability.provider),
    blocks: availability.blocks.map((block) => ({
      id: String(block._id),
      day: block.day,
      start: block.start,
      end: block.end,
      service: block.service,
      enabled: block.enabled,
    })),
    updatedAt: availability.updatedAt,
  };
}

function serializeAvailabilitySlot(block) {
  return {
    id: String(block._id),
    start: block.start,
    end: block.end,
    service: block.service,
    status: 'available',
  };
}

function sortBlocks(blocks = []) {
  return [...blocks].sort((a, b) => a.start.localeCompare(b.start));
}

function buildAvailabilityDays(availability, startDate, dayCount) {
  return Array.from({ length: dayCount }, (_, index) => {
    const date = addUtcDays(startDate, index);
    const day = getWeekdayName(date);
    const enabledBlocks = availability?.blocks?.filter((block) => block.enabled && block.day === day) || [];

    return {
      date: date.toISOString().slice(0, 10),
      day,
      openSlots: sortBlocks(enabledBlocks).map(serializeAvailabilitySlot),
    };
  });
}

async function saveProviderAvailability(providerId, blocks = []) {
  const normalizedBlocks = blocks.map(normalizeAvailabilityBlock);
  const validationErrors = validateAvailabilityBlocks(normalizedBlocks);

  if (validationErrors.length > 0) {
    const error = new Error('Invalid provider availability');
    error.status = 400;
    error.details = validationErrors;
    throw error;
  }

  const availability = await ProviderAvailability.findOneAndUpdate(
    { provider: providerId },
    { provider: providerId, blocks: normalizedBlocks },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return {
    mode: 'providerAvailability',
    boundary: PROVIDER_AVAILABILITY_BOUNDARY,
    availability: serializeAvailability(availability),
  };
}

async function getProviderAvailability(providerId, { startDate, endDate } = {}) {
  if (!mongoose.isValidObjectId(providerId)) {
    const error = new Error('Provider not found');
    error.status = 404;
    throw error;
  }

  const provider = await User.findOne({
    _id: providerId,
    role: { $in: ['provider', 'supportWorker'] },
    isActive: true,
  });

  if (!provider) {
    const error = new Error('Provider not found');
    error.status = 404;
    throw error;
  }

  const start = parseAvailabilityDate(startDate, 'startDate');
  const end = parseAvailabilityDate(endDate, 'endDate');
  const dayCount = Math.round((end - start) / 86400000) + 1;

  if (dayCount < 1) {
    const error = new Error('endDate must be on or after startDate');
    error.status = 400;
    throw error;
  }

  if (dayCount > MAX_AVAILABILITY_RANGE_DAYS) {
    const error = new Error(`date range cannot exceed ${MAX_AVAILABILITY_RANGE_DAYS} days`);
    error.status = 400;
    throw error;
  }

  const availability = await ProviderAvailability.findOne({ provider: provider._id });
  const days = buildAvailabilityDays(availability, start, dayCount);

  return {
    mode: 'providerAvailabilitySlots',
    boundary: PROVIDER_AVAILABILITY_BOUNDARY,
    provider: {
      id: String(provider._id),
      displayName: provider.fullName,
    },
    startDate: days[0]?.date || null,
    endDate: days[days.length - 1]?.date || null,
    days,
  };
}

module.exports = {
  PROVIDER_AVAILABILITY_BOUNDARY,
  getProviderAvailability,
  normalizeAvailabilityBlock,
  saveProviderAvailability,
  validateAvailabilityBlocks,
};
