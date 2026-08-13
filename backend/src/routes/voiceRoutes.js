const express = require('express');
const { orchestrateVoice } = require('../controllers/voiceController');

const router = express.Router();

router.post('/orchestrate', orchestrateVoice);

module.exports = router;
