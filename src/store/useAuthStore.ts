import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserRole,
  UserRoles,
  FeatureAction,
  canAccessMultiRole,
  isPaidFeatureMultiRole,
  getBestAccessLevel,
  getBlockedMessage,
} from '../constants/UserRoles';

export type ViewMode = 'Demand' | 'Supplier' | 'Both';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  currentRoles: UserRole[];
  viewMode: ViewMode;

  // Actions
  login: (user: any, token: string) => void;
  logout: () => void;
  setRoles: (roles: UserRole[]) => void;
  addRole: (role: UserRole) => void;
  removeRole: (role: UserRole) => void;
  setViewMode: (mode: ViewMode) => void;
  updateUser: (user: any) => void;

  // Multi-role helpers
  getUserRoles: () => UserRole[];
  hasRole: (role: UserRole) => boolean;
  canPerform: (feature: FeatureAction) => boolean;
  requiresPayment: (feature: FeatureAction) => boolean;
  getFeatureBlockedReason: (feature: FeatureAction) => string;
  hasMembership: () => boolean;

  // Legacy single-role compat (returns primary role)
  currentRole: UserRole;
  getUserRole: () => UserRole;
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      currentRoles: [UserRoles.USER] as UserRole[],
      viewMode: 'Demand',

      // Legacy compat: currentRole returns primary (first) role
      get currentRole(): UserRole {
        const state = get();
        return state.currentRoles[0] || (UserRoles.USER as UserRole);
      },

      login: (user, token) => {
        // Map the user's roles from the backend
        const backendRoles = extractBackendRoles(user);
        set({
          isAuthenticated: true,
          user,
          token,
          currentRoles: backendRoles.length > 0 ? backendRoles : [UserRoles.USER as UserRole],
        });
      },

      logout: () => set({
        isAuthenticated: false,
        user: null,
        token: null,
        currentRoles: [UserRoles.USER as UserRole],
        viewMode: 'Demand',
      }),

      setRoles: (roles) => set({ currentRoles: roles }),

      addRole: (role) => {
        const current = get().currentRoles;
        if (!current.includes(role)) {
          set({ currentRoles: [...current, role] });
        }
      },

      removeRole: (role) => {
        const current = get().currentRoles;
        const filtered = current.filter(r => r !== role);
        set({ currentRoles: filtered.length > 0 ? filtered : [UserRoles.USER as UserRole] });
      },

      // Legacy compat
      setRole: (role) => {
        const current = get().currentRoles;
        if (!current.includes(role)) {
          set({ currentRoles: [...current, role] });
        }
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      updateUser: (user) => {
        const backendRoles = extractBackendRoles(user);
        set({
          user: { ...get().user, ...user },
          currentRoles: backendRoles.length > 0 ? backendRoles : [UserRoles.USER as UserRole],
        });
      },

      // ─── Multi-Role Helpers ────────────────────────────
      getUserRoles: () => {
        const state = get();
        if (!state.isAuthenticated || !state.user) return [UserRoles.USER as UserRole];
        return state.currentRoles.length > 0 ? state.currentRoles : [UserRoles.USER as UserRole];
      },

      // Legacy single-role compat
      getUserRole: () => {
        const state = get();
        if (!state.isAuthenticated || !state.user) return UserRoles.USER as UserRole;
        return state.currentRoles[0] || (UserRoles.USER as UserRole);
      },

      hasRole: (role: UserRole) => {
        return get().currentRoles.includes(role);
      },

      canPerform: (feature: FeatureAction) => {
        const roles = get().getUserRoles();
        return canAccessMultiRole(roles, feature);
      },

      requiresPayment: (feature: FeatureAction) => {
        const roles = get().getUserRoles();
        return isPaidFeatureMultiRole(roles, feature);
      },

      getFeatureBlockedReason: (feature: FeatureAction) => {
        const roles = get().getUserRoles();
        return getBlockedMessage(roles, feature);
      },

      hasMembership: () => {
        // TODO: Re-enable actual membership check when payment integration is complete
        // For now, assume payment is granted for all authenticated users
        const state = get();
        if (!state.isAuthenticated || !state.user) return false;
        return true;
        // Original logic:
        // const membershipType = state.user?.membershipType;
        // return !!membershipType && membershipType !== 'free';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── Backend Role Extraction ──────────────────────────────────────
// Handles single string, comma-separated, or array from backend

export function extractBackendRoles(user: any): UserRole[] {
  if (!user) return [];

  const roles: UserRole[] = [];

  // Check for userType (could be string or array)
  const rawType = user.userType || user.role || user.roles;
  if (!rawType) return [UserRoles.USER as UserRole];

  // If it's already an array
  const rawArray = Array.isArray(rawType) ? rawType : [rawType];

  for (const raw of rawArray) {
    if (typeof raw !== 'string') continue;
    // Split by comma in case backend sends "SELLER,BUYER"
    const parts = raw.split(',').map((s: string) => s.trim());
    for (const part of parts) {
      const mapped = mapSingleRole(part);
      if (mapped && !roles.includes(mapped)) {
        roles.push(mapped);
      }
    }
  }

  return roles.length > 0 ? roles : [UserRoles.USER as UserRole];
}

function mapSingleRole(backendRole: string): UserRole | null {
  if (!backendRole) return null;
  const normalized = backendRole.toLowerCase().trim();

  // Direct match first
  const directMap: Record<string, UserRole> = {
    'user': UserRoles.USER,
    'seller': UserRoles.SELLER,
    'buyer': UserRoles.BUYER,
    'employer': UserRoles.EMPLOYER,
    'operator': UserRoles.OPERATOR,
    'rent_owner': UserRoles.RENT_OWNER,
    'rent_seeker': UserRoles.RENT_SEEKER,
    'akeray': UserRoles.RENT_OWNER,
    'tekeray': UserRoles.RENT_SEEKER,
  };

  if (directMap[normalized]) return directMap[normalized];

  // Fuzzy matching
  if (normalized.includes('operator') || normalized.includes('employee')) return UserRoles.OPERATOR;
  if (normalized.includes('seller') || normalized.includes('supplier')) return UserRoles.SELLER;
  if (normalized.includes('buyer')) return UserRoles.BUYER;
  if (normalized.includes('employer')) return UserRoles.EMPLOYER;
  if (normalized.includes('rent_owner') || normalized.includes('landlord') || normalized.includes('akeray')) return UserRoles.RENT_OWNER;
  if (normalized.includes('rent_seeker') || normalized.includes('tenant') || normalized.includes('tekeray')) return UserRoles.RENT_SEEKER;

  return UserRoles.USER;
}