const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Goal = require('../src/models/Goal');
const NdisPlan = require('../src/models/NdisPlan');
const User = require('../src/models/User');

let mongod;

jest.setTimeout(120000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await Goal.deleteMany({});
  await NdisPlan.deleteMany({});
  await User.deleteMany({});
});

describe('funding models', () => {
  async function createParticipant() {
    return User.create({
      fullName: 'Amina Rahman',
      email: 'amina.funding@example.com',
      password: 'supersecret',
      role: 'participant',
    });
  }

  it('stores NDIS plan funding categories and calculates summary values', async () => {
    const participant = await createParticipant();
    const plan = await NdisPlan.create({
      participant: participant._id,
      planNumber: 'PLAN-2026-001',
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
      ],
    });

    const summary = plan.getFundingSummary();

    expect(summary.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'core',
          label: 'Core Supports',
          allocation: 18000,
          spentToDate: 8240,
          remaining: 9760,
          percentageUsed: 46,
          overBudget: false,
        }),
        expect.objectContaining({
          category: 'capital',
          remaining: -200,
          percentageUsed: 104,
          overBudget: true,
        }),
      ])
    );
    expect(summary.totals).toEqual({
      allocation: 31500,
      spentToDate: 16540,
      remaining: 14960,
    });
    expect(summary.budgetAlerts).toEqual([
      expect.objectContaining({
        category: 'capital',
      }),
    ]);
    expect(plan.transactions[0].providerName).toBe('Maria Rodriguez');
  });

  it('links participant goals to an NDIS plan and funding categories', async () => {
    const participant = await createParticipant();
    const plan = await NdisPlan.create({
      participant: participant._id,
      planNumber: 'PLAN-2026-002',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2027-07-31T00:00:00.000Z'),
    });

    const goal = await Goal.create({
      participant: participant._id,
      plan: plan._id,
      title: 'Build confidence with community access',
      description: 'Use support hours to practise community activities safely.',
      linkedFundingCategories: ['core', 'capacity'],
      supports: ['Community access', 'Plan review preparation'],
    });

    expect(goal.status).toBe('inProgress');
    expect(goal.linkedFundingCategories).toEqual(['core', 'capacity']);
    expect(goal.supports).toContain('Community access');
  });

  it('validates supported funding categories and unique participant plan numbers', async () => {
    const participant = await createParticipant();

    await expect(
      NdisPlan.create({
        participant: participant._id,
        planNumber: 'PLAN-2026-003',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2027-07-31T00:00:00.000Z'),
        fundingCategories: [{ category: 'travel', label: 'Travel', allocation: 100, spentToDate: 0 }],
      })
    ).rejects.toThrow(/`travel` is not a valid enum value/);

    await NdisPlan.create({
      participant: participant._id,
      planNumber: 'PLAN-2026-004',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2027-07-31T00:00:00.000Z'),
    });

    await expect(
      NdisPlan.create({
        participant: participant._id,
        planNumber: 'PLAN-2026-004',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        endDate: new Date('2027-07-31T00:00:00.000Z'),
      })
    ).rejects.toThrow(/duplicate key/);
  });
});
