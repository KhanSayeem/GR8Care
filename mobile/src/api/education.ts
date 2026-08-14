import { apiFetch } from './client';

export interface KnowledgeAgentCitation {
  id: string;
  title: string;
  category: string;
  sourceReference: string;
  score: number;
}

export interface KnowledgeAgentAnswer {
  mode: 'retrievalKnowledgeAgent';
  boundary: string;
  question: string;
  answer: string;
  citations: KnowledgeAgentCitation[];
  retrieval: {
    embeddingPath: string;
    matchCount: number;
  };
  guardrails: string[];
}

export async function askKnowledgeAgent(question: string) {
  return apiFetch('/education/knowledge-agent/ask', {
    method: 'POST',
    body: JSON.stringify({ question }),
  }) as Promise<KnowledgeAgentAnswer>;
}
