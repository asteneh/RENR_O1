import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import {
  FeatureAction,
  UserRole,
  RoleLabels,
  canAccessMultiRole,
  isPaidFeatureMultiRole,
  getBlockedMessage,
  getMergedMembershipPlans,
  MembershipPlan,
} from '../../constants/UserRoles';

const THEME_COLOR = '#FF8C00';

interface RoleAccessGuardProps {
  feature: FeatureAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps children with multi-role access control.
 *
 * - If NONE of the user's roles have access → shows "blocked" message.
 * - If the feature is PAID and user has no membership → shows paywall.
 * - If access is FREE or user has membership → renders children.
 */
export default function RoleAccessGuard({ feature, children, fallback }: RoleAccessGuardProps) {
  const navigation = useNavigation<any>();
  const { isAuthenticated, getUserRoles, hasMembership } = useAuthStore();
  const [showPaywall, setShowPaywall] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={styles.blockedContainer}>
        <Ionicons name="lock-closed" size={48} color="#DDD" />
        <Text style={styles.blockedTitle}>Login Required</Text>
        <Text style={styles.blockedText}>Please log in to access this feature.</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.actionBtnText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roles = getUserRoles();
  const hasAccess = canAccessMultiRole(roles, feature);
  const needsPayment = isPaidFeatureMultiRole(roles, feature);
  const hasActivePlan = hasMembership();

  // None of the user's roles have access
  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return (
      <View style={styles.blockedContainer}>
        <View style={styles.blockedIconWrap}>
          <Ionicons name="shield-outline" size={52} color="#FF6B6B" />
        </View>
        <Text style={styles.blockedTitle}>Access Restricted</Text>
        <Text style={styles.blockedText}>{getBlockedMessage(roles, feature)}</Text>
        <Text style={styles.roleHint}>
          Your roles: <Text style={styles.roleHighlight}>{roles.map(r => RoleLabels[r]).join(', ')}</Text>
        </Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Feature is paid and user doesn't have active membership
  if (needsPayment && !hasActivePlan) {
    return (
      <>
        <View style={styles.blockedContainer}>
          <View style={styles.paywallIconWrap}>
            <Ionicons name="diamond-outline" size={52} color={THEME_COLOR} />
          </View>
          <Text style={styles.blockedTitle}>Membership Required</Text>
          <Text style={styles.blockedText}>
            This feature requires an active membership plan. Upgrade to unlock full access.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPaywall(true)}>
            <Text style={styles.actionBtnText}>View Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <PaywallModal
          visible={showPaywall}
          roles={roles}
          onClose={() => setShowPaywall(false)}
          onSelectPlan={(plan) => {
            setShowPaywall(false);
            navigation.navigate('MyPackages', { selectedPlan: plan });
          }}
        />
      </>
    );
  }

  return <>{children}</>;
}

// ─── Paywall Modal (Multi-Role) ─────────────────────────────────

interface PaywallModalProps {
  visible: boolean;
  roles: UserRole[];
  onClose: () => void;
  onSelectPlan: (plan: MembershipPlan) => void;
}

function PaywallModal({ visible, roles, onClose, onSelectPlan }: PaywallModalProps) {
  const mergedPlans = getMergedMembershipPlans(roles);
  const [selected, setSelected] = useState<string | null>(null);

  // Find the selected plan object across all role plan groups
  const findPlan = (): MembershipPlan | undefined => {
    for (const group of mergedPlans) {
      const found = group.plans.find(p => p.id === selected);
      if (found) return found;
    }
    return undefined;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Plan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Plans available for your roles: {roles.map(r => RoleLabels[r]).join(', ')}
          </Text>

          <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
            {mergedPlans.map((group) => (
              <View key={group.role}>
                <Text style={styles.planGroupTitle}>{group.roleName} Plans</Text>
                {group.plans.map((plan) => (
                  <TouchableOpacity
                    key={`${group.role}-${plan.id}`}
                    style={[styles.planCard, selected === plan.id && styles.activePlanCard]}
                    onPress={() => setSelected(plan.id)}
                  >
                    <View style={styles.planHeader}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planPrice}>{plan.price} Birr</Text>
                    </View>
                    {plan.features.map((feat, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color={THEME_COLOR} />
                        <Text style={styles.featureText}>{feat}</Text>
                      </View>
                    ))}
                    {selected === plan.id && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.confirmBtn, !selected && styles.disabledBtn]}
            disabled={!selected}
            onPress={() => {
              const plan = findPlan();
              if (plan) onSelectPlan(plan);
            }}
          >
            <Text style={styles.confirmBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Hook for quick multi-role access checks ──────────────────

export function useRoleAccess(feature: FeatureAction) {
  const { isAuthenticated, getUserRoles, hasMembership } = useAuthStore();

  if (!isAuthenticated) {
    return {
      allowed: false,
      needsPayment: false,
      needsLogin: true,
      blockedMessage: 'Please log in to access this feature.',
    };
  }

  const roles = getUserRoles();
  const hasAccess = canAccessMultiRole(roles, feature);
  const needsPayment = isPaidFeatureMultiRole(roles, feature);
  const hasActivePlan = hasMembership();

  return {
    allowed: hasAccess && (!needsPayment || hasActivePlan),
    needsPayment: needsPayment && !hasActivePlan,
    needsLogin: false,
    blockedMessage: !hasAccess ? getBlockedMessage(roles, feature) : '',
  };
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  blockedContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 40, backgroundColor: '#FAFAFA',
  },
  blockedIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  paywallIconWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FFF5E5', justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  blockedTitle: { fontSize: 22, fontWeight: 'bold', color: '#222', marginBottom: 10, textAlign: 'center' },
  blockedText: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 10 },
  roleHint: { fontSize: 13, color: '#AAA', marginBottom: 25 },
  roleHighlight: { color: THEME_COLOR, fontWeight: 'bold' },
  actionBtn: {
    backgroundColor: THEME_COLOR, paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 12, marginBottom: 12, elevation: 3,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { paddingHorizontal: 30, paddingVertical: 12 },
  secondaryBtnText: { color: '#666', fontSize: 15, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 15 },
  planGroupTitle: {
    fontSize: 15, fontWeight: '700', color: THEME_COLOR, marginTop: 12, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: '#F9F9F9', padding: 16, borderRadius: 14, marginBottom: 12,
    borderWidth: 2, borderColor: '#EEE', position: 'relative',
  },
  activePlanCard: { borderColor: THEME_COLOR, backgroundColor: '#FFF5E5' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  planTitle: { fontSize: 17, fontWeight: 'bold', color: '#222' },
  planPrice: { fontSize: 16, fontWeight: 'bold', color: THEME_COLOR },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  featureText: { fontSize: 13, color: '#666', marginLeft: 8 },
  selectedBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: THEME_COLOR, justifyContent: 'center', alignItems: 'center',
  },
  confirmBtn: {
    backgroundColor: THEME_COLOR, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 15,
  },
  disabledBtn: { backgroundColor: '#CCC' },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});
