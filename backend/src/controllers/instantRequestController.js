const {
  acceptInstantRequest,
  createInstantRequest,
  declineInstantRequest,
  listInstantRequests,
} = require('../services/instantRequestService');

async function createInstantRequestHandler(req, res) {
  try {
    const result = await createInstantRequest(req.user, req.body, req.app.get('io'));
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

async function listInstantRequestsHandler(req, res) {
  try {
    const result = await listInstantRequests(req.user, {
      window: req.query.window,
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

async function acceptInstantRequestHandler(req, res) {
  try {
    const result = await acceptInstantRequest(req.user, req.params.id, req.body, req.app.get('io'));
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

async function declineInstantRequestHandler(req, res) {
  try {
    const result = await declineInstantRequest(req.user, req.params.id, req.body, req.app.get('io'));
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
  acceptInstantRequestHandler,
  createInstantRequestHandler,
  declineInstantRequestHandler,
  listInstantRequestsHandler,
};
