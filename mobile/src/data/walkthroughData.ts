export const careSummary = {
  participantName: 'Amina Rahman',
  planWindow: 'Aug 2026',
  activeGoal: 'Build confidence with community access',
  nextVisit: 'Today, 3:30 PM',
  fundingUsed: 0.58,
  weeklyHours: 14,
};

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
  { label: 'Community access support', date: 'Aug 02', amount: '$420', tone: 'success' as const },
  { label: 'Transport assistance', date: 'Jul 30', amount: '$86', tone: 'info' as const },
  { label: 'Budget threshold review', date: 'Jul 28', amount: '72%', tone: 'warning' as const },
];
