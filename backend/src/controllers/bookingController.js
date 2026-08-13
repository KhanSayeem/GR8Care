const { cancelBooking, createBooking, listBookings } = require('../services/bookingService');

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

async function listBookingRequests(req, res) {
  try {
    const result = await listBookings(req.user, {
      window: req.query.window,
      status: req.query.status,
      asOf: req.query.asOf,
    });
    res.json(result);
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

async function cancelBookingRequest(req, res) {
  try {
    const result = await cancelBooking(req.user, req.params.id, req.body);
    res.json(result);
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
  cancelBookingRequest,
  createBookingRequest,
  listBookingRequests,
};
