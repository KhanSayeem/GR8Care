const { getTierAccess } = require('../services/subscriptionAccess');

async function getMe(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

async function getMyAccess(req, res) {
  res.json({ access: getTierAccess(req.user.subscriptionTier) });
}

module.exports = { getMe, getMyAccess };
