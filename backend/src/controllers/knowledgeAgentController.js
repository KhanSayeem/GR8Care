const {
  KNOWLEDGE_AGENT_BOUNDARY,
  answerKnowledgeQuestion,
  buildEducationKnowledgeIndex,
} = require('../services/knowledgeAgent');

async function getKnowledgeIndex(req, res) {
  const index = buildEducationKnowledgeIndex().map(({ embedding, ...item }) => ({
    ...item,
    embeddingTerms: Object.keys(embedding).sort(),
  }));

  res.json({
    mode: 'retrievalKnowledgeAgent',
    boundary: KNOWLEDGE_AGENT_BOUNDARY,
    index,
  });
}

async function askKnowledgeAgent(req, res) {
  const { question } = req.body;

  if (!question || String(question).trim().length === 0) {
    return res.status(400).json({ error: 'question is required' });
  }

  res.json(answerKnowledgeQuestion(question));
}

module.exports = {
  askKnowledgeAgent,
  getKnowledgeIndex,
};
