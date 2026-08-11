const mongoose = require('mongoose');

const EDUCATION_CATEGORIES = ['NDIS Basics', 'Funding Education', 'Support Education', 'Provider Education'];

const educationContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: EDUCATION_CATEGORIES, required: true },
    summary: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    language: { type: String, default: 'en', trim: true },
    readTimeMinutes: { type: Number, default: 4, min: 1 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EducationContent', educationContentSchema);
module.exports.EDUCATION_CATEGORIES = EDUCATION_CATEGORIES;
