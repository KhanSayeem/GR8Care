const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createConsent, getMyConsents, revokeMyConsent } = require('../controllers/consentController');

const router = express.Router();

router.get('/', requireAuth, getMyConsents);
router.post('/', requireAuth, createConsent);
router.post('/:id/revoke', requireAuth, revokeMyConsent);

module.exports = router;
