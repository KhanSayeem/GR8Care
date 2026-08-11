export const careSummary = {
  participantName: 'Amina Rahman',
  planWindow: 'Aug 2026',
  activeGoal: 'Build confidence with community access',
  nextVisit: 'Today, 3:30 PM',
  weeklyHours: 14,
};

export const fundingCategories = [
  {
    label: 'Core Supports',
    allocation: 18000,
    used: 8240,
    tone: 'teal-dark' as const,
  },
  {
    label: 'Capacity Building',
    allocation: 8500,
    used: 3100,
    tone: 'provider-green' as const,
  },
  {
    label: 'Capital Supports',
    allocation: 5000,
    used: 5200,
    tone: 'error' as const,
  },
];

export const shiftTasks = [
  { label: 'Morning check-in', status: 'Complete', tone: 'success' as const },
  { label: 'Transport to appointment', status: 'Next', tone: 'info' as const },
  { label: 'Progress note', status: 'Draft', tone: 'warning' as const },
];

export const wellnessItems = [
  {
    title: 'Two-minute reset',
    body: 'Breathing prompt for support workers between appointments.',
    tag: 'Wellbeing',
  },
  {
    title: 'Boundary reminder',
    body: 'Short checklist before responding to after-hours messages.',
    tag: 'Practice',
  },
  {
    title: 'Escalation cue',
    body: 'When risk is mentioned, pause and follow provider policy.',
    tag: 'Safety',
  },
];

export const educationTopics = [
  {
    title: 'Understanding NDIS goals',
    category: 'Participant basics',
    readTime: '4 min',
    summary: 'Plain-language guide to turning support needs into goals.',
  },
  {
    title: 'WHODAS overview',
    category: 'Assessment',
    readTime: '6 min',
    summary: 'What the domains mean and how support teams can explain them.',
  },
  {
    title: 'Preparing for plan review',
    category: 'Planning',
    readTime: '5 min',
    summary: 'Documents, examples, and outcomes to collect before review day.',
  },
];

export const providerMatches = [
  {
    name: 'CareBridge Community Support',
    match: 94,
    location: 'Lakemba',
    strengths: ['Bengali speaking', 'Community access', 'Evening shifts'],
  },
  {
    name: 'Northside Allied Care',
    match: 88,
    location: 'Parramatta',
    strengths: ['Transport', 'Goal tracking', 'Female staff available'],
  },
  {
    name: 'Everyday Skills Hub',
    match: 81,
    location: 'Bankstown',
    strengths: ['Life skills', 'Weekend availability', 'Reports'],
  },
];

export const fundingTransactions = [
  { label: 'Daily Living - Maria R.', date: '9 Jan 2025', amount: -95, tone: 'error' as const },
  { label: 'Speech Therapy - Aisha S.', date: '7 Jan 2025', amount: -110, tone: 'error' as const },
  { label: 'Transport assistance', date: '5 Jan 2025', amount: -42, tone: 'info' as const },
];
