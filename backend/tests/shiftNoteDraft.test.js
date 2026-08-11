const request = require('supertest');
const {
  SHIFT_NOTE_FIELDS,
  SHIFT_NOTE_SYSTEM_PROMPT,
  UNCERTAIN_VALUE,
  buildShiftNoteMessages,
  generateShiftNoteDraft,
} = require('../src/services/shiftNoteDraft');

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gr8care-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');

describe('shift note draft API', () => {
  it('uses a guarded system prompt for structured shift-note drafting', () => {
    expect(SHIFT_NOTE_SYSTEM_PROMPT).toContain('Do not invent activities');
    expect(SHIFT_NOTE_SYSTEM_PROMPT).toContain('fabricate records');
    expect(SHIFT_NOTE_SYSTEM_PROMPT).toContain('certify records');
    expect(SHIFT_NOTE_SYSTEM_PROMPT).toContain('unsupported facts');
    expect(SHIFT_NOTE_SYSTEM_PROMPT).toContain('return uncertainty');

    const messages = buildShiftNoteMessages({
      date: '2026-08-12',
      activities: ['Meal preparation', 'Community access'],
    });

    expect(messages[0]).toEqual({ role: 'system', content: SHIFT_NOTE_SYSTEM_PROMPT });
    expect(messages[1].content).toContain('Meal preparation; Community access');
  });

  it('normalizes missing draft fields to uncertainty instead of filling gaps', async () => {
    const draft = await generateShiftNoteDraft({
      date: '2026-08-12',
      activities: 'Meal preparation',
      participantEngagement: 'Participant chose the meal plan.',
    });

    expect(draft.shiftNote).toEqual({
      Date: '2026-08-12',
      Activities: 'Meal preparation',
      'Participant Engagement': 'Participant chose the meal plan.',
      Observations: UNCERTAIN_VALUE,
      Outcome: UNCERTAIN_VALUE,
    });
  });

  it('posts a structured shift-note draft with the required fields', async () => {
    const res = await request(app)
      .post('/shift-notes/draft')
      .send({
        date: '2026-08-12',
        activities: ['Transport to appointment'],
        participantEngagement: 'Participant confirmed the appointment goal.',
        observations: 'No incident reported by the worker.',
        outcome: 'Appointment attended.',
      });

    expect(res.status).toBe(201);
    expect(res.body.fields).toEqual(SHIFT_NOTE_FIELDS);
    expect(res.body.boundary).toContain('Do not invent activities');
    expect(res.body.shiftNote).toEqual({
      Date: '2026-08-12',
      Activities: 'Transport to appointment',
      'Participant Engagement': 'Participant confirmed the appointment goal.',
      Observations: 'No incident reported by the worker.',
      Outcome: 'Appointment attended.',
    });
  });

  it('rejects empty draft requests', async () => {
    const res = await request(app).post('/shift-notes/draft').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('At least one supplied shift-note detail is required');
    expect(res.body.fields).toEqual(SHIFT_NOTE_FIELDS);
  });
});
