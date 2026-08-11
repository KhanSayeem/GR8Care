const express = require('express');
const { createShiftNoteDraft } = require('../controllers/shiftNoteController');

const router = express.Router();

router.post('/draft', createShiftNoteDraft);

module.exports = router;
