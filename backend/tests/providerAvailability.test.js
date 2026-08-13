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

  it('returns open availability slots for a provider date range', async () => {
    const providerRegistration = await request(app).post('/auth/register').send({
      fullName: 'Provider Slots',
      email: 'provider.slots@example.com',
      password: 'supersecret',
      role: 'provider',
    });
    const participantRegistration = await request(app).post('/auth/register').send({
      fullName: 'Participant Slots',
      email: 'participant.slots@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    await ProviderAvailability.create({
      provider: providerRegistration.body.user._id,
      blocks: [
        { day: 'Monday', start: '12:00', end: '14:00', service: 'Afternoon support', enabled: true },
        { day: 'Monday', start: '08:00', end: '10:00', service: 'Morning support', enabled: true },
        { day: 'Monday', start: '15:00', end: '16:00', service: 'Disabled support', enabled: false },
        { day: 'Tuesday', start: '09:00', end: '11:00', service: 'Transport support', enabled: true },
      ],
    });

    const res = await request(app)
      .get(`/providers/${providerRegistration.body.user._id}/availability?startDate=2026-08-17&endDate=2026-08-18`)
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('providerAvailabilitySlots');
    expect(res.body.boundary).toBe(PROVIDER_AVAILABILITY_BOUNDARY);
    expect(res.body.provider).toEqual(
      expect.objectContaining({
        id: providerRegistration.body.user._id,
        displayName: 'Provider Slots',
      })
    );
    expect(res.body.startDate).toBe('2026-08-17');
    expect(res.body.endDate).toBe('2026-08-18');
    expect(res.body.days).toEqual([
      expect.objectContaining({
        date: '2026-08-17',
        day: 'Monday',
        openSlots: [
          expect.objectContaining({ start: '08:00', service: 'Morning support', status: 'available' }),
          expect.objectContaining({ start: '12:00', service: 'Afternoon support', status: 'available' }),
        ],
      }),
      expect.objectContaining({
        date: '2026-08-18',
        day: 'Tuesday',
        openSlots: [expect.objectContaining({ start: '09:00', service: 'Transport support' })],
      }),
    ]);
  });

  it('returns empty days for providers without availability records', async () => {
    const providerRegistration = await request(app).post('/auth/register').send({
      fullName: 'Provider No Slots',
      email: 'provider.no.slots@example.com',
      password: 'supersecret',
      role: 'supportWorker',
    });
    const participantRegistration = await request(app).post('/auth/register').send({
      fullName: 'Participant No Slots',
      email: 'participant.no.slots@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    const res = await request(app)
      .get(`/providers/${providerRegistration.body.user._id}/availability?startDate=2026-08-17&endDate=2026-08-17`)
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.days).toEqual([
      expect.objectContaining({
        date: '2026-08-17',
        day: 'Monday',
        openSlots: [],
      }),
    ]);
  });

  it('validates provider availability lookup inputs', async () => {
    const participantRegistration = await request(app).post('/auth/register').send({
      fullName: 'Participant Lookup Invalid',
      email: 'participant.lookup.invalid@example.com',
      password: 'supersecret',
      role: 'participant',
    });
    const providerRegistration = await request(app).post('/auth/register').send({
      fullName: 'Provider Lookup Invalid',
      email: 'provider.lookup.invalid@example.com',
      password: 'supersecret',
      role: 'provider',
    });

    const missingStart = await request(app)
      .get(`/providers/${providerRegistration.body.user._id}/availability?endDate=2026-08-17`)
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);
    const reversedRange = await request(app)
      .get(`/providers/${providerRegistration.body.user._id}/availability?startDate=2026-08-18&endDate=2026-08-17`)
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);
    const tooLarge = await request(app)
      .get(`/providers/${providerRegistration.body.user._id}/availability?startDate=2026-08-01&endDate=2026-09-15`)
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);
    const nonProvider = await request(app)
      .get(`/providers/${participantRegistration.body.user._id}/availability?startDate=2026-08-17&endDate=2026-08-17`)
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);
    const invalidProviderId = await request(app)
      .get('/providers/not-a-provider-id/availability?startDate=2026-08-17&endDate=2026-08-17')
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);
    const invalidCalendarDate = await request(app)
      .get(`/providers/${providerRegistration.body.user._id}/availability?startDate=2026-02-30&endDate=2026-03-01`)
      .set('Authorization', `Bearer ${participantRegistration.body.token}`);

    expect(missingStart.status).toBe(400);
    expect(missingStart.body.error).toBe('startDate is required');
    expect(reversedRange.status).toBe(400);
    expect(reversedRange.body.error).toBe('endDate must be on or after startDate');
    expect(tooLarge.status).toBe(400);
    expect(tooLarge.body.error).toBe('date range cannot exceed 31 days');
    expect(nonProvider.status).toBe(404);
    expect(nonProvider.body.error).toBe('Provider not found');
    expect(invalidProviderId.status).toBe(404);
    expect(invalidProviderId.body.error).toBe('Provider not found');
    expect(invalidCalendarDate.status).toBe(400);
    expect(invalidCalendarDate.body.error).toBe('startDate must use YYYY-MM-DD');
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
