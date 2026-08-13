const mongoose = require('mongoose');
const { FUNDING_CATEGORIES } = require('./NdisPlan');

const GOAL_STATUSES = ['notStarted', 'inProgress', 'achieved', 'paused'];

const goalSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NdisPlan',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: GOAL_STATUSES, default: 'inProgress', index: true },
    linkedFundingCategories: { type: [String], enum: FUNDING_CATEGORIES, default: [] },
    supports: { type: [String], default: [] },
    targetDate: { type: Date },
  },
  { timestamps: true }
);

goalSchema.index({ participant: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
module.exports.GOAL_STATUSES = GOAL_STATUSES;
