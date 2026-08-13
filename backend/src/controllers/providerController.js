const { getProviderSchedule, getProviderScheduleToday, getProviderStats } = require('../services/providerDashboard');
const { getProviderAvailability, saveProviderAvailability } = require('../services/providerAvailability');

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

async function getProviderAvailabilityById(req, res) {
  try {
    const result = await getProviderAvailability(req.params.id, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json(result);
  } catch (err) {
    if ([400, 404].includes(err.status)) {
      return res.status(err.status).json({ error: err.message });
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
  getProviderAvailabilityById,
  getMySchedule,
  getMyScheduleToday,
  getMyStats,
  setMyAvailability,
};
