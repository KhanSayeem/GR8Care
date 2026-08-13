const NdisPlan = require('../models/NdisPlan');

const FUNDING_BOUNDARY =
  'Funding endpoints summarize stored NDIS plan data for context only. They do not approve spending, replace plan management, or provide financial advice.';

function serviceError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
}

async function getActivePlanForParticipant(participantId) {
  return NdisPlan.findOne({ participant: participantId, status: 'active' }).sort({ startDate: -1, createdAt: -1 });
}

async function getFundingSummaryForUser(participantId) {
  const plan = await getActivePlanForParticipant(participantId);
  if (!plan) {
    throw serviceError(404, 'Active NDIS plan not found');
  }

  return {
    mode: 'fundingSummary',
    boundary: FUNDING_BOUNDARY,
    summary: plan.getFundingSummary(),
  };
}

function serializeTransaction(transaction) {
  return {
    id: transaction._id.toString(),
    category: transaction.category,
    label: transaction.label,
    amount: transaction.amount,
    serviceDate: transaction.serviceDate,
    providerName: transaction.providerName,
    reference: transaction.reference,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

async function listFundingTransactionsForUser(participantId, { category, limit = 25 } = {}) {
  const plan = await getActivePlanForParticipant(participantId);
  if (!plan) {
    throw serviceError(404, 'Active NDIS plan not found');
  }

  const categories = NdisPlan.FUNDING_CATEGORIES;
  if (category && !categories.includes(category)) {
    throw serviceError(400, 'Unsupported funding category', { categories });
  }

  const boundedLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const transactions = plan.transactions
    .filter((transaction) => !category || transaction.category === category)
    .sort((a, b) => b.serviceDate.getTime() - a.serviceDate.getTime())
    .slice(0, boundedLimit)
    .map(serializeTransaction);

  return {
    mode: 'fundingTransactions',
    boundary: FUNDING_BOUNDARY,
    plan: {
      id: plan._id.toString(),
      planNumber: plan.planNumber,
      currency: plan.currency,
    },
    transactions,
  };
}

module.exports = {
  FUNDING_BOUNDARY,
  getFundingSummaryForUser,
  listFundingTransactionsForUser,
};
