const { getTierAccess } = require('../services/subscriptionAccess');
const { updateMyProfile } = require('../services/userProfile');

async function getMe(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

async function getMyAccess(req, res) {
  res.json({ access: getTierAccess(req.user.subscriptionTier) });
}

async function updateMe(req, res) {
  try {
    const result = await updateMyProfile(req.user._id, req.body);
    res.json(result);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({
        error: err.message,
        details: err.details,
      });
    }

    throw err;
  }
}

module.exports = { getMe, getMyAccess, updateMe };
