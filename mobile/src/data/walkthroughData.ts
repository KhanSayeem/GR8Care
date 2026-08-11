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

export const workforceResources = [
  {
    title: 'Ask S-TRAH AI',
    body: 'Plain-language education answers for support questions.',
    tag: 'Education',
  },
  {
    title: 'Shift Note AI',
    body: 'Capture, review, and copy a worker-owned draft.',
    tag: 'Drafting',
  },
  {
    title: 'Template examples',
    body: 'Example structures for notes, messages, and education guides.',
    tag: 'Examples',
  },
  {
    title: 'Workforce prompts',
    body: 'Boundary, escalation, and communication reminders.',
    tag: 'Practice',
  },
];

export const subscriptionAccessTiers = [
  {
    tier: 'Starter',
    summary: 'Education library and account basics.',
    enabled: true,
  },
  {
    tier: 'Growth',
    summary: 'Shift Note AI drafts and compatibility demo access.',
    enabled: true,
  },
  {
    tier: 'Enterprise',
    summary: 'Admin reporting exports for later rollout.',
    enabled: false,
  },
];

export const templateExamples = [
  {
    title: 'Shift note structure example',
    category: 'Worker documentation',
    summary: 'Shows headings for what happened, participant response, and follow-up action.',
  },
  {
    title: 'Family communication example',
    category: 'Communication',
    summary: 'Plain-language message format for non-urgent support updates.',
  },
  {
    title: 'NDIS education guide example',
    category: 'Education',
    summary: 'Simple outline for explaining goals, supports, and plan review preparation.',
  },
];

export const compatibilityQuestions = [
  'Preferred language and communication style',
  'Support goal and daily routine fit',
  'Location, availability, and transport needs',
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

export const calmingAudioItem = {
  title: 'Two-minute calming audio',
  duration: '2 min',
  body: 'Optional breathing reset for support workers between appointments.',
  boundary: 'Non-clinical support only. Not therapy, diagnosis, crisis support, or emergency help.',
};

export const educationTopics = [
  {
    title: 'Understanding NDIS goals',
    category: 'NDIS Basics',
    readTime: '4 min',
    language: 'English, Bengali available',
    summary: 'Plain-language guide to turning support needs into goals.',
    detail:
      'Goals describe what a participant wants to work toward. Supports should connect back to those goals and be reviewed with the participant and their trusted supporters.',
  },
  {
    title: 'WHODAS overview',
    category: 'Support Education',
    readTime: '6 min',
    language: 'English',
    summary: 'What the domains mean and how support teams can explain them.',
    detail:
      'WHODAS language can help people talk about daily functioning, but this app does not score, diagnose, or replace a qualified assessment.',
  },
  {
    title: 'Preparing for plan review',
    category: 'Funding Education',
    readTime: '5 min',
    language: 'English, Arabic available',
    summary: 'Documents, examples, and outcomes to collect before review day.',
    detail:
      'Bring examples, invoices, reports, and plain notes about what has changed. This guide is education only and does not approve funding.',
  },
  {
    title: 'Provider communication basics',
    category: 'Provider Education',
    readTime: '3 min',
    language: 'English',
    summary: 'How providers can explain service boundaries and next steps clearly.',
    detail:
      'Use plain language, confirm consent, and explain where official provider policies or NDIA channels are required.',
  },
];

export const educationCategories = ['NDIS Basics', 'Funding Education', 'Support Education', 'Provider Education'];

export const whodasDomains = [
  { title: 'Cognition', body: 'Understanding, learning, remembering, and communicating.' },
  { title: 'Mobility', body: 'Moving around at home, in the community, and between places.' },
  { title: 'Self-care', body: 'Personal care routines such as washing, dressing, and eating.' },
  { title: 'Getting along', body: 'Interacting with family, workers, providers, and community members.' },
  { title: 'Life activities', body: 'Home tasks, study, work, and other daily responsibilities.' },
  { title: 'Participation', body: 'Joining community, social, civic, and cultural life.' },
];

export const knowledgeAgentAnswer = {
  question: 'What should I bring to a plan review?',
  sources: ['Preparing for plan review', 'Understanding NDIS goals'],
  answer:
    'Bring examples of support outcomes, invoices, reports, and notes about changed needs. Use official NDIA channels for decisions or plan changes.',
};

export const educationChatbotLanguages = [
  {
    code: 'en',
    label: 'English',
    promptLabel: 'Spoken question in English',
    question: 'What should I bring to a plan review?',
    answer:
      'Bring examples of support outcomes, invoices, reports, and notes about changed needs. Use official NDIA channels for decisions or plan changes.',
    readAloudLabel: 'Hear answer in English',
    stopReadAloudLabel: 'Stop English read-aloud',
    readAloudStatus: 'Playing the answer in English.',
    textAlign: 'left' as const,
    writingDirection: 'ltr' as const,
  },
  {
    code: 'ar',
    label: 'Arabic',
    promptLabel: 'سؤال منطوق بالعربية',
    question: 'ماذا يجب أن أحضر إلى مراجعة الخطة؟',
    answer:
      'أحضر أمثلة على نتائج الدعم والفواتير والتقارير وملاحظات عن الاحتياجات التي تغيرت. استخدم قنوات NDIA الرسمية للقرارات أو تغييرات الخطة.',
    readAloudLabel: 'استمع إلى الإجابة بالعربية',
    stopReadAloudLabel: 'إيقاف القراءة بالعربية',
    readAloudStatus: 'يتم تشغيل الإجابة بالعربية.',
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  {
    code: 'vi',
    label: 'Vietnamese',
    promptLabel: 'Câu hỏi nói bằng tiếng Việt',
    question: 'Tôi nên mang theo gì khi đánh giá lại kế hoạch?',
    answer:
      'Hãy mang theo ví dụ về kết quả hỗ trợ, hóa đơn, báo cáo và ghi chú về các nhu cầu đã thay đổi. Hãy dùng các kênh NDIA chính thức cho quyết định hoặc thay đổi kế hoạch.',
    readAloudLabel: 'Nghe câu trả lời bằng tiếng Việt',
    stopReadAloudLabel: 'Dừng đọc tiếng Việt',
    readAloudStatus: 'Đang phát câu trả lời bằng tiếng Việt.',
    textAlign: 'left' as const,
    writingDirection: 'ltr' as const,
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
