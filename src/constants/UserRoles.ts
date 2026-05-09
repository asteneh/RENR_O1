export const UserRoles = {
  USER: 'USER',
  SELLER: 'SELLER',
  BUYER: 'BUYER',
  EMPLOYER: 'EMPLOYER',
  OPERATOR: 'OPERATOR',
  RENT_OWNER: 'RENT_OWNER',
  RENT_SEEKER: 'RENT_SEEKER',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

export const PropertyTypes = {
  SALE: 'SALE',
  RENT: 'RENT',
} as const;

export const RequestTypes = {
  BUY_REQUEST: 'BUY REQUEST',
  RENT_REQUEST: 'RENT REQUEST',
} as const;

// Display labels — using local terms for rent roles
export const RoleLabels: Record<UserRole, string> = {
  [UserRoles.USER]: 'User',
  [UserRoles.SELLER]: 'Seller',
  [UserRoles.BUYER]: 'Buyer',
  [UserRoles.EMPLOYER]: 'Employer',
  [UserRoles.OPERATOR]: 'Operator',
  [UserRoles.RENT_OWNER]: 'Akeray',
  [UserRoles.RENT_SEEKER]: 'Tekeray',
};

// Short descriptions shown during registration
export const RoleDescriptions: Record<UserRole, string> = {
  [UserRoles.USER]: 'Browse listings and search',
  [UserRoles.SELLER]: 'Sell items & properties',
  [UserRoles.BUYER]: 'Buy items & properties',
  [UserRoles.EMPLOYER]: 'Post jobs & hire operators',
  [UserRoles.OPERATOR]: 'Service provider / worker',
  [UserRoles.RENT_OWNER]: 'Post rental properties (Landlord)',
  [UserRoles.RENT_SEEKER]: 'Find rental properties (Tenant)',
};

// Icons for each role
export const RoleIcons: Record<UserRole, string> = {
  [UserRoles.USER]: 'person-outline',
  [UserRoles.SELLER]: 'storefront-outline',
  [UserRoles.BUYER]: 'cart-outline',
  [UserRoles.EMPLOYER]: 'briefcase-outline',
  [UserRoles.OPERATOR]: 'construct-outline',
  [UserRoles.RENT_OWNER]: 'home-outline',
  [UserRoles.RENT_SEEKER]: 'search-outline',
};

// Backend enum mapping — converts our internal constants to what the API expects
export const RoleToBackend: Record<UserRole, string> = {
  [UserRoles.USER]: 'User',
  [UserRoles.SELLER]: 'Seller',
  [UserRoles.BUYER]: 'Buyer',
  [UserRoles.EMPLOYER]: 'Employer',
  [UserRoles.OPERATOR]: 'Operator',
  [UserRoles.RENT_OWNER]: 'Akeray',
  [UserRoles.RENT_SEEKER]: 'Tekeray',
};

// Roles available for selection during registration (excludes USER)
export const SELECTABLE_ROLES: UserRole[] = [
  UserRoles.SELLER,
  UserRoles.BUYER,
  UserRoles.EMPLOYER,
  UserRoles.OPERATOR,
  UserRoles.RENT_OWNER,
  UserRoles.RENT_SEEKER,
];

// ─── Feature Actions ──────────────────────────────────────────────
export const FeatureActions = {
  POST_JOB: 'POST_JOB',
  POST_SALE: 'POST_SALE',
  POST_RENT: 'POST_RENT',
  REQUEST_BUY: 'REQUEST_BUY',
  REQUEST_RENT: 'REQUEST_RENT',
  VIEW_SELLER_INFO: 'VIEW_SELLER_INFO',
  JOIN_OPERATOR: 'JOIN_OPERATOR',
  BROWSE_LISTINGS: 'BROWSE_LISTINGS',
  SEARCH: 'SEARCH',
} as const;

export type FeatureAction = typeof FeatureActions[keyof typeof FeatureActions];

// ─── Access Matrix ────────────────────────────────────────────────
// 'paid' = allowed but requires payment/membership
// 'free' = allowed for free
// 'no'   = not available for this role
type AccessLevel = 'paid' | 'free' | 'no';

export const ACCESS_MATRIX: Record<FeatureAction, Record<UserRole, AccessLevel>> = {
  [FeatureActions.POST_JOB]: {
    [UserRoles.USER]: 'no',
    [UserRoles.EMPLOYER]: 'paid',
    [UserRoles.BUYER]: 'paid',
    [UserRoles.SELLER]: 'paid',
    [UserRoles.RENT_SEEKER]: 'paid',
    [UserRoles.RENT_OWNER]: 'paid',
    [UserRoles.OPERATOR]: 'no',
  },
  [FeatureActions.POST_SALE]: {
    [UserRoles.USER]: 'no',
    [UserRoles.EMPLOYER]: 'paid',
    [UserRoles.BUYER]: 'paid',
    [UserRoles.SELLER]: 'paid',
    [UserRoles.RENT_SEEKER]: 'paid',
    [UserRoles.RENT_OWNER]: 'no',
    [UserRoles.OPERATOR]: 'no',
  },
  [FeatureActions.POST_RENT]: {
    [UserRoles.USER]: 'no',
    [UserRoles.EMPLOYER]: 'paid',
    [UserRoles.BUYER]: 'no',
    [UserRoles.SELLER]: 'paid',
    [UserRoles.RENT_SEEKER]: 'paid',
    [UserRoles.RENT_OWNER]: 'paid',
    [UserRoles.OPERATOR]: 'no',
  },
  [FeatureActions.REQUEST_BUY]: {
    [UserRoles.USER]: 'no',
    [UserRoles.EMPLOYER]: 'paid',
    [UserRoles.BUYER]: 'paid',
    [UserRoles.SELLER]: 'no',
    [UserRoles.RENT_SEEKER]: 'no',
    [UserRoles.RENT_OWNER]: 'no',
    [UserRoles.OPERATOR]: 'no',
  },
  [FeatureActions.REQUEST_RENT]: {
    [UserRoles.USER]: 'no',
    [UserRoles.EMPLOYER]: 'paid',
    [UserRoles.BUYER]: 'paid',
    [UserRoles.SELLER]: 'no',
    [UserRoles.RENT_SEEKER]: 'paid',
    [UserRoles.RENT_OWNER]: 'no',
    [UserRoles.OPERATOR]: 'no',
  },
  [FeatureActions.VIEW_SELLER_INFO]: {
    [UserRoles.USER]: 'no',
    [UserRoles.EMPLOYER]: 'paid',
    [UserRoles.BUYER]: 'paid',
    [UserRoles.SELLER]: 'paid',
    [UserRoles.RENT_SEEKER]: 'paid',
    [UserRoles.RENT_OWNER]: 'paid',
    [UserRoles.OPERATOR]: 'no',
  },
  [FeatureActions.JOIN_OPERATOR]: {
    [UserRoles.USER]: 'paid',
    [UserRoles.EMPLOYER]: 'paid',
    [UserRoles.BUYER]: 'paid',
    [UserRoles.SELLER]: 'paid',
    [UserRoles.RENT_SEEKER]: 'paid',
    [UserRoles.RENT_OWNER]: 'paid',
    [UserRoles.OPERATOR]: 'paid',
  },
  [FeatureActions.BROWSE_LISTINGS]: {
    [UserRoles.USER]: 'free',
    [UserRoles.EMPLOYER]: 'free',
    [UserRoles.BUYER]: 'free',
    [UserRoles.SELLER]: 'free',
    [UserRoles.RENT_SEEKER]: 'free',
    [UserRoles.RENT_OWNER]: 'free',
    [UserRoles.OPERATOR]: 'free',
  },
  [FeatureActions.SEARCH]: {
    [UserRoles.USER]: 'free',
    [UserRoles.EMPLOYER]: 'free',
    [UserRoles.BUYER]: 'free',
    [UserRoles.SELLER]: 'free',
    [UserRoles.RENT_SEEKER]: 'free',
    [UserRoles.RENT_OWNER]: 'free',
    [UserRoles.OPERATOR]: 'free',
  },
};

// ─── Single-Role Permission Helpers ───────────────────────────────

/** Check if a single role can access a given feature (paid or free). */
export function canAccess(role: UserRole, feature: FeatureAction): boolean {
  const level = ACCESS_MATRIX[feature]?.[role];
  return level === 'paid' || level === 'free';
}

/** Check if a feature requires payment for a single role. */
export function isPaidFeature(role: UserRole, feature: FeatureAction): boolean {
  return ACCESS_MATRIX[feature]?.[role] === 'paid';
}

/** Get the access level for a single role + feature. */
export function getAccessLevel(role: UserRole, feature: FeatureAction): AccessLevel {
  return ACCESS_MATRIX[feature]?.[role] ?? 'no';
}

// ─── Multi-Role Permission Helpers ────────────────────────────────
// When a user has multiple roles, permissions are MERGED (union).
// If ANY of the user's roles grants access, they have access.
// If ANY role grants 'free' access, it's free. Otherwise if any grants 'paid', it's paid.

/**
 * Check if ANY of the user's roles can access a feature.
 * Returns the best access level across all roles.
 */
export function canAccessMultiRole(roles: UserRole[], feature: FeatureAction): boolean {
  return roles.some(role => canAccess(role, feature));
}

/**
 * Check if a feature requires payment considering all user roles.
 * Returns false if ANY role grants free access.
 * Returns true only if access exists but all granting roles require payment.
 */
export function isPaidFeatureMultiRole(roles: UserRole[], feature: FeatureAction): boolean {
  const grantingRoles = roles.filter(role => canAccess(role, feature));
  if (grantingRoles.length === 0) return false; // no access at all
  // If any role grants free access, the feature is free
  return !grantingRoles.some(role => getAccessLevel(role, feature) === 'free');
}

/**
 * Get the best access level across multiple roles.
 * Priority: free > paid > no
 */
export function getBestAccessLevel(roles: UserRole[], feature: FeatureAction): AccessLevel {
  let best: AccessLevel = 'no';
  for (const role of roles) {
    const level = getAccessLevel(role, feature);
    if (level === 'free') return 'free'; // Can't get better than free
    if (level === 'paid') best = 'paid';
  }
  return best;
}

/**
 * Get all features accessible by a set of roles (merged).
 */
export function getMultiRoleCapabilities(roles: UserRole[]): { feature: FeatureAction; level: AccessLevel }[] {
  return Object.keys(ACCESS_MATRIX)
    .map(feature => ({
      feature: feature as FeatureAction,
      level: getBestAccessLevel(roles, feature as FeatureAction),
    }))
    .filter(item => item.level !== 'no');
}

/**
 * Get a blocked message for multi-role users.
 */
export function getBlockedMessage(roles: UserRole[], feature: FeatureAction): string {
  const best = getBestAccessLevel(roles, feature);
  if (best === 'no') {
    const roleNames = roles.map(r => RoleLabels[r]).join(', ');
    return `Your roles (${roleNames}) do not have access to this feature.`;
  }
  if (best === 'paid') {
    return `This feature requires an active membership plan. Please upgrade to continue.`;
  }
  return '';
}

// ─── Membership Plans ─────────────────────────────────────────────
export interface MembershipPlan {
  id: string;
  title: string;
  price: number;
  features: string[];
}

export const MEMBERSHIP_PLANS: Record<string, MembershipPlan[]> = {
  [UserRoles.USER]: [
    { id: 'free', title: "Free User", price: 0, features: ["Browse only", "Search properties/jobs"] },
    { id: 'basic', title: "Basic Paid", price: 50, features: ["1 posting", "Limited contacts access"] },
    { id: 'premium', title: "Premium", price: 150, features: ["Unlimited posting", "Full contact access"] }
  ],
  [UserRoles.EMPLOYER]: [
    { id: 'basic', title: "Basic", price: 100, features: ["5 Job postings/month", "View applicant info"] },
    { id: 'gold', title: "Gold", price: 250, features: ["15 Job postings/month", "Priority listing", "View applicant info"] },
    { id: 'premium', title: "Premium", price: 500, features: ["Unlimited Job postings/month", "Featured listings", "Full applicant access"] }
  ],
  [UserRoles.RENT_OWNER]: [
    { id: 'basic', title: "Basic", price: 100, features: ["10 items to post/month", "3 Job vacancies/month"] },
    { id: 'gold', title: "Gold", price: 200, features: ["25 items to post/month", "6 Job vacancies/month"] },
    { id: 'premium', title: "Premium", price: 400, features: ["Unlimited items to Post/month", "Unlimited Job vacancies/month"] }
  ],
  [UserRoles.BUYER]: [
    { id: 'basic', title: "Basic", price: 50, features: ["10 buying request post/month"] },
    { id: 'gold', title: "Gold", price: 100, features: ["15 buying request post/month"] },
    { id: 'premium', title: "Premium", price: 200, features: ["Unlimited buying request post/month"] }
  ],
  [UserRoles.SELLER]: [
    { id: 'basic', title: "Basic", price: 100, features: ["10 items to post/month", "3 Job vacancies/month"] },
    { id: 'gold', title: "Gold", price: 200, features: ["30 units per month", "6 Job vacancies/month"] },
    { id: 'premium', title: "Premium", price: 400, features: ["Unlimited items per month", "12 Job vacancies/month"] }
  ],
  [UserRoles.RENT_SEEKER]: [
    { id: 'basic', title: "Basic", price: 100, features: ["10 items request post/month", "3 Job vacancies/month"] },
    { id: 'gold', title: "Gold", price: 200, features: ["15 items request post/month", "6 Job vacancies/month"] },
    { id: 'premium', title: "Premium", price: 400, features: ["Unlimited items to Post/month", "12 Job vacancies/month"] }
  ],
  [UserRoles.OPERATOR]: [
    { id: 'basic', title: "Basic", price: 50, features: ["Operator dashboard access", "Standard operator status"] }
  ]
};

/**
 * Get combined membership plans for multiple roles (de-duplicated by best value).
 */
export function getMergedMembershipPlans(roles: UserRole[]): { role: UserRole; roleName: string; plans: MembershipPlan[] }[] {
  return roles
    .filter(role => MEMBERSHIP_PLANS[role] && MEMBERSHIP_PLANS[role].length > 0)
    .map(role => ({
      role,
      roleName: RoleLabels[role],
      plans: MEMBERSHIP_PLANS[role],
    }));
}
