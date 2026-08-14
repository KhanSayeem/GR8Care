import { apiFetch } from './client';

export interface AvailabilitySlot {
  id: string;
  start: string;
  end: string;
  service: string;
  status: 'available';
}

export interface AvailabilityDay {
  date: string;
  day: string;
  openSlots: AvailabilitySlot[];
}

export interface ProviderAvailabilitySlotsResponse {
  mode: 'providerAvailabilitySlots';
  boundary: string;
  provider: {
    id: string;
    displayName: string;
  };
  startDate: string | null;
  endDate: string | null;
  days: AvailabilityDay[];
}

export async function getProviderAvailability(providerId: string, startDate: string, endDate: string) {
  const params = new URLSearchParams({ startDate, endDate });
  return apiFetch(`/providers/${encodeURIComponent(providerId)}/availability?${params.toString()}`) as Promise<ProviderAvailabilitySlotsResponse>;
}
