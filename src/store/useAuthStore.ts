import { create } from 'zustand';

export type UserRole = 'Buyer' | 'Seller' | 'Agent' | 'Tenant';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null; // Placeholder for user object
  currentRole: UserRole;
  availableRoles: UserRole[];
  login: () => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  currentRole: 'Buyer', // Default role
  availableRoles: ['Buyer', 'Seller', 'Agent', 'Tenant'], // Mock available roles
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false, currentRole: 'Buyer' }),
  setRole: (role) => set({ currentRole: role }),
}));