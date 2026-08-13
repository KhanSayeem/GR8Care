const { saveProviderAvailability } = require('../services/providerAvailability');

async function setMyAvailability(req, res) {
  try {
    const result = await saveProviderAvailability(req.user._id, req.body?.blocks);
    res.status(201).json(result);
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

module.exports = {
  setMyAvailability,
};
