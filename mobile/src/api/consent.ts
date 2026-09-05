import { apiFetch } from './client';

export type ConsentPurpose =
  | 'providerDiscovery'
  | 'providerContact'
  | 'dataSharing'
  | 'aiTranslation'
  | 'voiceInputProcessing'
  | 'documentation';

export type ConsentDecision = 'granted' | 'revoked';

export interface ConsentRecord {
  id: string;
  purpose: ConsentPurpose;
  decision: ConsentDecision;
  scope: string[];
  recipients: string[];
  reason: string;
  decidedAt: string;
  revokedAt: string | null;
}

export interface ConsentListResponse {
  mode: string;
  boundary: string;
  consents: ConsentRecord[];
}

export interface ConsentWriteResponse {
  mode: string;
  boundary: string;
  consent: ConsentRecord;
}

export async function getConsents(purpose?: ConsentPurpose) {
  const query = purpose ? `?purpose=${encodeURIComponent(purpose)}` : '';
  return apiFetch(`/consent${query}`) as Promise<ConsentListResponse>;
}

export async function grantConsent(input: {
  purpose: ConsentPurpose;
  scope: string[];
  recipients: string[];
  reason?: string;
}) {
  return apiFetch('/consent', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<ConsentWriteResponse>;
}

export async function revokeConsent(id: string) {
  return apiFetch(`/consent/${id}/revoke`, { method: 'POST' }) as Promise<ConsentWriteResponse>;
}
