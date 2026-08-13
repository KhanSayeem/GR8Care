const express = require('express');
const { getMyScheduleToday, getMyStats, setMyAvailability } = require('../controllers/providerController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/me/stats', requireAuth, requireRole('provider', 'supportWorker'), getMyStats);
router.get('/me/schedule-today', requireAuth, requireRole('provider', 'supportWorker'), getMyScheduleToday);
router.post('/me/availability', requireAuth, requireRole('provider', 'supportWorker'), setMyAvailability);

module.exports = router;
