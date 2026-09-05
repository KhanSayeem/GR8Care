const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ConsentRecord = require('../src/models/ConsentRecord');
const { CONSENT_PURPOSES } = require('../src/models/ConsentRecord');
const User = require('../src/models/User');
const { hasActiveConsent } = require('../src/services/consent');

let mongod;
let app;

jest.setTimeout(120000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret';
  await mongoose.connect(process.env.MONGODB_URI);
  app = require('../src/app');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await ConsentRecord.deleteMany({});
  await User.deleteMany({});
});

async function registerUser(role, email) {
  const res = await request(app).post('/auth/register').send({
    fullName: `${role} user`,
    email,
    password: 'supersecret',
    role,
  });
  return res.body;
}

// Admins cannot be created through /auth/register - that endpoint rejects the
// admin role so nobody can grant it to themselves. Seed one directly, then log
// in for a token.
async function registerAdmin(email = 'admin.consent@example.com') {
  await User.create({
    fullName: 'Admin User',
    email,
    password: 'supersecret',
    role: 'admin',
    language: 'en',
  });

  const res = await request(app).post('/auth/login').send({ email, password: 'supersecret' });
  return res.body;
}

function grantConsent(token, overrides = {}) {
  return request(app)
    .post('/consent')
    .set('Authorization', `Bearer ${token}`)
    .send({
      purpose: 'providerDiscovery',
      scope: ['Support needs summary'],
      recipients: ['Matched providers'],
      reason: 'So providers can see what I need',
      ...overrides,
    });
}

