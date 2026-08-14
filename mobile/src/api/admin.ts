import { apiFetch } from './client';

export interface AdminStats {
  totalUsers: number;
  totalParticipants: number;
  totalProviders: number;
  pendingVerifications: number;
  bookingsToday: number;
  activeBookings: number;
}

export interface AdminStatsResponse {
  mode: 'adminStats';
  boundary: string;
  stats: AdminStats;
}

export async function getAdminStats() {
  return apiFetch('/admin/stats') as Promise<AdminStatsResponse>;
}

export interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  subscriptionTier: string;
  createdAt: string;
}

export interface AdminUserListResponse {
  mode: 'adminUserList';
  boundary: string;
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminUserFilters {
  role?: string;
  status?: 'active' | 'suspended';
  search?: string;
  page?: number;
}

export async function getAdminUsers(filters: AdminUserFilters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));

  const query = params.toString();
  return apiFetch(`/admin/users${query ? `?${query}` : ''}`) as Promise<AdminUserListResponse>;
}

export interface PendingProvider {
  id: string;
  provider: { id: string; fullName: string; email: string };
  location: string;
  services: string[];
  languages: string[];
  hourlyRate: number | null;
  bio: string;
  abn: string;
  submittedAt: string;
}

export interface PendingProvidersResponse {
  mode: 'adminPendingProviders';
  boundary: string;
  providers: PendingProvider[];
}

export async function getPendingProviders() {
  return apiFetch('/admin/providers/pending') as Promise<PendingProvidersResponse>;
}

export interface AdminProviderVerificationResponse {
  mode: 'adminProviderVerification';
  boundary: string;
  provider: Record<string, unknown>;
}

export async function approveProvider(profileId: string) {
  return apiFetch(`/admin/providers/${encodeURIComponent(profileId)}/approve`, {
    method: 'POST',
  }) as Promise<AdminProviderVerificationResponse>;
}

export async function rejectProvider(profileId: string) {
  return apiFetch(`/admin/providers/${encodeURIComponent(profileId)}/reject`, {
    method: 'POST',
  }) as Promise<AdminProviderVerificationResponse>;
}
