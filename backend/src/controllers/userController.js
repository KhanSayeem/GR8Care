async function getMe(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

module.exports = { getMe };
