const express = require('express');
const {
  exportTemplatePdf,
  fillTemplate,
  getDocumentTemplateDetail,
  getDocumentTemplates,
} = require('../controllers/documentTemplateController');

const router = express.Router();

router.get('/', getDocumentTemplates);
router.get('/:id', getDocumentTemplateDetail);
router.post('/:id/fill', fillTemplate);
router.post('/:id/export.pdf', exportTemplatePdf);

module.exports = router;
