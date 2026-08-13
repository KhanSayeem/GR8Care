const express = require('express');
const {
  cancelBookingRequest,
  createBookingRequest,
  getBookingRequest,
  listBookingRequests,
  updateBookingRequest,
} = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listBookingRequests);
router.post('/', requireAuth, createBookingRequest);
router.get('/:id', requireAuth, getBookingRequest);
router.patch('/:id', requireAuth, updateBookingRequest);
router.delete('/:id', requireAuth, cancelBookingRequest);

module.exports = router;
