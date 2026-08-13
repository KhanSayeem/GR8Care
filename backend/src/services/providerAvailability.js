const ProviderAvailability = require('../models/ProviderAvailability');
const { WEEKDAYS } = require('../models/ProviderAvailability');

const PROVIDER_AVAILABILITY_BOUNDARY =
  'Provider availability is a scheduling guide only. It does not confirm a booking, worker assignment, participant consent, or provider policy approval.';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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

module.exports = {
  PROVIDER_AVAILABILITY_BOUNDARY,
  normalizeAvailabilityBlock,
  saveProviderAvailability,
  validateAvailabilityBlocks,
};
