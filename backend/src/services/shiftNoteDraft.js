const SHIFT_NOTE_FIELDS = [
  'Date',
  'Activities',
  'Participant Engagement',
  'Observations',
  'Outcome',
];

const UNCERTAIN_VALUE = 'Uncertain from supplied shift details.';

const SHIFT_NOTE_SYSTEM_PROMPT = [
  'You draft Support Worker shift notes from supplied worker notes only.',
  'Return a JSON object with exactly these fields: Date, Activities, Participant Engagement, Observations, and Outcome.',
  'Do not invent activities, fabricate records, certify records, or add unsupported facts.',
  'If a field is missing, unclear, or unsupported by the supplied notes, return uncertainty instead of filling the gap.',
  'Do not present the draft as an official record, compliance document, audit document, certification, clinical assessment, legal advice, or NDIS decision.',
].join(' ');

function normalizeValue(value) {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned.join('; ') : UNCERTAIN_VALUE;
  }

  if (value === null || value === undefined) {
    return UNCERTAIN_VALUE;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : UNCERTAIN_VALUE;
}

function normalizeShiftNote(note = {}) {
  return {
    Date: normalizeValue(note.Date ?? note.date),
    Activities: normalizeValue(note.Activities ?? note.activities),
    'Participant Engagement': normalizeValue(
      note['Participant Engagement'] ?? note.participantEngagement
    ),
    Observations: normalizeValue(note.Observations ?? note.observations),
    Outcome: normalizeValue(note.Outcome ?? note.outcome),
  };
}

function buildShiftNoteUserPrompt(input = {}) {
  const note = normalizeShiftNote(input);
  const sourceText = normalizeValue(input.sourceText ?? input.notes ?? input.transcript);

  return [
    'Draft a structured shift note from these supplied details.',
    `Date: ${note.Date}`,
    `Activities: ${note.Activities}`,
    `Participant Engagement: ${note['Participant Engagement']}`,
    `Observations: ${note.Observations}`,
    `Outcome: ${note.Outcome}`,
    `Source notes: ${sourceText}`,
  ].join('\n');
}

function buildShiftNoteMessages(input = {}) {
  return [
    { role: 'system', content: SHIFT_NOTE_SYSTEM_PROMPT },
    { role: 'user', content: buildShiftNoteUserPrompt(input) },
  ];
}

function hasSupportedInput(input = {}) {
  return [
    input.date,
    input.activities,
    input.participantEngagement,
    input.observations,
    input.outcome,
    input.sourceText,
    input.notes,
    input.transcript,
  ].some((value) => normalizeValue(value) !== UNCERTAIN_VALUE);
}

async function generateShiftNoteDraft(input = {}, aiClient = null) {
  const messages = buildShiftNoteMessages(input);

  if (aiClient && typeof aiClient.generateShiftNote === 'function') {
    const aiDraft = await aiClient.generateShiftNote({
      messages,
      fields: SHIFT_NOTE_FIELDS,
      uncertaintyValue: UNCERTAIN_VALUE,
    });

    return {
      boundary: SHIFT_NOTE_SYSTEM_PROMPT,
      messages,
      shiftNote: normalizeShiftNote(aiDraft),
    };
  }

  return {
    boundary: SHIFT_NOTE_SYSTEM_PROMPT,
    messages,
    shiftNote: normalizeShiftNote(input),
  };
}

module.exports = {
  SHIFT_NOTE_FIELDS,
  SHIFT_NOTE_SYSTEM_PROMPT,
  UNCERTAIN_VALUE,
  buildShiftNoteMessages,
  buildShiftNoteUserPrompt,
  generateShiftNoteDraft,
  hasSupportedInput,
  normalizeShiftNote,
};
