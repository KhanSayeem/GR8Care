const { listConsents, recordConsent, revokeConsent } = require('../services/consent');

function handleKnownErrors(err, res) {
  if ([400, 403, 404, 409].includes(err.status)) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  throw err;
}

async function createConsent(req, res) {
  try {
    const result = await recordConsent(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    handleKnownErrors(err, res);
  }
}

async function getMyConsents(req, res) {
  try {
    const result = await listConsents(req.user, { purpose: req.query.purpose });
    res.json(result);
  } catch (err) {
    handleKnownErrors(err, res);
  }
}

async function revokeMyConsent(req, res) {
  try {
    const result = await revokeConsent(req.user, req.params.id);
    res.json(result);
  } catch (err) {
    handleKnownErrors(err, res);
  }
}

module.exports = { createConsent, getMyConsents, revokeMyConsent };
