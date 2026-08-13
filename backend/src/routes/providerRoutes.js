const express = require('express');
const { setMyAvailability } = require('../controllers/providerController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/me/availability', requireAuth, requireRole('provider', 'supportWorker'), setMyAvailability);

module.exports = router;
