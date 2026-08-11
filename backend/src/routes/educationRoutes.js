const express = require('express');
const {
  askKnowledgeAgent,
  getEducationCategories,
  getEducationContent,
  getEducationContentDetail,
  getKnowledgeIndex,
} = require('../controllers/educationController');

const router = express.Router();

router.get('/categories', getEducationCategories);
router.get('/knowledge-agent/index', getKnowledgeIndex);
router.post('/knowledge-agent/ask', askKnowledgeAgent);
router.get('/content', getEducationContent);
router.get('/content/:id', getEducationContentDetail);

module.exports = router;
