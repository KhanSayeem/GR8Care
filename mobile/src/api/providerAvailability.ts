import { apiFetch } from './client';

export interface AvailabilityBlockRecord {
  id: string;
  day: string;
  start: string;
  end: string;
  service: string;
  enabled: boolean;
}

export interface ProviderAvailabilityRecord {
  providerId: string;
  blocks: AvailabilityBlockRecord[];
  updatedAt: string | null;
}

export interface ProviderAvailabilityResponse {
  mode: 'providerAvailability';
  boundary: string;
  availability: ProviderAvailabilityRecord;
}

export interface SaveAvailabilityBlockInput {
  day: string;
  start: string;
  end: string;
  service: string;
  enabled: boolean;
}

export async function getMyAvailability() {
  return apiFetch('/providers/me/availability') as Promise<ProviderAvailabilityResponse>;
}

export async function saveMyAvailability(blocks: SaveAvailabilityBlockInput[]) {
  return apiFetch('/providers/me/availability', {
    method: 'POST',
    body: JSON.stringify({ blocks }),
  }) as Promise<ProviderAvailabilityResponse>;
}
