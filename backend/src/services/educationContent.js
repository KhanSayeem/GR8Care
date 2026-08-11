const { EDUCATION_CATEGORIES } = require('../models/EducationContent');

const EDUCATION_BOUNDARY =
  'Educational information only. This is not official NDIA advice, not legal advice, not clinical advice, and not funding approval.';

const SEEDED_EDUCATION_CONTENT = [
  {
    id: 'understanding-ndis-goals',
    title: 'Understanding NDIS goals',
    category: 'NDIS Basics',
    summary: 'Plain-language guide to turning support needs into goals.',
    body: 'Goals describe what a participant wants to work toward. Supports should connect back to those goals and be reviewed with the participant and their trusted supporters.',
    language: 'en',
    readTimeMinutes: 4,
  },
  {
    id: 'preparing-for-plan-review',
    title: 'Preparing for plan review',
    category: 'Funding Education',
    summary: 'Documents, examples, and outcomes to collect before review day.',
    body: 'Bring examples, invoices, reports, and plain notes about what has changed. Use official NDIA channels for funding decisions or plan changes.',
    language: 'en',
    readTimeMinutes: 5,
  },
  {
    id: 'whodas-overview',
    title: 'WHODAS overview',
    category: 'Support Education',
    summary: 'What the domains mean and how support teams can explain them.',
    body: 'WHODAS language can help people talk about daily functioning, but this app does not score, diagnose, or replace a qualified assessment.',
    language: 'en',
    readTimeMinutes: 6,
  },
  {
    id: 'provider-communication-basics',
    title: 'Provider communication basics',
    category: 'Provider Education',
    summary: 'How providers can explain service boundaries and next steps clearly.',
    body: 'Use plain language, confirm consent, and explain where official provider policies or NDIA channels are required.',
    language: 'en',
    readTimeMinutes: 3,
  },
];

function withBoundary(content) {
  return {
    ...content,
    boundary: EDUCATION_BOUNDARY,
  };
}

function listCategories() {
  return EDUCATION_CATEGORIES.map((category) => ({
    category,
    count: SEEDED_EDUCATION_CONTENT.filter((content) => content.category === category).length,
    boundary: EDUCATION_BOUNDARY,
  }));
}

function listContent({ category } = {}) {
  return SEEDED_EDUCATION_CONTENT.filter((content) => !category || content.category === category).map(withBoundary);
}

function getContentById(id) {
  const content = SEEDED_EDUCATION_CONTENT.find((item) => item.id === id);
  return content ? withBoundary(content) : null;
}

module.exports = {
  EDUCATION_BOUNDARY,
  SEEDED_EDUCATION_CONTENT,
  getContentById,
  listCategories,
  listContent,
};
