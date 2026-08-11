const SUBSCRIPTION_TIERS = ['starter', 'growth', 'enterprise'];

const TIER_RANK = {
  starter: 0,
  growth: 1,
  enterprise: 2,
};

const FEATURE_GATES = [
  {
    key: 'educationLibrary',
    label: 'Education library',
    requiredTier: 'starter',
  },
  {
    key: 'shiftNoteDrafts',
    label: 'Shift Note AI drafts',
    requiredTier: 'growth',
  },
  {
    key: 'compatibilityDemo',
    label: 'Compatibility matching demo',
    requiredTier: 'growth',
  },
  {
    key: 'adminReporting',
    label: 'Admin reporting exports',
    requiredTier: 'enterprise',
  },
];

function normalizeTier(tier) {
  return SUBSCRIPTION_TIERS.includes(tier) ? tier : 'starter';
}

function canAccessFeature(tier, featureKey) {
  const normalizedTier = normalizeTier(tier);
  const gate = FEATURE_GATES.find((feature) => feature.key === featureKey);

  if (!gate) {
    return false;
  }

  return TIER_RANK[normalizedTier] >= TIER_RANK[gate.requiredTier];
}

function getTierAccess(tier) {
  const normalizedTier = normalizeTier(tier);

  return {
    tier: normalizedTier,
    boundary: 'Permission gating only. No payment gateway, card capture, banking capture, or automated payment processing is configured.',
    features: FEATURE_GATES.map((feature) => ({
      ...feature,
      enabled: canAccessFeature(normalizedTier, feature.key),
    })),
  };
}

module.exports = {
  FEATURE_GATES,
  SUBSCRIPTION_TIERS,
  canAccessFeature,
  getTierAccess,
  normalizeTier,
};
