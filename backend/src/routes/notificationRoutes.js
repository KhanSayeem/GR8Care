const express = require('express');
const {
  getMyNotifications,
  markMyNotificationsRead,
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getMyNotifications);
router.patch('/mark-read', requireAuth, markMyNotificationsRead);

module.exports = router;
