import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'Buyer' | 'Seller' | 'Agent' | 'Tenant';
export type ViewMode = 'Demand' | 'Supplier' | 'Both';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  currentRole: UserRole;
  availableRoles: UserRole[];
  viewMode: ViewMode;
  login: (user: any, token: string) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      currentRole: 'Buyer',
      availableRoles: ['Buyer', 'Seller', 'Agent', 'Tenant'],
      viewMode: 'Demand',
      login: (user, token) => set({ isAuthenticated: true, user, token }),
      logout: () => set({ isAuthenticated: false, user: null, token: null, currentRole: 'Buyer', viewMode: 'Demand' }),
      setRole: (role) => set({ currentRole: role }),
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: 'auth-storage', // unique name
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);