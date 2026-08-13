const { getProviderSchedule, getProviderScheduleToday, getProviderStats } = require('../services/providerDashboard');
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

async function getMyStats(req, res) {
  const result = await getProviderStats(req.user);
  res.json(result);
}

async function getMyScheduleToday(req, res) {
  try {
    const result = await getProviderScheduleToday(req.user._id, { date: req.query.date });
    res.json(result);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }

    throw err;
  }
}

async function getMySchedule(req, res) {
  try {
    const result = await getProviderSchedule(req.user._id, {
      date: req.query.date,
      range: req.query.range,
    });
    res.json(result);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: err.message });
    }

    throw err;
  }
}

module.exports = {
  getMySchedule,
  getMyScheduleToday,
  getMyStats,
  setMyAvailability,
};
