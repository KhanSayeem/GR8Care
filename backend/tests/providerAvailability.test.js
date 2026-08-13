const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ProviderAvailability = require('../src/models/ProviderAvailability');
const {
  PROVIDER_AVAILABILITY_BOUNDARY,
  normalizeAvailabilityBlock,
  validateAvailabilityBlocks,
} = require('../src/services/providerAvailability');

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

describe('provider availability API', () => {
  it('normalizes and validates availability blocks', () => {
    expect(
      normalizeAvailabilityBlock({
        day: ' Monday ',
        start: '09:00',
        end: '12:00',
        service: ' Community   access ',
      })
    ).toEqual({
      day: 'Monday',
      start: '09:00',
      end: '12:00',
      service: 'Community access',
      enabled: true,
    });

    expect(
      validateAvailabilityBlocks([
        { day: 'Funday', start: '12:00', end: '09:00', service: '' },
      ])
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('day must be one of'),
        expect.stringContaining('start must be before end'),
      ])
    );
  });

  it('lets providers save their own availability blocks', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Provider One',
      email: 'provider.availability@example.com',
      password: 'supersecret',
      role: 'provider',
    });

    const res = await request(app)
      .post('/providers/me/availability')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({
        blocks: [
          {
            day: 'Monday',
            start: '09:00',
            end: '12:00',
            service: 'Community access',
            enabled: true,
          },
          {
            day: 'Wednesday',
            start: '13:30',
            end: '16:00',
            service: 'In-home support',
            enabled: false,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('providerAvailability');
    expect(res.body.boundary).toBe(PROVIDER_AVAILABILITY_BOUNDARY);
    expect(res.body.availability.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          day: 'Monday',
          start: '09:00',
          end: '12:00',
          service: 'Community access',
          enabled: true,
        }),
        expect.objectContaining({
          day: 'Wednesday',
          enabled: false,
        }),
      ])
    );

    const stored = await ProviderAvailability.findOne({
      provider: registration.body.user._id,
    });
    expect(stored.blocks).toHaveLength(2);
    expect(stored.blocks[0].service).toBe('Community access');
  });

  it('allows support workers to use the same provider availability endpoint for MVP', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Worker One',
      email: 'worker.availability@example.com',
      password: 'supersecret',
      role: 'supportWorker',
    });

    const res = await request(app)
      .post('/providers/me/availability')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({
        blocks: [
          {
            day: 'Friday',
            start: '08:30',
            end: '11:30',
            service: 'Transport support',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.availability.blocks[0]).toEqual(
      expect.objectContaining({
        day: 'Friday',
        enabled: true,
      })
    );
  });

  it('rejects participant access and invalid availability payloads', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Participant One',
      email: 'participant.availability@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    const forbiddenRes = await request(app)
      .post('/providers/me/availability')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({
        blocks: [{ day: 'Monday', start: '09:00', end: '12:00', service: 'Community access' }],
      });

    expect(forbiddenRes.status).toBe(403);

    const providerRegistration = await request(app).post('/auth/register').send({
      fullName: 'Provider Invalid',
      email: 'provider.invalid.availability@example.com',
      password: 'supersecret',
      role: 'provider',
    });
    const invalidRes = await request(app)
      .post('/providers/me/availability')
      .set('Authorization', `Bearer ${providerRegistration.body.token}`)
      .send({
        blocks: [{ day: 'Monday', start: '17:00', end: '09:00', service: 'Community access' }],
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toBe('Invalid provider availability');
    expect(invalidRes.body.details).toEqual(
      expect.arrayContaining([expect.stringContaining('start must be before end')])
    );
  });
});
