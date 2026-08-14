import { apiFetch } from './client';

export interface CompatibilityBreakdown {
  location: number;
  language: number;
  goals: number;
}

export interface ProviderSummary {
  id: string;
  name: string;
  location: string;
  languages: string[];
  services: string[];
  hourlyRate: number | null;
  acceptingNewParticipants: boolean;
  abnVerificationStatus: 'unverified' | 'pending' | 'verified';
  rating: number | null;
  compatibilityScore: number | null;
  compatibilityBreakdown: CompatibilityBreakdown | null;
}

export interface ProviderDetail extends ProviderSummary {
  bio: string;
  abn: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderListResponse {
  mode: 'providers';
  boundary: string;
  filter: { near: string | null; language: string | null; goals: string[] | null; topRated: boolean };
  providers: ProviderSummary[];
}

export interface ProviderDetailResponse {
  mode: 'providerDetail';
  boundary: string;
  provider: ProviderDetail;
}

export interface ProviderListFilters {
  near?: string;
  language?: string;
  goals?: string;
  topRated?: boolean;
}

export async function getProviders(filters: ProviderListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.near) params.set('near', filters.near);
  if (filters.language) params.set('language', filters.language);
  if (filters.goals) params.set('goals', filters.goals);
  if (filters.topRated) params.set('topRated', 'true');

  const query = params.toString();
  return apiFetch(`/providers${query ? `?${query}` : ''}`) as Promise<ProviderListResponse>;
}

export async function getProviderById(id: string) {
  return apiFetch(`/providers/${encodeURIComponent(id)}`) as Promise<ProviderDetailResponse>;
}
