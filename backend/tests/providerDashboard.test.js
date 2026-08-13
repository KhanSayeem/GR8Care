const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ProviderAvailability = require('../src/models/ProviderAvailability');
const { PROVIDER_DASHBOARD_BOUNDARY } = require('../src/services/providerDashboard');
const { PROVIDER_AVAILABILITY_BOUNDARY } = require('../src/services/providerAvailability');

let mongod;
let app;

jest.setTimeout(120000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
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

describe('provider dashboard API', () => {
  it('returns provider stats from account and availability records', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Provider Dashboard',
      email: 'provider.dashboard@example.com',
      password: 'supersecret',
      role: 'provider',
    });

    await ProviderAvailability.create({
      provider: registration.body.user._id,
      blocks: [
        { day: 'Monday', start: '09:00', end: '12:00', service: 'Community access', enabled: true },
        { day: 'Tuesday', start: '13:00', end: '15:00', service: 'Plan review', enabled: false },
      ],
    });

    const res = await request(app)
      .get('/providers/me/stats')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('providerStats');
    expect(res.body.boundary).toBe(PROVIDER_DASHBOARD_BOUNDARY);
    expect(res.body.stats).toEqual(
      expect.objectContaining({
        displayName: 'Provider Dashboard',
        verified: false,
        subscriptionTier: 'starter',
        sessionsToday: 0,
        sessionsThisWeek: 0,
        earningsThisWeek: 0,
        rating: null,
        availabilityBlocks: 2,
        activeAvailabilityBlocks: 1,
      })
    );
    expect(res.body.stats.subscriptionAccess.tier).toBe('starter');
  });

  it('returns enabled schedule blocks for the requested day', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Provider Schedule',
      email: 'provider.schedule.today@example.com',
      password: 'supersecret',
      role: 'supportWorker',
    });

    await ProviderAvailability.create({
      provider: registration.body.user._id,
      blocks: [
        { day: 'Monday', start: '13:00', end: '15:00', service: 'Afternoon support', enabled: true },
        { day: 'Monday', start: '09:00', end: '11:00', service: 'Morning support', enabled: true },
        { day: 'Monday', start: '16:00', end: '18:00', service: 'Disabled block', enabled: false },
        { day: 'Tuesday', start: '09:00', end: '11:00', service: 'Wrong day', enabled: true },
      ],
    });

    const res = await request(app)
      .get('/providers/me/schedule-today?date=2026-08-17')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('providerScheduleToday');
    expect(res.body.boundary).toBe(PROVIDER_AVAILABILITY_BOUNDARY);
    expect(res.body.day).toBe('Monday');
    expect(res.body.schedule).toEqual([
      expect.objectContaining({ start: '09:00', service: 'Morning support', status: 'available' }),
      expect.objectContaining({ start: '13:00', service: 'Afternoon support', status: 'available' }),
    ]);
  });

  it('requires provider roles and validates date format', async () => {
    const participant = await request(app).post('/auth/register').send({
      fullName: 'Participant Dashboard',
      email: 'participant.dashboard@example.com',
      password: 'supersecret',
      role: 'participant',
    });
    const provider = await request(app).post('/auth/register').send({
      fullName: 'Provider Date',
      email: 'provider.date@example.com',
      password: 'supersecret',
      role: 'provider',
    });

    const forbidden = await request(app)
      .get('/providers/me/stats')
      .set('Authorization', `Bearer ${participant.body.token}`);
    const invalidDate = await request(app)
      .get('/providers/me/schedule-today?date=not-a-date')
      .set('Authorization', `Bearer ${provider.body.token}`);

    expect(forbidden.status).toBe(403);
    expect(invalidDate.status).toBe(400);
    expect(invalidDate.body.error).toBe('date must use YYYY-MM-DD');
  });
});
