const { DOCUMENT_TEMPLATE_CATEGORIES } = require('../models/DocumentTemplate');
const {
  DOCUMENT_TEMPLATE_BOUNDARY,
  exportFilledTemplatePdf,
  fillDocumentTemplate,
  getDocumentTemplateById,
  listDocumentTemplates,
} = require('../services/documentTemplates');

async function getDocumentTemplates(req, res) {
  const { category } = req.query;

  if (category && !DOCUMENT_TEMPLATE_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Unsupported document template category',
      categories: DOCUMENT_TEMPLATE_CATEGORIES,
    });
  }

  res.json({
    boundary: DOCUMENT_TEMPLATE_BOUNDARY,
    templates: listDocumentTemplates({ category }),
  });
}

async function getDocumentTemplateDetail(req, res) {
  const template = getDocumentTemplateById(req.params.id);

  if (!template) {
    return res.status(404).json({ error: 'Document template not found' });
  }

  res.json({
    boundary: DOCUMENT_TEMPLATE_BOUNDARY,
    template,
  });
}

async function fillTemplate(req, res) {
  const filledTemplate = fillDocumentTemplate(req.params.id, req.body?.values || {});

  if (!filledTemplate) {
    return res.status(404).json({ error: 'Document template not found' });
  }

  res.status(201).json(filledTemplate);
}

async function exportTemplatePdf(req, res) {
  const exportResult = exportFilledTemplatePdf(req.params.id, req.body?.values || {});

  if (!exportResult) {
    return res.status(404).json({ error: 'Document template not found' });
  }

  res
    .status(201)
    .set('Content-Type', 'application/pdf')
    .set('Content-Disposition', `attachment; filename="${exportResult.filename}"`)
    .send(exportResult.pdf);
}

module.exports = {
  exportTemplatePdf,
  fillTemplate,
  getDocumentTemplateDetail,
  getDocumentTemplates,
};
