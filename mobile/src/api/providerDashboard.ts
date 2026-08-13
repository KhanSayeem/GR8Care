import { apiFetch } from './client';

export interface ProviderStats {
  providerId: string;
  displayName: string;
  verified: boolean;
  subscriptionTier: string;
  sessionsToday: number;
  sessionsThisWeek: number;
  earningsThisWeek: number;
  rating: number | null;
  availabilityBlocks: number;
  activeAvailabilityBlocks: number;
  lastAvailabilityUpdate: string | null;
}

export interface ProviderStatsResponse {
  mode: 'providerStats';
  boundary: string;
  stats: ProviderStats;
}

export interface ProviderScheduleBlock {
  id: string;
  start: string;
  end: string;
  service: string;
  status: 'available';
}

export interface ProviderScheduleTodayResponse {
  mode: 'providerScheduleToday';
  boundary: string;
  date: string;
  day: string;
  schedule: ProviderScheduleBlock[];
}

export type ProviderScheduleRange = 'this-week' | 'next-week' | 'month';

export interface ProviderScheduleDay {
  date: string;
  day: string;
  blocks: ProviderScheduleBlock[];
}

export interface ProviderScheduleResponse {
  mode: 'providerSchedule';
  boundary: string;
  range: ProviderScheduleRange;
  startDate: string | null;
  endDate: string | null;
  schedule: ProviderScheduleDay[];
}

export async function getProviderStats() {
  return apiFetch('/providers/me/stats') as Promise<ProviderStatsResponse>;
}

export async function getProviderSchedule(range: ProviderScheduleRange = 'this-week') {
  return apiFetch(`/providers/me/schedule?range=${encodeURIComponent(range)}`) as Promise<ProviderScheduleResponse>;
}

export async function getProviderScheduleToday() {
  return apiFetch('/providers/me/schedule-today') as Promise<ProviderScheduleTodayResponse>;
}
