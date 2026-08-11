const { canAccessFeature, getTierAccess, normalizeTier } = require('../src/services/subscriptionAccess');

describe('subscription access gating', () => {
  it('normalizes unknown tiers to starter access', () => {
    expect(normalizeTier('unknown')).toBe('starter');
    expect(getTierAccess('unknown').features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'educationLibrary', enabled: true }),
        expect.objectContaining({ key: 'shiftNoteDrafts', enabled: false }),
      ])
    );
  });

  it('gates features by tier without payment fields', () => {
    const access = getTierAccess('growth');

    expect(canAccessFeature('growth', 'shiftNoteDrafts')).toBe(true);
    expect(canAccessFeature('growth', 'adminReporting')).toBe(false);
    expect(access.boundary).toContain('Permission gating only');
    expect(access).not.toHaveProperty('prices');
    expect(access).not.toHaveProperty('paymentGateway');
    expect(access).not.toHaveProperty('card');
    expect(access).not.toHaveProperty('banking');
  });
});
