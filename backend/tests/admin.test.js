const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../src/models/Booking');
const ProviderProfile = require('../src/models/ProviderProfile');
const User = require('../src/models/User');

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
  await Booking.deleteMany({});
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

async function registerAdmin(email = 'admin@example.com') {
  return registerUser('admin', email, { fullName: 'Admin User' });
}

describe('GET /admin/stats', () => {
  it('returns correct counts for a seeded set of users, providers, and bookings', async () => {
    const admin = await registerAdmin();

    const participant1 = await registerUser('participant', 'participant1.stats@example.com');
    await registerUser('participant', 'participant2.stats@example.com');
    await registerUser('caregiver', 'caregiver1.stats@example.com');

    const provider1 = await registerUser('provider', 'provider1.stats@example.com');
    await registerUser('provider', 'provider2.stats@example.com');
    await registerUser('supportWorker', 'supportworker1.stats@example.com');

    await saveMyProfile(provider1.token, { location: 'Sydney', services: ['Personal care'] });
    await ProviderProfile.findOneAndUpdate(
      { provider: provider1.user._id },
      { $set: { abnVerificationStatus: 'pending' } }
    );

    const bookingBase = {
      participant: participant1.user._id,
      provider: provider1.user._id,
      service: 'Personal care',
      scheduledStart: new Date(Date.now() + 60 * 60 * 1000),
      scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };

    await Booking.create({ ...bookingBase, status: 'pending' });
    await Booking.create({ ...bookingBase, status: 'confirmed' });
    await Booking.create({ ...bookingBase, status: 'inProgress' });

    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('adminStats');
    expect(res.body.boundary).toEqual(expect.stringContaining('not a substitute for financial reconciliation'));
    expect(res.body.stats).toEqual({
      totalUsers: 7,
      totalParticipants: 3,
      totalProviders: 3,
      pendingVerifications: 1,
      bookingsToday: 3,
      activeBookings: 2,
    });
  });

  it('rejects a non-admin token with 403', async () => {
    const participant = await registerUser('participant', 'participant.stats.403@example.com');

    const res = await request(app)
      .get('/admin/stats')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /admin/users', () => {
  it('filters by role', async () => {
    const admin = await registerAdmin('admin.role@example.com');
    await registerUser('participant', 'participant.role@example.com');
    await registerUser('provider', 'provider.role@example.com');

    const res = await request(app)
      .get('/admin/users?role=provider')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('adminUserList');
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].role).toBe('provider');
  });

  it('filters by status', async () => {
    const admin = await registerAdmin('admin.status@example.com');
    const suspended = await registerUser('participant', 'participant.suspended@example.com');
    await registerUser('participant', 'participant.active@example.com');
    await User.findByIdAndUpdate(suspended.user._id, { isActive: false });

    const res = await request(app)
      .get('/admin/users?status=suspended')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].email).toBe('participant.suspended@example.com');
  });

  it('filters by search term against fullName or email', async () => {
    const admin = await registerAdmin('admin.search@example.com');
    await registerUser('participant', 'zelda.search@example.com', { fullName: 'Zelda Search' });
    await registerUser('participant', 'other.user@example.com', { fullName: 'Someone Else' });

    const res = await request(app)
      .get('/admin/users?search=zelda')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].fullName).toBe('Zelda Search');
  });

  it('paginates results', async () => {
    const admin = await registerAdmin('admin.paginate@example.com');

    const docs = Array.from({ length: 22 }, (_, i) => ({
      fullName: `Bulk User ${i}`,
      email: `bulk.user.${i}@example.com`,
      password: 'supersecret',
      role: 'participant',
    }));
    await User.create(docs);

    const pageOne = await request(app)
      .get('/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(pageOne.status).toBe(200);
    expect(pageOne.body.users).toHaveLength(10);
    expect(pageOne.body.pagination).toEqual({ page: 1, limit: 10, total: 23, totalPages: 3 });

    const pageThree = await request(app)
      .get('/admin/users?page=3&limit=10')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(pageThree.status).toBe(200);
    expect(pageThree.body.users).toHaveLength(3);
  });

  it('rejects a non-admin token with 403', async () => {
    const participant = await registerUser('participant', 'participant.users.403@example.com');

    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /admin/providers/pending', () => {
  it('returns only pending profiles with populated provider info', async () => {
    const admin = await registerAdmin('admin.pending@example.com');

    const pendingProvider = await registerUser('provider', 'provider.pending@example.com', {
      fullName: 'Pending Provider',
    });
    await saveMyProfile(pendingProvider.token, { location: 'Melbourne', services: ['Community access'] });
    await ProviderProfile.findOneAndUpdate(
      { provider: pendingProvider.user._id },
      { $set: { abnVerificationStatus: 'pending' } }
    );

    const verifiedProvider = await registerUser('provider', 'provider.verified@example.com');
    await saveMyProfile(verifiedProvider.token, { location: 'Perth', services: ['Personal care'] });
    await ProviderProfile.findOneAndUpdate(
      { provider: verifiedProvider.user._id },
      { $set: { abnVerificationStatus: 'verified' } }
    );

    const res = await request(app)
      .get('/admin/providers/pending')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('adminPendingProviders');
    expect(res.body.providers).toHaveLength(1);
    expect(res.body.providers[0].provider).toEqual(
      expect.objectContaining({
        id: pendingProvider.user._id,
        fullName: 'Pending Provider',
        email: 'provider.pending@example.com',
      })
    );
    expect(res.body.providers[0].location).toBe('Melbourne');
  });
});

describe('POST /admin/providers/:id/approve and /reject', () => {
  async function seedPendingProfile(email) {
    const provider = await registerUser('provider', email, { fullName: 'Verify Provider' });
    await saveMyProfile(provider.token, { location: 'Adelaide', services: ['Personal care'] });
    const profile = await ProviderProfile.findOneAndUpdate(
      { provider: provider.user._id },
      { $set: { abnVerificationStatus: 'pending' } },
      { new: true }
    );
    return { provider, profile };
  }

  it('approves a pending provider profile', async () => {
    const admin = await registerAdmin('admin.approve@example.com');
    const { profile } = await seedPendingProfile('provider.approve@example.com');

    const res = await request(app)
      .post(`/admin/providers/${profile._id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('adminProviderVerification');
    expect(res.body.provider.abnVerificationStatus).toBe('verified');

    const updated = await ProviderProfile.findById(profile._id);
    expect(updated.abnVerificationStatus).toBe('verified');
  });

  it('400s when approving a non-pending profile', async () => {
    const admin = await registerAdmin('admin.approve.400@example.com');
    const { profile } = await seedPendingProfile('provider.approve.400@example.com');
    await ProviderProfile.updateOne({ _id: profile._id }, { $set: { abnVerificationStatus: 'verified' } });

    const res = await request(app)
      .post(`/admin/providers/${profile._id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(400);
  });

  it('rejects a pending provider profile', async () => {
    const admin = await registerAdmin('admin.reject@example.com');
    const { profile } = await seedPendingProfile('provider.reject@example.com');

    const res = await request(app)
      .post(`/admin/providers/${profile._id}/reject`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('adminProviderVerification');
    expect(res.body.provider.abnVerificationStatus).toBe('rejected');

    const updated = await ProviderProfile.findById(profile._id);
    expect(updated.abnVerificationStatus).toBe('rejected');
  });

  it('400s when rejecting a non-pending profile', async () => {
    const admin = await registerAdmin('admin.reject.400@example.com');
    const { profile } = await seedPendingProfile('provider.reject.400@example.com');
    await ProviderProfile.updateOne({ _id: profile._id }, { $set: { abnVerificationStatus: 'rejected' } });

    const res = await request(app)
      .post(`/admin/providers/${profile._id}/reject`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(400);
  });
});
