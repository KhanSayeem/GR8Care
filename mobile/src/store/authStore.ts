import { create } from 'zustand';

export type Role = 'participant' | 'caregiver' | 'supportWorker' | 'provider' | 'admin';

export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setSession: (token, user) => set({ token, user }),
  signOut: () => set({ token: null, user: null }),
}));
