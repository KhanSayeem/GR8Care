const express = require('express');
const {
  approveProviderHandler,
  getPendingProviders,
  getStats,
  getUsers,
  rejectProviderHandler,
} = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', requireAuth, requireRole('admin'), getStats);
router.get('/users', requireAuth, requireRole('admin'), getUsers);
router.get('/providers/pending', requireAuth, requireRole('admin'), getPendingProviders);
router.post('/providers/:id/approve', requireAuth, requireRole('admin'), approveProviderHandler);
router.post('/providers/:id/reject', requireAuth, requireRole('admin'), rejectProviderHandler);

module.exports = router;
