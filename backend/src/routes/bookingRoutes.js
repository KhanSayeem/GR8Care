const express = require('express');
const { createBookingRequest } = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createBookingRequest);

module.exports = router;
