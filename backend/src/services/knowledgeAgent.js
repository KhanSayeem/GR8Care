const { listContent } = require('./educationContent');

const KNOWLEDGE_AGENT_BOUNDARY =
  'Retrieval-backed education answer only. This is not legal advice, not funding approval, not individual NDIA decision interpretation, and not an official NDIA channel.';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'the',
  'to',
  'what',
  'when',
  'where',
  'with',
]);

function tokenize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function createTokenEmbedding(text = '') {
  return tokenize(text).reduce((embedding, token) => {
    embedding[token] = (embedding[token] || 0) + 1;
    return embedding;
  }, {});
}

function dotProduct(left, right) {
  return Object.entries(left).reduce((score, [token, value]) => score + value * (right[token] || 0), 0);
}

function magnitude(embedding) {
  return Math.sqrt(Object.values(embedding).reduce((total, value) => total + value * value, 0));
}

function cosineSimilarity(left, right) {
  const denominator = magnitude(left) * magnitude(right);
  return denominator === 0 ? 0 : dotProduct(left, right) / denominator;
}

function buildEducationKnowledgeIndex(content = listContent()) {
  return content.map((item) => {
    const sourceText = [item.title, item.category, item.summary, item.body].join(' ');

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      sourceReference: `education-content:${item.id}`,
      embeddingPath: `education-content/${item.id}/token-embedding`,
      embedding: createTokenEmbedding(sourceText),
      summary: item.summary,
      body: item.body,
      boundary: item.boundary,
    };
  });
}

function retrieveEducationContent(question, { limit = 2, index = buildEducationKnowledgeIndex() } = {}) {
  const questionEmbedding = createTokenEmbedding(question);

  return index
    .map((item) => ({
      ...item,
      score: Number(cosineSimilarity(questionEmbedding, item.embedding).toFixed(4)),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function buildCitations(matches) {
  return matches.map((match) => ({
    id: match.id,
    title: match.title,
    category: match.category,
    sourceReference: match.sourceReference,
    score: match.score,
  }));
}

function generateAnswerText(matches) {
  if (matches.length === 0) {
    return 'I could not find enough matching education-library content to answer from the indexed sources. Use official NDIA channels for decisions, plan changes, or individual funding questions.';
  }

  const sourceList = matches.map((match) => match.title).join(' and ');
  const evidence = matches.map((match) => match.body).join(' ');

  return `Based on ${sourceList}: ${evidence}`;
}

function answerKnowledgeQuestion(question, options = {}) {
  const trimmedQuestion = String(question || '').trim();
  const matches = retrieveEducationContent(trimmedQuestion, options);
  const citations = buildCitations(matches);

  return {
    mode: 'retrievalKnowledgeAgent',
    boundary: KNOWLEDGE_AGENT_BOUNDARY,
    question: trimmedQuestion,
    answer: generateAnswerText(matches),
    citations,
    retrieval: {
      embeddingPath: 'education-content/*/token-embedding',
      matchCount: matches.length,
    },
    guardrails: [
      'No legal advice',
      'No funding approval',
      'No individual NDIA decision interpretation',
      'No official-channel claims',
    ],
  };
}

module.exports = {
  KNOWLEDGE_AGENT_BOUNDARY,
  answerKnowledgeQuestion,
  buildEducationKnowledgeIndex,
  createTokenEmbedding,
  retrieveEducationContent,
  tokenize,
};
