const express = require('express');
const { ZONES } = require('../config/zones');

const ZONE_BOUNDARY =
  'Zone language lists reflect the local Census language environment for each pilot area. They are not verified NDIS participant-language statistics.';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ mode: 'zones', boundary: ZONE_BOUNDARY, zones: ZONES });
});

module.exports = router;
