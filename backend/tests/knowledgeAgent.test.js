const request = require('supertest');
const {
  KNOWLEDGE_AGENT_BOUNDARY,
  answerKnowledgeQuestion,
  buildEducationKnowledgeIndex,
  retrieveEducationContent,
} = require('../src/services/knowledgeAgent');

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gr8care-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/app');

describe('knowledge agent RAG backend', () => {
  it('builds a token embedding index over education content', () => {
    const index = buildEducationKnowledgeIndex();

    expect(index).toHaveLength(4);
    expect(index[0]).toEqual(
      expect.objectContaining({
        sourceReference: expect.stringContaining('education-content:'),
        embeddingPath: expect.stringContaining('/token-embedding'),
      })
    );
    expect(Object.keys(index[0].embedding).length).toBeGreaterThan(0);
  });

  it('retrieves education content and answers with citations', () => {
    const answer = answerKnowledgeQuestion('What should I bring to a plan review?');

    expect(answer.mode).toBe('retrievalKnowledgeAgent');
    expect(answer.boundary).toBe(KNOWLEDGE_AGENT_BOUNDARY);
    expect(answer.boundary).toContain('not legal advice');
    expect(answer.boundary).toContain('not funding approval');
    expect(answer.boundary).toContain('not individual NDIA decision interpretation');
    expect(answer.boundary).toContain('not an official NDIA channel');
    expect(answer.citations[0]).toEqual(
      expect.objectContaining({
        id: 'preparing-for-plan-review',
        title: 'Preparing for plan review',
        sourceReference: 'education-content:preparing-for-plan-review',
      })
    );
    expect(answer.answer).toContain('Bring examples');
  });

  it('returns no citations when retrieval does not find indexed sources', () => {
    const matches = retrieveEducationContent('unrelated zebra topic');
    const answer = answerKnowledgeQuestion('unrelated zebra topic');

    expect(matches).toHaveLength(0);
    expect(answer.citations).toHaveLength(0);
    expect(answer.answer).toContain('could not find enough matching');
  });

  it('exposes index and ask endpoints separately from chatbot flow', async () => {
    const indexRes = await request(app).get('/education/knowledge-agent/index');
    const askRes = await request(app)
      .post('/education/knowledge-agent/ask')
      .send({ question: 'How do providers explain service boundaries?' });

    expect(indexRes.status).toBe(200);
    expect(indexRes.body.mode).toBe('retrievalKnowledgeAgent');
    expect(indexRes.body.index[0]).toEqual(
      expect.objectContaining({
        embeddingPath: expect.stringContaining('/token-embedding'),
        embeddingTerms: expect.any(Array),
      })
    );
    expect(indexRes.body.index[0].embedding).toBeUndefined();

    expect(askRes.status).toBe(200);
    expect(askRes.body.mode).toBe('retrievalKnowledgeAgent');
    expect(askRes.body.citations[0]).toEqual(
      expect.objectContaining({
        id: 'provider-communication-basics',
      })
    );
  });

  it('rejects empty knowledge-agent questions', async () => {
    const res = await request(app).post('/education/knowledge-agent/ask').send({ question: ' ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('question is required');
  });
});
