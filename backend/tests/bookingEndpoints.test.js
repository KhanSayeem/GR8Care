const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../src/models/Booking');
const ProviderAvailability = require('../src/models/ProviderAvailability');
const ServiceRequest = require('../src/models/ServiceRequest');
const User = require('../src/models/User');
const { BOOKING_REQUEST_BOUNDARY } = require('../src/services/bookingService');

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
  await ProviderAvailability.deleteMany({});
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

async function seedProviderAvailability(providerId) {
  return ProviderAvailability.create({
    provider: providerId,
    blocks: [
      { day: 'Tuesday', start: '09:00', end: '12:00', service: 'Community access', enabled: true },
      { day: 'Tuesday', start: '13:00', end: '15:00', service: 'Disabled window', enabled: false },
    ],
  });
}

describe('booking creation API', () => {
  it('creates a pending booking inside provider availability', async () => {
    const participant = await registerUser('participant', 'participant.create.booking@example.com');
    const provider = await registerUser('provider', 'provider.create.booking@example.com');
    await seedProviderAvailability(provider.user._id);
    const serviceRequest = await ServiceRequest.create({
      participant: participant.user._id,
      requestedBy: participant.user._id,
      preferredProvider: provider.user._id,
      title: 'Community access request',
      service: 'Community access',
      preferredStartDate: new Date('2026-08-18T09:00:00.000Z'),
      preferredEndDate: new Date('2026-08-18T12:00:00.000Z'),
    });

    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        providerId: provider.user._id,
        serviceRequestId: serviceRequest._id,
        service: 'Community access',
        supportCategory: 'core',
        scheduledStart: '2026-08-18T09:30:00.000Z',
        scheduledEnd: '2026-08-18T10:30:00.000Z',
        location: 'Participant home',
        notes: 'Bring visual schedule.',
      });

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('bookingCreated');
    expect(res.body.boundary).toBe(BOOKING_REQUEST_BOUNDARY);
    expect(res.body.booking).toEqual(
      expect.objectContaining({
        participantId: participant.user._id,
        providerId: provider.user._id,
        serviceRequestId: String(serviceRequest._id),
        service: 'Community access',
        supportCategory: 'core',
        status: 'pending',
        location: 'Participant home',
        notes: 'Bring visual schedule.',
      })
    );

    const stored = await Booking.findById(res.body.booking.id);
    expect(stored).toBeTruthy();
    expect(stored.availabilityBlockId).toBeTruthy();
    expect(String(stored.serviceRequest)).toBe(String(serviceRequest._id));
  });

  it('rejects bookings outside enabled provider availability', async () => {
    const participant = await registerUser('participant', 'participant.outside.booking@example.com');
    const provider = await registerUser('provider', 'provider.outside.booking@example.com');
    await seedProviderAvailability(provider.user._id);

    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        providerId: provider.user._id,
        service: 'Community access',
        scheduledStart: '2026-08-18T12:30:00.000Z',
        scheduledEnd: '2026-08-18T13:30:00.000Z',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Requested time is outside provider availability');
    expect(await Booking.countDocuments()).toBe(0);
  });

  it('rejects active provider booking conflicts', async () => {
    const participant = await registerUser('participant', 'participant.conflict.booking@example.com');
    const provider = await registerUser('provider', 'provider.conflict.booking@example.com');
    await seedProviderAvailability(provider.user._id);
    await Booking.create({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Community access',
      scheduledStart: new Date('2026-08-18T09:00:00.000Z'),
      scheduledEnd: new Date('2026-08-18T10:00:00.000Z'),
      status: 'confirmed',
    });

    const res = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        providerId: provider.user._id,
        service: 'Community access',
        scheduledStart: '2026-08-18T09:30:00.000Z',
        scheduledEnd: '2026-08-18T10:30:00.000Z',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Requested time conflicts with an existing booking');
    expect(await Booking.countDocuments()).toBe(1);
  });

  it('validates payloads, provider identity, and requester permissions', async () => {
    const participant = await registerUser('participant', 'participant.invalid.create.booking@example.com');
    const otherParticipant = await registerUser('participant', 'participant.other.create.booking@example.com');
    const provider = await registerUser('provider', 'provider.invalid.create.booking@example.com');
    const providerRequester = await registerUser('provider', 'provider.requester.create.booking@example.com');

    const missingService = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        providerId: provider.user._id,
        scheduledStart: '2026-08-18T09:30:00.000Z',
        scheduledEnd: '2026-08-18T10:30:00.000Z',
      });
    const wrongProvider = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        providerId: otherParticipant.user._id,
        service: 'Community access',
        scheduledStart: '2026-08-18T09:30:00.000Z',
        scheduledEnd: '2026-08-18T10:30:00.000Z',
      });
    const wrongParticipant = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        participantId: otherParticipant.user._id,
        providerId: provider.user._id,
        service: 'Community access',
        scheduledStart: '2026-08-18T09:30:00.000Z',
        scheduledEnd: '2026-08-18T10:30:00.000Z',
      });
    const providerCannotRequest = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${providerRequester.token}`)
      .send({
        providerId: provider.user._id,
        service: 'Community access',
        scheduledStart: '2026-08-18T09:30:00.000Z',
        scheduledEnd: '2026-08-18T10:30:00.000Z',
      });
    const missingServiceRequest = await request(app)
      .post('/bookings')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        providerId: provider.user._id,
        serviceRequestId: new mongoose.Types.ObjectId(),
        service: 'Community access',
        scheduledStart: '2026-08-18T09:30:00.000Z',
        scheduledEnd: '2026-08-18T10:30:00.000Z',
      });

    expect(missingService.status).toBe(400);
    expect(missingService.body.error).toBe('service is required');
    expect(wrongProvider.status).toBe(404);
    expect(wrongProvider.body.error).toBe('Provider not found');
    expect(wrongParticipant.status).toBe(403);
    expect(wrongParticipant.body.error).toBe('Participants can only request bookings for their own account');
    expect(providerCannotRequest.status).toBe(403);
    expect(providerCannotRequest.body.error).toBe('Only participants, caregivers, or admins can request bookings');
    expect(missingServiceRequest.status).toBe(404);
    expect(missingServiceRequest.body.error).toBe('Service request not found');
  });
});
