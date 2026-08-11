const {
  SHIFT_NOTE_FIELDS,
  generateShiftNoteDraft,
  hasSupportedInput,
} = require('../services/shiftNoteDraft');

async function createShiftNoteDraft(req, res) {
  if (!hasSupportedInput(req.body)) {
    return res.status(400).json({
      error: 'At least one supplied shift-note detail is required',
      fields: SHIFT_NOTE_FIELDS,
    });
  }

  const draft = await generateShiftNoteDraft(req.body);

  res.status(201).json({
    fields: SHIFT_NOTE_FIELDS,
    boundary: draft.boundary,
    shiftNote: draft.shiftNote,
  });
}

module.exports = {
  createShiftNoteDraft,
};
