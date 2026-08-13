const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const NdisPlan = require('../src/models/NdisPlan');

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

afterEach(async () => {
  await mongoose.connection.dropDatabase();
});

async function registerParticipant(email = 'funding.endpoint@example.com') {
  return request(app).post('/auth/register').send({
    fullName: 'Amina Rahman',
    email,
    password: 'supersecret',
    role: 'participant',
  });
}

async function createPlan(participantId) {
  return NdisPlan.create({
    participant: participantId,
    planNumber: 'PLAN-2026-API',
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: new Date('2027-07-31T00:00:00.000Z'),
    fundingCategories: [
      { category: 'core', label: 'Core Supports', allocation: 18000, spentToDate: 8240 },
      { category: 'capacity', label: 'Capacity Building', allocation: 8500, spentToDate: 3100 },
      { category: 'capital', label: 'Capital Supports', allocation: 5000, spentToDate: 5200 },
    ],
    transactions: [
      {
        category: 'core',
        label: 'Daily Living - Maria R.',
        amount: -95,
        serviceDate: new Date('2026-08-09T00:00:00.000Z'),
        providerName: 'Maria Rodriguez',
      },
      {
        category: 'capital',
        label: 'Equipment purchase',
        amount: -300,
        serviceDate: new Date('2026-08-10T00:00:00.000Z'),
        providerName: 'Mobility Supplier',
      },
    ],
  });
}

describe('funding API', () => {
  it('returns active plan summary with category totals and budget alerts', async () => {
    const registration = await registerParticipant();
    await createPlan(registration.body.user._id);

    const res = await request(app)
      .get('/funding/summary')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('fundingSummary');
    expect(res.body.boundary).toContain('context only');
    expect(res.body.summary.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'core',
          remaining: 9760,
          percentageUsed: 46,
        }),
        expect.objectContaining({
          category: 'capital',
          remaining: -200,
          overBudget: true,
        }),
      ])
    );
    expect(res.body.summary.budgetAlerts).toEqual([
      expect.objectContaining({
        category: 'capital',
      }),
    ]);
  });

  it('returns sorted transactions and supports category filtering', async () => {
    const registration = await registerParticipant('transactions@example.com');
    await createPlan(registration.body.user._id);

    const res = await request(app)
      .get('/funding/transactions')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('fundingTransactions');
    expect(res.body.transactions.map((transaction) => transaction.label)).toEqual([
      'Equipment purchase',
      'Daily Living - Maria R.',
    ]);

    const filteredRes = await request(app)
      .get('/funding/transactions?category=core')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(filteredRes.status).toBe(200);
    expect(filteredRes.body.transactions).toHaveLength(1);
    expect(filteredRes.body.transactions[0]).toEqual(
      expect.objectContaining({
        category: 'core',
        label: 'Daily Living - Maria R.',
      })
    );
  });

  it('protects funding data by current user and validates category filters', async () => {
    const ownerRegistration = await registerParticipant('owner.funding@example.com');
    await createPlan(ownerRegistration.body.user._id);
    const otherRegistration = await registerParticipant('other.funding@example.com');

    const otherSummaryRes = await request(app)
      .get('/funding/summary')
      .set('Authorization', `Bearer ${otherRegistration.body.token}`);

    expect(otherSummaryRes.status).toBe(404);
    expect(otherSummaryRes.body.error).toBe('Active NDIS plan not found');

    const invalidCategoryRes = await request(app)
      .get('/funding/transactions?category=travel')
      .set('Authorization', `Bearer ${ownerRegistration.body.token}`);

    expect(invalidCategoryRes.status).toBe(400);
    expect(invalidCategoryRes.body.error).toBe('Unsupported funding category');
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/funding/summary');

    expect(res.status).toBe(401);
  });
});
