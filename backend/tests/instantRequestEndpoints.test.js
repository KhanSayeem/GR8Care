const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ServiceRequest = require('../src/models/ServiceRequest');
const User = require('../src/models/User');
const { INSTANT_REQUEST_BOUNDARY } = require('../src/services/instantRequestService');

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
  await ServiceRequest.deleteMany({});
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

function instantRequestPayload(providerId, overrides = {}) {
  return {
    preferredProviderId: providerId,
    title: 'Need support today',
    service: 'Community access',
    supportCategory: 'core',
    preferredStartDate: '2026-08-18T09:00:00.000Z',
    preferredEndDate: '2026-08-18T12:00:00.000Z',
    notes: 'Please respond quickly.',
    ...overrides,
  };
}

describe('instant requests API', () => {
  it('creates a submitted instant request with a future expiry for a participant', async () => {
    const participant = await registerUser('participant', 'participant.create.instant@example.com');
    const provider = await registerUser('provider', 'provider.create.instant@example.com');

    const res = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(provider.user._id));

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('instantRequestCreated');
    expect(res.body.boundary).toBe(INSTANT_REQUEST_BOUNDARY);
    expect(res.body.request).toEqual(
      expect.objectContaining({
        participantId: participant.user._id,
        preferredProviderId: provider.user._id,
        service: 'Community access',
        status: 'submitted',
      })
    );

    expect(res.body.request.expiresAt).toBeTruthy();
    expect(new Date(res.body.request.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const stored = await ServiceRequest.findById(res.body.request.id);
    expect(stored).toBeTruthy();
    expect(stored.status).toBe('submitted');
    expect(stored.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects instant requests targeting a non-existent or non-provider user', async () => {
    const participant = await registerUser('participant', 'participant.invalid.target@example.com');
    const otherParticipant = await registerUser('participant', 'participant.other.invalid.target@example.com');

    const missingProvider = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(undefined));
    const nonExistentProvider = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(new mongoose.Types.ObjectId()));
    const nonProviderTarget = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(otherParticipant.user._id));

    expect(missingProvider.status).toBe(400);
    expect(missingProvider.body.error).toBe('preferredProviderId is required');
    expect(nonExistentProvider.status).toBe(404);
    expect(nonExistentProvider.body.error).toBe('Provider not found');
    expect(nonProviderTarget.status).toBe(404);
    expect(nonProviderTarget.body.error).toBe('Provider not found');

    expect(await ServiceRequest.countDocuments()).toBe(0);
  });

  it('scopes live instant requests to the targeted provider only', async () => {
    const participant = await registerUser('participant', 'participant.scope.instant@example.com');
    const provider = await registerUser('provider', 'provider.scope.instant@example.com');
    const otherProvider = await registerUser('provider', 'provider.other.scope.instant@example.com');

    const createRes = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(provider.user._id));
    expect(createRes.status).toBe(201);

    const targetedRes = await request(app)
      .get('/requests?window=live')
      .set('Authorization', `Bearer ${provider.token}`);
    const otherRes = await request(app)
      .get('/requests?window=live')
      .set('Authorization', `Bearer ${otherProvider.token}`);

    expect(targetedRes.status).toBe(200);
    expect(targetedRes.body.mode).toBe('instantRequests');
    expect(targetedRes.body.requests.map((r) => r.id)).toEqual([createRes.body.request.id]);
    expect(otherRes.status).toBe(200);
    expect(otherRes.body.requests).toEqual([]);
  });

  it('lets the targeted provider accept a live request', async () => {
    const participant = await registerUser('participant', 'participant.accept.instant@example.com');
    const provider = await registerUser('provider', 'provider.accept.instant@example.com');

    const createRes = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(provider.user._id));

    const acceptRes = await request(app)
      .post(`/requests/${createRes.body.request.id}/accept`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send();

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.mode).toBe('instantRequestResponded');
    expect(acceptRes.body.request).toEqual(
      expect.objectContaining({
        id: createRes.body.request.id,
        status: 'accepted',
      })
    );
    expect(acceptRes.body.request.respondedAt).toBeTruthy();

    const stored = await ServiceRequest.findById(createRes.body.request.id);
    expect(stored.status).toBe('accepted');
    expect(stored.respondedAt).toBeTruthy();
  });

  it('returns 409 when accepting an already-responded-to request', async () => {
    const participant = await registerUser('participant', 'participant.double.accept.instant@example.com');
    const provider = await registerUser('provider', 'provider.double.accept.instant@example.com');

    const createRes = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(provider.user._id));

    const firstAccept = await request(app)
      .post(`/requests/${createRes.body.request.id}/accept`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send();
    expect(firstAccept.status).toBe(200);

    const secondAccept = await request(app)
      .post(`/requests/${createRes.body.request.id}/accept`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send();

    expect(secondAccept.status).toBe(409);
    expect(secondAccept.body.error).toBe('This request has already been responded to');
  });

  it('lets the targeted provider decline with a reason, surfaced in the past window', async () => {
    const participant = await registerUser('participant', 'participant.decline.instant@example.com');
    const provider = await registerUser('provider', 'provider.decline.instant@example.com');

    const createRes = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(provider.user._id));

    const declineRes = await request(app)
      .post(`/requests/${createRes.body.request.id}/decline`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send({ reason: 'Fully booked today' });

    expect(declineRes.status).toBe(200);
    expect(declineRes.body.request).toEqual(
      expect.objectContaining({
        status: 'declined',
        declineReason: 'Fully booked today',
      })
    );

    const pastRes = await request(app)
      .get('/requests?window=past')
      .set('Authorization', `Bearer ${provider.token}`);
    expect(pastRes.status).toBe(200);
    expect(pastRes.body.requests.map((r) => r.id)).toEqual([createRes.body.request.id]);

    const liveRes = await request(app)
      .get('/requests?window=live')
      .set('Authorization', `Bearer ${provider.token}`);
    expect(liveRes.body.requests).toEqual([]);
  });

  it('returns 404 (not 403) when a non-targeted provider tries to accept or decline', async () => {
    const participant = await registerUser('participant', 'participant.wrong.provider.instant@example.com');
    const provider = await registerUser('provider', 'provider.wrong.target.instant@example.com');
    const otherProvider = await registerUser('provider', 'provider.wrong.other.instant@example.com');

    const createRes = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${participant.token}`)
      .send(instantRequestPayload(provider.user._id));

    const wrongAccept = await request(app)
      .post(`/requests/${createRes.body.request.id}/accept`)
      .set('Authorization', `Bearer ${otherProvider.token}`)
      .send();
    const wrongDecline = await request(app)
      .post(`/requests/${createRes.body.request.id}/decline`)
      .set('Authorization', `Bearer ${otherProvider.token}`)
      .send();

    expect(wrongAccept.status).toBe(404);
    expect(wrongAccept.body.error).toBe('Instant request not found');
    expect(wrongDecline.status).toBe(404);
    expect(wrongDecline.body.error).toBe('Instant request not found');
  });

  it('expires stale requests: accepting past-expiry returns 409 and it moves from live to past', async () => {
    const participant = await registerUser('participant', 'participant.expired.instant@example.com');
    const provider = await registerUser('provider', 'provider.expired.instant@example.com');

    const expired = await ServiceRequest.create({
      participant: participant.user._id,
      requestedBy: participant.user._id,
      preferredProvider: provider.user._id,
      title: 'Already expired request',
      service: 'Community access',
      preferredStartDate: new Date('2026-08-18T09:00:00.000Z'),
      preferredEndDate: new Date('2026-08-18T12:00:00.000Z'),
      status: 'submitted',
      expiresAt: new Date(Date.now() - 60000),
    });

    const acceptRes = await request(app)
      .post(`/requests/${expired._id}/accept`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send();

    expect(acceptRes.status).toBe(409);
    expect(acceptRes.body.error).toMatch(/expired/i);

    const stored = await ServiceRequest.findById(expired._id);
    expect(stored.status).toBe('expired');

    const liveRes = await request(app)
      .get('/requests?window=live')
      .set('Authorization', `Bearer ${provider.token}`);
    const pastRes = await request(app)
      .get('/requests?window=past')
      .set('Authorization', `Bearer ${provider.token}`);

    expect(liveRes.body.requests.map((r) => r.id)).not.toContain(String(expired._id));
    expect(pastRes.body.requests.map((r) => r.id)).toContain(String(expired._id));
  });
});
