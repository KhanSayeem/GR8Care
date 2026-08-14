const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ProviderProfile = require('../src/models/ProviderProfile');
const User = require('../src/models/User');
const {
  PROVIDER_MATCHING_BOUNDARY,
  computeCompatibilityScore,
} = require('../src/services/providerMatching');

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
  await ProviderProfile.deleteMany({});
  await User.deleteMany({});
});

async function registerUser(role, email, overrides = {}) {
  const res = await request(app).post('/auth/register').send({
    fullName: overrides.fullName || `${role} user`,
    email,
    password: 'supersecret',
    role,
    ...overrides,
  });
  return res.body;
}

function saveMyProfile(token, payload) {
  return request(app)
    .post('/providers/me/profile')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

describe('computeCompatibilityScore', () => {
  it('scores near 100 when location, language, and goals all match', () => {
    const participant = {
      location: 'Parramatta',
      language: 'en',
      goals: ['Community access', 'Independence'],
    };
    const providerProfile = {
      location: 'Parramatta',
      languages: [],
      services: ['Community access', 'Independence', 'Transport support'],
    };

    expect(computeCompatibilityScore(participant, providerProfile)).toEqual({
      score: 100,
      breakdown: { location: 100, language: 100, goals: 100 },
    });
  });

  it('treats missing participant location/language as neutral and scores zero goal overlap', () => {
    const participant = { location: '', language: '', goals: ['Woodworking'] };
    const providerProfile = {
      location: 'Sydney',
      languages: ['English'],
      services: ['Transport support'],
    };

    expect(computeCompatibilityScore(participant, providerProfile)).toEqual({
      score: 33,
      breakdown: { location: 50, language: 50, goals: 0 },
    });
  });

  it('scores the goals factor as zero when the provider has no services, even with participant goals', () => {
    const participant = { location: 'Sydney', language: 'en', goals: ['Community access'] };
    const providerProfile = { location: 'Sydney', languages: [], services: [] };

    expect(computeCompatibilityScore(participant, providerProfile)).toEqual({
      score: 67,
      breakdown: { location: 100, language: 100, goals: 0 },
    });
  });

  it('matches an ISO language code against the freeform language name a provider actually typed in', () => {
    const participant = { location: '', language: 'en', goals: [] };
    const providerProfile = { location: '', languages: ['English', 'Vietnamese'], services: [] };

    expect(computeCompatibilityScore(participant, providerProfile).breakdown.language).toBe(100);
  });

  it('does not match an unrelated language name against a participant language code', () => {
    const participant = { location: '', language: 'en', goals: [] };
    const providerProfile = { location: '', languages: ['Vietnamese'], services: [] };

    expect(computeCompatibilityScore(participant, providerProfile).breakdown.language).toBe(0);
  });
});

describe('POST /providers/me/profile', () => {
  it('lets a provider create their profile with platform-controlled defaults', async () => {
    const provider = await registerUser('provider', 'provider.create.profile@example.com', {
      fullName: 'Profile Provider',
    });

    const res = await saveMyProfile(provider.token, {
      location: 'Melbourne',
      languages: ['English'],
      services: ['Personal care'],
      hourlyRate: 55,
      bio: 'Experienced support worker.',
    });

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('providerProfile');
    expect(res.body.boundary).toBe(PROVIDER_MATCHING_BOUNDARY);
    expect(res.body.profile).toEqual(
      expect.objectContaining({
        id: provider.user._id,
        name: 'Profile Provider',
        location: 'Melbourne',
        languages: ['English'],
        services: ['Personal care'],
        hourlyRate: 55,
        acceptingNewParticipants: true,
        abnVerificationStatus: 'unverified',
        rating: null,
        bio: 'Experienced support worker.',
        abn: '',
        email: 'provider.create.profile@example.com',
      })
    );
  });

  it('does not wipe platform-set rating/abnVerificationStatus on a later self-service update', async () => {
    const provider = await registerUser('provider', 'provider.update.profile@example.com');

    const created = await saveMyProfile(provider.token, {
      location: 'Melbourne',
      services: ['Personal care'],
    });
    expect(created.status).toBe(201);
    expect(created.body.profile.rating).toBeNull();
    expect(created.body.profile.abnVerificationStatus).toBe('unverified');

    await ProviderProfile.findOneAndUpdate(
      { provider: provider.user._id },
      { $set: { rating: 4.2, abnVerificationStatus: 'verified' } }
    );

    const updated = await saveMyProfile(provider.token, {
      location: 'Melbourne CBD',
      services: ['Community access'],
    });

    expect(updated.status).toBe(201);
    expect(updated.body.profile.location).toBe('Melbourne CBD');
    expect(updated.body.profile.services).toEqual(['Community access']);
    expect(updated.body.profile.rating).toBe(4.2);
    expect(updated.body.profile.abnVerificationStatus).toBe('verified');
  });

  it('rejects a profile payload without a location', async () => {
    const provider = await registerUser('provider', 'provider.invalid.profile@example.com');

    const res = await saveMyProfile(provider.token, { services: ['Personal care'] });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.arrayContaining([expect.stringContaining('location is required')]));
  });

  it('rejects a participant trying to write a provider profile (role gating)', async () => {
    const participant = await registerUser('participant', 'participant.role.gate@example.com');

    const res = await saveMyProfile(participant.token, { location: 'Melbourne' });

    expect(res.status).toBe(403);
  });
});

