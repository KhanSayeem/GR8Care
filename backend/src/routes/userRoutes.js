const express = require('express');
const { getMe, getMyAccess } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, getMe);
router.get('/me/access', requireAuth, getMyAccess);

module.exports = router;
