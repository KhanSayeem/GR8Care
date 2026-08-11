const { EDUCATION_CATEGORIES } = require('../models/EducationContent');
const { EDUCATION_BOUNDARY, getContentById, listCategories, listContent } = require('../services/educationContent');

async function getEducationCategories(req, res) {
  res.json({
    boundary: EDUCATION_BOUNDARY,
    categories: listCategories(),
  });
}

async function getEducationContent(req, res) {
  const { category } = req.query;

  if (category && !EDUCATION_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Unsupported education category',
      categories: EDUCATION_CATEGORIES,
    });
  }

  res.json({
    boundary: EDUCATION_BOUNDARY,
    content: listContent({ category }),
  });
}

async function getEducationContentDetail(req, res) {
  const content = getContentById(req.params.id);

  if (!content) {
    return res.status(404).json({ error: 'Education content not found' });
  }

  res.json({
    boundary: EDUCATION_BOUNDARY,
    content,
  });
}

module.exports = {
  getEducationCategories,
  getEducationContent,
  getEducationContentDetail,
};
