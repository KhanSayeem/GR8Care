import { apiFetch } from './client';
import { AuthUser, Role } from '../store/authStore';

export interface AuthSessionResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  language?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<AuthSessionResponse>;
}

export async function login(input: LoginInput) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<AuthSessionResponse>;
}

export interface ConsentInput {
  dataCollection?: boolean;
  telehealthPrivacy?: boolean;
  aiTranslation?: boolean;
  providerDataSharing?: boolean;
  voiceInputProcessing?: boolean;
  readAloud?: boolean;
}

export interface UpdateMyProfileInput {
  fullName?: string;
  language?: string;
  ndisNumber?: string;
  location?: string;
  goals?: string[];
  notificationsEnabled?: boolean;
  budgetAlertsEnabled?: boolean;
  consent?: ConsentInput;
}

export interface UpdateMyProfileResponse {
  user: AuthUser;
}

export async function updateMyProfile(token: string, input: UpdateMyProfileInput) {
  return apiFetch('/users/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  }) as Promise<UpdateMyProfileResponse>;
}

export type SubscriptionTier = 'starter' | 'growth' | 'enterprise';

export interface SubscriptionFeature {
  key: string;
  label: string;
  requiredTier: SubscriptionTier;
  enabled: boolean;
}

export interface SubscriptionAccess {
  tier: SubscriptionTier;
  boundary: string;
  features: SubscriptionFeature[];
}

export interface MyAccessResponse {
  access: SubscriptionAccess;
}

export async function getMyAccess(token: string) {
  return apiFetch('/users/me/access', {
    headers: { Authorization: `Bearer ${token}` },
  }) as Promise<MyAccessResponse>;
}