describe('GET /providers/me/profile', () => {
  it('returns profile: null before any save, then the real profile after saving', async () => {
    const provider = await registerUser('provider', 'provider.get.profile@example.com');

    const before = await request(app)
      .get('/providers/me/profile')
      .set('Authorization', `Bearer ${provider.token}`);

    expect(before.status).toBe(200);
    expect(before.body.mode).toBe('providerProfile');
    expect(before.body.profile).toBeNull();

    await saveMyProfile(provider.token, { location: 'Brisbane', services: ['Transport support'] });

    const after = await request(app)
      .get('/providers/me/profile')
      .set('Authorization', `Bearer ${provider.token}`);

    expect(after.status).toBe(200);
    expect(after.body.profile).toEqual(
      expect.objectContaining({ location: 'Brisbane', services: ['Transport support'] })
    );
  });
});

describe('GET /providers', () => {
  async function seedMatchingScenario() {
    const providerA = await registerUser('provider', 'provider.a.match@example.com', {
      fullName: 'Provider Alpha',
    });
    await saveMyProfile(providerA.token, {
      location: 'Parramatta',
      languages: [],
      services: ['Community access', 'Personal care'],
      hourlyRate: 50,
    });

    const providerB = await registerUser('provider', 'provider.b.match@example.com', {
      fullName: 'Provider Beta',
    });
    await saveMyProfile(providerB.token, {
      location: 'Sydney CBD',
      languages: ['Vietnamese'],
      services: ['Transport support'],
      hourlyRate: 40,
    });

    const participant = await registerUser('participant', 'participant.match@example.com');
    await User.findByIdAndUpdate(participant.user._id, {
      location: 'Parramatta',
      language: 'en',
      goals: ['Community access', 'Mobility support'],
    });

    return { providerA, providerB, participant };
  }

  it('computes non-null compatibility scores for a participant and sorts the higher-affinity provider first', async () => {
    const { providerA, providerB, participant } = await seedMatchingScenario();

    const res = await request(app)
      .get('/providers')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('providers');
    expect(res.body.boundary).toBe(PROVIDER_MATCHING_BOUNDARY);
    expect(res.body.providers).toHaveLength(2);
    expect(res.body.providers.every((provider) => typeof provider.compatibilityScore === 'number')).toBe(true);
    expect(res.body.providers[0].id).toBe(providerA.user._id);
    expect(res.body.providers[1].id).toBe(providerB.user._id);
    expect(res.body.providers[0].compatibilityScore).toBeGreaterThan(res.body.providers[1].compatibilityScore);
  });

  it('returns null compatibility scores for a non-participant requester', async () => {
    await seedMatchingScenario();
    const admin = await registerUser('admin', 'admin.match@example.com');

    const res = await request(app)
      .get('/providers')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.providers).toHaveLength(2);
    expect(res.body.providers.every((provider) => provider.compatibilityScore === null)).toBe(true);
    expect(res.body.providers.every((provider) => provider.compatibilityBreakdown === null)).toBe(true);
  });

  it('narrows results with the near filter', async () => {
    const { providerA, participant } = await seedMatchingScenario();

    const res = await request(app)
      .get('/providers?near=Parramatta')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.filter.near).toBe('Parramatta');
    expect(res.body.providers).toHaveLength(1);
    expect(res.body.providers[0].id).toBe(providerA.user._id);
  });

  it('narrows results with the language filter', async () => {
    const { providerB, participant } = await seedMatchingScenario();

    const res = await request(app)
      .get('/providers?language=Vietnamese')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.filter.language).toBe('Vietnamese');
    expect(res.body.providers).toHaveLength(1);
    expect(res.body.providers[0].id).toBe(providerB.user._id);
  });

  it('narrows results with the goals filter', async () => {
    const { providerB, participant } = await seedMatchingScenario();

    const res = await request(app)
      .get('/providers?goals=Transport support')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.filter.goals).toEqual(['Transport support']);
    expect(res.body.providers).toHaveLength(1);
    expect(res.body.providers[0].id).toBe(providerB.user._id);
  });

  it('reorders results with the topRated filter, sorting nulls last', async () => {
    const { providerA, providerB, participant } = await seedMatchingScenario();

    await ProviderProfile.findOneAndUpdate({ provider: providerB.user._id }, { $set: { rating: 4.5 } });

    const res = await request(app)
      .get('/providers?topRated=true')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.filter.topRated).toBe(true);
    expect(res.body.providers[0].id).toBe(providerB.user._id);
    expect(res.body.providers[0].rating).toBe(4.5);
    expect(res.body.providers[1].id).toBe(providerA.user._id);
    expect(res.body.providers[1].rating).toBeNull();
  });

  it('excludes providers without a saved ProviderProfile', async () => {
    const { participant } = await seedMatchingScenario();
    const providerC = await registerUser('provider', 'provider.c.no.profile@example.com');

    const res = await request(app)
      .get('/providers')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.providers.map((provider) => provider.id)).not.toContain(providerC.user._id);
  });
});

