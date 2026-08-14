const {
  approveProvider,
  getPlatformStats,
  listPendingProviders,
  listUsers,
  rejectProvider,
} = require('../services/adminService');

async function getStats(req, res) {
  try {
    const result = await getPlatformStats();
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

async function getUsers(req, res) {
  try {
    const result = await listUsers({
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
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

async function getPendingProviders(req, res) {
  try {
    const result = await listPendingProviders();
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

async function approveProviderHandler(req, res) {
  try {
    const result = await approveProvider(req.params.id);
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

async function rejectProviderHandler(req, res) {
  try {
    const result = await rejectProvider(req.params.id);
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
  approveProviderHandler,
  getPendingProviders,
  getStats,
  getUsers,
  rejectProviderHandler,
};
