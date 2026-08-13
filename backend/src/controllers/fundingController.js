const {
  getFundingSummaryForUser,
  listFundingTransactionsForUser,
} = require('../services/funding');

async function getMyFundingSummary(req, res) {
  try {
    const result = await getFundingSummaryForUser(req.user._id);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.message,
        details: err.details,
      });
    }

    throw err;
  }
}

async function getMyFundingTransactions(req, res) {
  try {
    const result = await listFundingTransactionsForUser(req.user._id, {
      category: req.query.category,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.message,
        details: err.details,
      });
    }

    throw err;
  }
}

module.exports = {
  getMyFundingSummary,
  getMyFundingTransactions,
};