describe('GET /providers/:id', () => {
  it('returns full profile detail including bio, abn, and email', async () => {
    const provider = await registerUser('provider', 'provider.detail@example.com', {
      fullName: 'Detail Provider',
    });
    await saveMyProfile(provider.token, {
      location: 'Perth',
      languages: ['English'],
      services: ['Community access'],
      hourlyRate: 60,
      bio: 'About this provider.',
      abn: '12345678901',
    });

    const participant = await registerUser('participant', 'participant.detail@example.com');

    const res = await request(app)
      .get(`/providers/${provider.user._id}`)
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('providerDetail');
    expect(res.body.boundary).toBe(PROVIDER_MATCHING_BOUNDARY);
    expect(res.body.provider).toEqual(
      expect.objectContaining({
        id: provider.user._id,
        name: 'Detail Provider',
        bio: 'About this provider.',
        abn: '12345678901',
        email: 'provider.detail@example.com',
      })
    );
  });

  it('returns 404 for a malformed id', async () => {
    const participant = await registerUser('participant', 'participant.detail.invalid@example.com');

    const res = await request(app)
      .get('/providers/not-a-valid-id')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for a valid but unrelated ObjectId', async () => {
    const participant = await registerUser('participant', 'participant.detail.missing@example.com');

    const res = await request(app)
      .get(`/providers/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for a provider with no saved ProviderProfile', async () => {
    const provider = await registerUser('provider', 'provider.detail.no.profile@example.com');
    const participant = await registerUser('participant', 'participant.detail.no.profile@example.com');

    const res = await request(app)
      .get(`/providers/${provider.user._id}`)
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(404);
  });
});
