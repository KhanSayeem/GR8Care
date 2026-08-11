const express = require('express');
const {
  getEducationCategories,
  getEducationContent,
  getEducationContentDetail,
} = require('../controllers/educationController');

const router = express.Router();

router.get('/categories', getEducationCategories);
router.get('/content', getEducationContent);
router.get('/content/:id', getEducationContentDetail);

module.exports = router;
