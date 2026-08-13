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
  {
    preference: 'Preferred language and communication style',
    workerSignal: 'Bengali speaking and uses plain-language updates',
  },
  {
    preference: 'Support goal and daily routine fit',
    workerSignal: 'Community access and routine support experience',
  },
  {
    preference: 'Location, availability, and transport needs',
    workerSignal: 'Lakemba area and evening shift preference',
  },
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

export const educationCategoryGuides = [
  {
    name: 'NDIS Basics',
    audience: 'Participants and families',
    icon: 'compass',
    summary: 'Start with goals, plan language, and how everyday supports connect to participant choice.',
    framing: 'Use this category when someone needs plain-language context before a planning or service conversation.',
    quickAccess: 'Start with goals',
  },
  {
    name: 'Funding Education',
    audience: 'Participants and coordinators',
    icon: 'wallet',
    summary: 'Learn how to prepare examples, track support outcomes, and talk about changed needs.',
    framing: 'Use this category to prepare for funding conversations without treating the app as an approval channel.',
    quickAccess: 'Review funding prep',
  },
  {
    name: 'Support Education',
    audience: 'Support workers',
    icon: 'people',
    summary: 'Explain support practice, WHODAS language, daily functioning, and communication boundaries.',
    framing: 'Use this category for worker learning prompts and participant-facing explanations.',
    quickAccess: 'Explain supports',
  },
  {
    name: 'Provider Education',
    audience: 'Providers',
    icon: 'business',
    summary: 'Guide service-boundary conversations, consent reminders, and provider communication basics.',
    framing: 'Use this category for organisation-level education and clear next-step conversations.',
    quickAccess: 'Open provider guide',
  },
];

export const whodasDomains = [
  { title: 'Cognition', body: 'Understanding, learning, remembering, and communicating.' },
  { title: 'Mobility', body: 'Moving around at home, in the community, and between places.' },
  { title: 'Self-care', body: 'Personal care routines such as washing, dressing, and eating.' },
  { title: 'Getting along', body: 'Interacting with family, workers, providers, and community members.' },
  { title: 'Life activities', body: 'Home tasks, study, work, and other daily responsibilities.' },
  { title: 'Participation', body: 'Joining community, social, civic, and cultural life.' },
];

export const knowledgeAgentAnswer = {
  mode: 'Retrieval knowledge agent',
  question: 'What should I bring to a plan review?',
  sources: ['Preparing for plan review', 'Understanding NDIS goals'],
  citations: [
    { title: 'Preparing for plan review', category: 'Funding Education', sourceReference: 'Education library seed content', score: 'High relevance' },
    { title: 'Understanding NDIS goals', category: 'NDIS Basics', sourceReference: 'Education library seed content', score: 'Supporting context' },
  ],
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

export const compatibilityExamples = [
  {
    name: 'Sample worker profile A',
    compatibilityIndicator: 'Higher alignment',
    profileSignals: ['Bengali speaking', 'Community access', 'Evening shifts'],
  },
  {
    name: 'Sample worker profile B',
    compatibilityIndicator: 'Some alignment',
    profileSignals: ['Transport support', 'Goal tracking', 'Female worker preference'],
  },
  {
    name: 'Sample worker profile C',
    compatibilityIndicator: 'Limited alignment',
    profileSignals: ['Life skills', 'Weekend shifts', 'Progress notes'],
  },
];

export const fundingTransactions = [
  { label: 'Daily Living - Maria R.', date: '9 Jan 2025', amount: -95, tone: 'error' as const },
  { label: 'Speech Therapy - Aisha S.', date: '7 Jan 2025', amount: -110, tone: 'error' as const },
  { label: 'Transport assistance', date: '5 Jan 2025', amount: -42, tone: 'info' as const },
];

export type NotificationTone = 'teal' | 'warning' | 'success' | 'purple';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  category: string;
  icon: string;
  tone: NotificationTone;
  unread: boolean;
  meta: string;
}

export interface NotificationGroup {
  label: string;
  items: NotificationItem[];
}

export const notificationGroups: NotificationGroup[] = [
  {
    label: 'Today',
    items: [
      {
        id: 'provider-on-the-way',
        title: 'Provider on the way',
        body: 'Maria Rodriguez is 12 minutes away for community access support.',
        time: '2:48 PM',
        category: 'Booking',
        icon: 'navigate-circle',
        tone: 'teal' as const,
        unread: true,
        meta: 'Lakemba pickup',
      },
      {
        id: 'budget-alert',
        title: 'Budget alert',
        body: 'Capital Supports is tracking over allocation. Review before confirming more equipment costs.',
        time: '11:20 AM',
        category: 'Funding',
        icon: 'warning',
        tone: 'warning' as const,
        unread: true,
        meta: '$200 over',
      },
      {
        id: 'booking-confirmed',
        title: 'Booking confirmed',
        body: 'Occupational therapy with Aisha S. is confirmed for tomorrow at 10:00 AM.',
        time: '9:05 AM',
        category: 'Confirmed',
        icon: 'calendar',
        tone: 'success' as const,
        unread: false,
        meta: 'Tomorrow',
      },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      {
        id: 'ai-bot-suggestion',
        title: 'AI bot suggestion',
        body: 'Try the plan review guide before your next funding conversation.',
        time: '4:16 PM',
        category: 'Education',
        icon: 'school',
        tone: 'purple' as const,
        unread: true,
        meta: 'NDIS basics',
      },
    ],
  },
];
