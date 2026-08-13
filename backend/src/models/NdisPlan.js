const mongoose = require('mongoose');

const FUNDING_CATEGORIES = ['core', 'capacity', 'capital'];
const FUNDING_CATEGORY_LABELS = {
  core: 'Core Supports',
  capacity: 'Capacity Building',
  capital: 'Capital Supports',
};
const PLAN_STATUSES = ['draft', 'active', 'expired', 'archived'];
const BUDGET_ALERT_THRESHOLD_PERCENTAGE = 80;

const fundingCategorySchema = new mongoose.Schema(
  {
    category: { type: String, enum: FUNDING_CATEGORIES, required: true },
    label: { type: String, required: true, trim: true },
    allocation: { type: Number, required: true, min: 0 },
    spentToDate: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const fundingTransactionSchema = new mongoose.Schema(
  {
    category: { type: String, enum: FUNDING_CATEGORIES, required: true, index: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    serviceDate: { type: Date, required: true },
    providerName: { type: String, trim: true },
    reference: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const ndisPlanSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planNumber: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: PLAN_STATUSES, default: 'active', index: true },
    currency: { type: String, default: 'AUD', trim: true },
    fundingCategories: { type: [fundingCategorySchema], default: [] },
    transactions: { type: [fundingTransactionSchema], default: [] },
  },
  { timestamps: true }
);

ndisPlanSchema.index({ participant: 1, status: 1 });
ndisPlanSchema.index({ participant: 1, planNumber: 1 }, { unique: true });

ndisPlanSchema.methods.getFundingSummary = function getFundingSummary() {
  const categories = this.fundingCategories.map((category) => {
    const remaining = category.allocation - category.spentToDate;
    const usagePercentage = category.allocation === 0 ? 0 : (category.spentToDate / category.allocation) * 100;
    const percentageUsed = Math.round(usagePercentage);
    const overBudget = remaining < 0;
    const nearBudgetLimit = !overBudget && usagePercentage >= BUDGET_ALERT_THRESHOLD_PERCENTAGE;
    const budgetAlertLevel = overBudget ? 'overBudget' : nearBudgetLimit ? 'warning' : null;

    return {
      category: category.category,
      label: category.label,
      allocation: category.allocation,
      spentToDate: category.spentToDate,
      remaining,
      percentageUsed,
      overBudget,
      nearBudgetLimit,
      budgetAlertLevel,
    };
  });

  const totals = categories.reduce(
    (acc, category) => ({
      allocation: acc.allocation + category.allocation,
      spentToDate: acc.spentToDate + category.spentToDate,
      remaining: acc.remaining + category.remaining,
    }),
    { allocation: 0, spentToDate: 0, remaining: 0 }
  );

  return {
    planId: this._id.toString(),
    planNumber: this.planNumber,
    status: this.status,
    currency: this.currency,
    categories,
    totals,
    budgetAlertThresholdPercentage: BUDGET_ALERT_THRESHOLD_PERCENTAGE,
    budgetAlerts: categories.filter((category) => category.budgetAlertLevel),
  };
};

module.exports = mongoose.model('NdisPlan', ndisPlanSchema);
module.exports.FUNDING_CATEGORIES = FUNDING_CATEGORIES;
module.exports.FUNDING_CATEGORY_LABELS = FUNDING_CATEGORY_LABELS;
module.exports.PLAN_STATUSES = PLAN_STATUSES;
module.exports.BUDGET_ALERT_THRESHOLD_PERCENTAGE = BUDGET_ALERT_THRESHOLD_PERCENTAGE;
