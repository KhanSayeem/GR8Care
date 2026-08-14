const express = require('express');
const {
  getMyAvailabilityHandler,
  getMyProviderProfileHandler,
  getProviderAvailabilityById,
  getProviderByIdHandler,
  getMySchedule,
  getMyScheduleToday,
  getMyStats,
  listProvidersHandler,
  setMyAvailability,
  setMyProviderProfileHandler,
} = require('../controllers/providerController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listProvidersHandler);
router.get('/me/profile', requireAuth, requireRole('provider'), getMyProviderProfileHandler);
router.post('/me/profile', requireAuth, requireRole('provider'), setMyProviderProfileHandler);
router.get('/me/stats', requireAuth, requireRole('provider', 'supportWorker'), getMyStats);
router.get('/me/schedule', requireAuth, requireRole('provider', 'supportWorker'), getMySchedule);
router.get('/me/schedule-today', requireAuth, requireRole('provider', 'supportWorker'), getMyScheduleToday);
router.get('/me/availability', requireAuth, requireRole('provider', 'supportWorker'), getMyAvailabilityHandler);
router.post('/me/availability', requireAuth, requireRole('provider', 'supportWorker'), setMyAvailability);
router.get('/:id/availability', requireAuth, getProviderAvailabilityById);
router.get('/:id', requireAuth, getProviderByIdHandler);

module.exports = router;
