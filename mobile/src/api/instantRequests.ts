import { apiFetch } from './client';

export type InstantRequestStatus = 'submitted' | 'accepted' | 'declined' | 'expired';
export type InstantRequestWindow = 'live' | 'past' | 'all';

export interface InstantRequestParticipant {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export interface InstantRequestRecord {
  id: string;
  participantId: string;
  participant: InstantRequestParticipant | null;
  requestedById: string;
  preferredProviderId: string | null;
  title: string;
  service: string;
  description: string;
  supportCategory: string;
  preferredStartDate: string;
  preferredEndDate: string;
  status: InstantRequestStatus;
  source: string;
  notes: string;
  expiresAt: string;
  respondedAt: string | null;
  declineReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstantRequestListResponse {
  mode: 'instantRequests';
  boundary: string;
  filter: { window: InstantRequestWindow; asOf: string };
  requests: InstantRequestRecord[];
}

export interface InstantRequestRespondResponse {
  mode: 'instantRequestResponded';
  boundary: string;
  request: InstantRequestRecord;
}

export async function getInstantRequests(window: InstantRequestWindow = 'live') {
  const params = new URLSearchParams({ window });
  return apiFetch(`/requests?${params.toString()}`) as Promise<InstantRequestListResponse>;
}

export async function acceptInstantRequest(id: string) {
  return apiFetch(`/requests/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
    body: JSON.stringify({}),
  }) as Promise<InstantRequestRespondResponse>;
}

export async function declineInstantRequest(id: string, reason?: string) {
  return apiFetch(`/requests/${encodeURIComponent(id)}/decline`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  }) as Promise<InstantRequestRespondResponse>;
}
