const { createBooking } = require('../services/bookingService');

async function createBookingRequest(req, res) {
  try {
    const result = await createBooking(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    if ([400, 403, 404, 409].includes(err.status)) {
      return res.status(err.status).json({
        error: err.message,
        details: err.details,
      });
    }

    throw err;
  }
}

module.exports = {
  createBookingRequest,
};
