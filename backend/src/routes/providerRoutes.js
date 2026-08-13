const express = require('express');
const {
  getProviderAvailabilityById,
  getMySchedule,
  getMyScheduleToday,
  getMyStats,
  setMyAvailability,
} = require('../controllers/providerController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/me/stats', requireAuth, requireRole('provider', 'supportWorker'), getMyStats);
router.get('/me/schedule', requireAuth, requireRole('provider', 'supportWorker'), getMySchedule);
router.get('/me/schedule-today', requireAuth, requireRole('provider', 'supportWorker'), getMyScheduleToday);
router.post('/me/availability', requireAuth, requireRole('provider', 'supportWorker'), setMyAvailability);
router.get('/:id/availability', requireAuth, getProviderAvailabilityById);

module.exports = router;