describe('POST /consent', () => {
  it('records a granted decision with scope, recipients, and who decided', async () => {
    const participant = await registerUser('participant', 'p.consent.create@example.com');

    const res = await grantConsent(participant.token);

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('consentRecorded');
    expect(typeof res.body.boundary).toBe('string');
    expect(res.body.boundary.length).toBeGreaterThan(0);

    const consent = res.body.consent;
    expect(consent.id).toBeDefined();
    expect(consent._id).toBeUndefined();
    expect(consent.purpose).toBe('providerDiscovery');
    expect(consent.decision).toBe('granted');
    expect(consent.scope).toEqual(['Support needs summary']);
    expect(consent.recipients).toEqual(['Matched providers']);
    expect(consent.reason).toBe('So providers can see what I need');
    expect(consent.revokedAt).toBeNull();
    expect(consent.participant).toBe(String(participant.user._id));
    expect(consent.decidedBy).toBe(String(participant.user._id));
    expect(consent.decidedAt).toBeDefined();

    const stored = await ConsentRecord.find({ participant: participant.user._id });
    expect(stored).toHaveLength(1);
    expect(stored[0].decision).toBe('granted');
  });

  it('trims scope and recipients entries and drops blank ones', async () => {
    const participant = await registerUser('participant', 'p.consent.trim@example.com');

    const res = await grantConsent(participant.token, {
      scope: ['  Plan budget  ', '', '   ', 'Goals'],
      recipients: ['  My plan manager  ', ''],
    });

    expect(res.status).toBe(201);
    expect(res.body.consent.scope).toEqual(['Plan budget', 'Goals']);
    expect(res.body.consent.recipients).toEqual(['My plan manager']);
  });

  it('lets a caregiver record a decision on their own account', async () => {
    const caregiver = await registerUser('caregiver', 'c.consent.create@example.com');

    const res = await grantConsent(caregiver.token, { purpose: 'aiTranslation' });

    expect(res.status).toBe(201);
    expect(res.body.consent.purpose).toBe('aiTranslation');
    expect(res.body.consent.decidedBy).toBe(String(caregiver.user._id));
  });

  it('rejects an unknown purpose and names the supported ones', async () => {
    const participant = await registerUser('participant', 'p.consent.badpurpose@example.com');

    const res = await grantConsent(participant.token, { purpose: 'sellMyData' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('purpose must be one of');
    CONSENT_PURPOSES.forEach((purpose) => {
      expect(res.body.error).toContain(purpose);
    });
    expect(await ConsentRecord.countDocuments({})).toBe(0);
  });

  it('rejects a missing purpose', async () => {
    const participant = await registerUser('participant', 'p.consent.nopurpose@example.com');

    const res = await grantConsent(participant.token, { purpose: undefined });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('purpose must be one of');
  });

  it('rejects a decision with no scope', async () => {
    const participant = await registerUser('participant', 'p.consent.noscope@example.com');

    const res = await grantConsent(participant.token, { scope: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('scope is required');
    expect(await ConsentRecord.countDocuments({})).toBe(0);
  });

  it('rejects a decision with no recipients', async () => {
    const participant = await registerUser('participant', 'p.consent.norecipients@example.com');

    const res = await grantConsent(participant.token, { recipients: ['   '] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('recipients is required');
    expect(await ConsentRecord.countDocuments({})).toBe(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/consent').send({
      purpose: 'providerDiscovery',
      scope: ['Support needs summary'],
      recipients: ['Matched providers'],
    });

    expect(res.status).toBe(401);
    expect(await ConsentRecord.countDocuments({})).toBe(0);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app)
      .post('/consent')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({
        purpose: 'providerDiscovery',
        scope: ['Support needs summary'],
        recipients: ['Matched providers'],
      });

    expect(res.status).toBe(401);
  });
});

describe('GET /consent', () => {
  it('returns only the caller own decisions, newest first', async () => {
    const participant = await registerUser('participant', 'p.consent.list@example.com');
    const other = await registerUser('participant', 'p.consent.other@example.com');

    await grantConsent(participant.token, { purpose: 'providerDiscovery' });
    await grantConsent(participant.token, { purpose: 'dataSharing' });
    await grantConsent(other.token, { purpose: 'documentation' });

    const res = await request(app).get('/consent').set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('consentHistory');
    expect(res.body.purposes).toEqual(CONSENT_PURPOSES);
    expect(res.body.consents).toHaveLength(2);
    expect(res.body.consents.map((c) => c.purpose)).toEqual(['dataSharing', 'providerDiscovery']);
    res.body.consents.forEach((consent) => {
      expect(consent.participant).toBe(String(participant.user._id));
    });
  });

  it('filters by purpose', async () => {
    const participant = await registerUser('participant', 'p.consent.filter@example.com');
    await grantConsent(participant.token, { purpose: 'providerDiscovery' });
    await grantConsent(participant.token, { purpose: 'voiceInputProcessing' });

    const res = await request(app)
      .get('/consent?purpose=voiceInputProcessing')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.consents).toHaveLength(1);
    expect(res.body.consents[0].purpose).toBe('voiceInputProcessing');
  });

  it('rejects an unsupported purpose filter', async () => {
    const participant = await registerUser('participant', 'p.consent.badfilter@example.com');

    const res = await request(app)
      .get('/consent?purpose=whatever')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Unsupported consent purpose');
  });

  it('returns an empty history for someone who has decided nothing', async () => {
    const participant = await registerUser('participant', 'p.consent.empty@example.com');

    const res = await request(app).get('/consent').set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.consents).toEqual([]);
    expect(res.body.purposes).toEqual(CONSENT_PURPOSES);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/consent');

    expect(res.status).toBe(401);
  });
});

describe('POST /consent/:id/revoke', () => {
  it('writes a revoked state onto the original record instead of deleting it', async () => {
    const participant = await registerUser('participant', 'p.consent.revoke@example.com');
    const created = await grantConsent(participant.token);
    const consentId = created.body.consent.id;

    const res = await request(app)
      .post(`/consent/${consentId}/revoke`)
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('consentRevoked');
    expect(res.body.consent.id).toBe(consentId);
    expect(res.body.consent.decision).toBe('revoked');
    expect(res.body.consent.revokedAt).toBeTruthy();
    // The original decision is still on the record: scope, recipients, and the
    // moment it was granted all survive the revocation.
    expect(res.body.consent.scope).toEqual(['Support needs summary']);
    expect(res.body.consent.recipients).toEqual(['Matched providers']);
    expect(res.body.consent.decidedAt).toBe(created.body.consent.decidedAt);

    const stored = await ConsentRecord.findById(consentId);
    expect(stored).not.toBeNull();
    expect(stored.decision).toBe('revoked');
    expect(stored.revokedAt).toBeInstanceOf(Date);
    expect(await ConsentRecord.countDocuments({})).toBe(1);
  });

  it('keeps the revoked record visible in the history', async () => {
    const participant = await registerUser('participant', 'p.consent.history@example.com');
    const created = await grantConsent(participant.token);

    await request(app)
      .post(`/consent/${created.body.consent.id}/revoke`)
      .set('Authorization', `Bearer ${participant.token}`);

    const res = await request(app).get('/consent').set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.consents).toHaveLength(1);
    expect(res.body.consents[0].decision).toBe('revoked');
  });

  it('is idempotent: revoking twice keeps the first revocation timestamp', async () => {
    const participant = await registerUser('participant', 'p.consent.twice@example.com');
    const created = await grantConsent(participant.token);
    const consentId = created.body.consent.id;

    const first = await request(app)
      .post(`/consent/${consentId}/revoke`)
      .set('Authorization', `Bearer ${participant.token}`);
    const second = await request(app)
      .post(`/consent/${consentId}/revoke`)
      .set('Authorization', `Bearer ${participant.token}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.consent.decision).toBe('revoked');
    expect(second.body.consent.revokedAt).toBe(first.body.consent.revokedAt);
    expect(await ConsentRecord.countDocuments({})).toBe(1);
  });

  it('lets a participant re-grant after revoking, leaving both events on record', async () => {
    const participant = await registerUser('participant', 'p.consent.regrant@example.com');
    const created = await grantConsent(participant.token);

    await request(app)
      .post(`/consent/${created.body.consent.id}/revoke`)
      .set('Authorization', `Bearer ${participant.token}`);
    const regranted = await grantConsent(participant.token);

    expect(regranted.status).toBe(201);

    const res = await request(app).get('/consent').set('Authorization', `Bearer ${participant.token}`);
    expect(res.body.consents).toHaveLength(2);
    expect(res.body.consents.map((c) => c.decision).sort()).toEqual(['granted', 'revoked']);
  });

  it('does not let one participant revoke another participant decision', async () => {
    const owner = await registerUser('participant', 'p.consent.owner@example.com');
    const stranger = await registerUser('participant', 'p.consent.stranger@example.com');
    const created = await grantConsent(owner.token);

    const res = await request(app)
      .post(`/consent/${created.body.consent.id}/revoke`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Consent record not found');

    const stored = await ConsentRecord.findById(created.body.consent.id);
    expect(stored.decision).toBe('granted');
  });

  it('does not let an admin revoke a participant decision through this endpoint', async () => {
    const participant = await registerUser('participant', 'p.consent.adminreach@example.com');
    const admin = await registerAdmin();
    const created = await grantConsent(participant.token);

    const res = await request(app)
      .post(`/consent/${created.body.consent.id}/revoke`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(404);

    const stored = await ConsentRecord.findById(created.body.consent.id);
    expect(stored.decision).toBe('granted');
  });

  it('returns 404 for a consent record that does not exist', async () => {
    const participant = await registerUser('participant', 'p.consent.missing@example.com');
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/consent/${missingId}/revoke`)
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Consent record not found');
  });

  it('requires authentication', async () => {
    const participant = await registerUser('participant', 'p.consent.revokeauth@example.com');
    const created = await grantConsent(participant.token);

    const res = await request(app).post(`/consent/${created.body.consent.id}/revoke`);

    expect(res.status).toBe(401);

    const stored = await ConsentRecord.findById(created.body.consent.id);
    expect(stored.decision).toBe('granted');
  });
});

describe('hasActiveConsent', () => {
  it('is false when nothing has ever been decided', async () => {
    const participant = await registerUser('participant', 'p.consent.active.none@example.com');

    await expect(hasActiveConsent(participant.user._id, 'providerDiscovery')).resolves.toBe(false);
  });

  it('is true while a granted decision stands', async () => {
    const participant = await registerUser('participant', 'p.consent.active.granted@example.com');
    await grantConsent(participant.token, { purpose: 'providerContact' });

    await expect(hasActiveConsent(participant.user._id, 'providerContact')).resolves.toBe(true);
  });

  it('is false once the latest decision for that purpose is revoked', async () => {
    const participant = await registerUser('participant', 'p.consent.active.revoked@example.com');
    const created = await grantConsent(participant.token, { purpose: 'providerContact' });

    await request(app)
      .post(`/consent/${created.body.consent.id}/revoke`)
      .set('Authorization', `Bearer ${participant.token}`);

    await expect(hasActiveConsent(participant.user._id, 'providerContact')).resolves.toBe(false);
  });

  it('is scoped to the purpose that was decided', async () => {
    const participant = await registerUser('participant', 'p.consent.active.scoped@example.com');
    await grantConsent(participant.token, { purpose: 'documentation' });

    await expect(hasActiveConsent(participant.user._id, 'documentation')).resolves.toBe(true);
    await expect(hasActiveConsent(participant.user._id, 'dataSharing')).resolves.toBe(false);
  });
});
