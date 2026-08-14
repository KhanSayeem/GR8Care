const express = require('express');
const {
  acceptInstantRequestHandler,
  createInstantRequestHandler,
  declineInstantRequestHandler,
  listInstantRequestsHandler,
} = require('../controllers/instantRequestController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listInstantRequestsHandler);
router.post('/', requireAuth, createInstantRequestHandler);
router.post('/:id/accept', requireAuth, acceptInstantRequestHandler);
router.post('/:id/decline', requireAuth, declineInstantRequestHandler);

module.exports = router;
