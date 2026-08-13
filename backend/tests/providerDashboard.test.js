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

  it('returns the provider schedule for the requested range', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Provider Weekly Schedule',
      email: 'provider.schedule.week@example.com',
      password: 'supersecret',
      role: 'provider',
    });

    await ProviderAvailability.create({
      provider: registration.body.user._id,
      blocks: [
        { day: 'Tuesday', start: '14:00', end: '16:00', service: 'Afternoon support', enabled: true },
        { day: 'Monday', start: '12:00', end: '13:00', service: 'Lunch support', enabled: true },
        { day: 'Monday', start: '08:00', end: '10:00', service: 'Morning support', enabled: true },
        { day: 'Monday', start: '17:00', end: '18:00', service: 'Disabled support', enabled: false },
      ],
    });

    const res = await request(app)
      .get('/providers/me/schedule?date=2026-08-19&range=this-week')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('providerSchedule');
    expect(res.body.boundary).toBe(PROVIDER_AVAILABILITY_BOUNDARY);
    expect(res.body.range).toBe('this-week');
    expect(res.body.startDate).toBe('2026-08-17');
    expect(res.body.endDate).toBe('2026-08-23');
    expect(res.body.schedule).toHaveLength(7);
    expect(res.body.schedule[0]).toEqual(
      expect.objectContaining({
        date: '2026-08-17',
        day: 'Monday',
        blocks: [
          expect.objectContaining({ start: '08:00', service: 'Morning support', status: 'available' }),
          expect.objectContaining({ start: '12:00', service: 'Lunch support', status: 'available' }),
        ],
      })
    );
    expect(res.body.schedule[1]).toEqual(
      expect.objectContaining({
        date: '2026-08-18',
        day: 'Tuesday',
        blocks: [expect.objectContaining({ start: '14:00', service: 'Afternoon support' })],
      })
    );
  });

  it('supports next-week and month provider schedule windows', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Provider Schedule Windows',
      email: 'provider.schedule.windows@example.com',
      password: 'supersecret',
      role: 'provider',
    });

    const nextWeek = await request(app)
      .get('/providers/me/schedule?date=2026-08-19&range=next-week')
      .set('Authorization', `Bearer ${registration.body.token}`);
    const month = await request(app)
      .get('/providers/me/schedule?date=2026-02-12&range=month')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(nextWeek.status).toBe(200);
    expect(nextWeek.body.startDate).toBe('2026-08-24');
    expect(nextWeek.body.endDate).toBe('2026-08-30');
    expect(nextWeek.body.schedule).toHaveLength(7);

    expect(month.status).toBe(200);
    expect(month.body.startDate).toBe('2026-02-01');
    expect(month.body.endDate).toBe('2026-02-28');
    expect(month.body.schedule).toHaveLength(28);
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
    const invalidRange = await request(app)
      .get('/providers/me/schedule?range=quarter')
      .set('Authorization', `Bearer ${provider.body.token}`);

    expect(forbidden.status).toBe(403);
    expect(invalidDate.status).toBe(400);
    expect(invalidDate.body.error).toBe('date must use YYYY-MM-DD');
    expect(invalidRange.status).toBe(400);
    expect(invalidRange.body.error).toBe('range must be one of: this-week, next-week, month');
  });
});
