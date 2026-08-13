const express = require('express');
const {
  getMyFundingSummary,
  getMyFundingTransactions,
} = require('../controllers/fundingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', requireAuth, getMyFundingSummary);
router.get('/transactions', requireAuth, getMyFundingTransactions);

module.exports = router;
