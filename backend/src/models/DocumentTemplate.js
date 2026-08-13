const mongoose = require('mongoose');

const DOCUMENT_TEMPLATE_CATEGORIES = [
  'Participant communication',
  'Worker documentation',
  'Provider operations',
];

const documentTemplateFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const documentTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: DOCUMENT_TEMPLATE_CATEGORIES, required: true },
    version: { type: String, default: '1.0', trim: true },
    fields: { type: [documentTemplateFieldSchema], default: [] },
    defaultBody: { type: String, required: true, trim: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DocumentTemplate', documentTemplateSchema);
module.exports.DOCUMENT_TEMPLATE_CATEGORIES = DOCUMENT_TEMPLATE_CATEGORIES;
