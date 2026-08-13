const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../src/models/Booking');
const ProviderAvailability = require('../src/models/ProviderAvailability');
const ServiceRequest = require('../src/models/ServiceRequest');
const User = require('../src/models/User');

let mongod;

jest.setTimeout(120000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  await mongoose.connect(mongod.getUri());
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

async function createUser(role, email) {
  return User.create({
    fullName: `${role} user`,
    email,
    password: 'supersecret',
    role,
  });
}

describe('booking relationship models', () => {
  it('links service requests to participants, requesters, and preferred providers', async () => {
    const participant = await createUser('participant', 'participant.request@example.com');
    const caregiver = await createUser('caregiver', 'caregiver.request@example.com');
    const provider = await createUser('provider', 'provider.request@example.com');

    const request = await ServiceRequest.create({
      participant: participant._id,
      requestedBy: caregiver._id,
      preferredProvider: provider._id,
      title: 'Community access booking',
      service: 'Community access',
      description: 'Help with appointments and community activities.',
      preferredStartDate: new Date('2026-08-17T09:00:00.000Z'),
      preferredEndDate: new Date('2026-08-17T12:00:00.000Z'),
      supportCategory: 'core',
      source: 'caregiver',
    });

    expect(request.status).toBe('submitted');
    expect(String(request.participant)).toBe(String(participant._id));
    expect(String(request.requestedBy)).toBe(String(caregiver._id));
    expect(String(request.preferredProvider)).toBe(String(provider._id));
  });

  it('links bookings to participant, provider, worker, service request, and availability block', async () => {
    const participant = await createUser('participant', 'participant.booking@example.com');
    const provider = await createUser('provider', 'provider.booking@example.com');
    const worker = await createUser('supportWorker', 'worker.booking@example.com');
    const serviceRequest = await ServiceRequest.create({
      participant: participant._id,
      requestedBy: participant._id,
      preferredProvider: provider._id,
      title: 'Transport booking',
      service: 'Transport support',
      preferredStartDate: new Date('2026-08-18T09:00:00.000Z'),
      preferredEndDate: new Date('2026-08-18T11:00:00.000Z'),
    });
    const availability = await ProviderAvailability.create({
      provider: provider._id,
      blocks: [{ day: 'Tuesday', start: '09:00', end: '11:00', service: 'Transport support' }],
    });

    const booking = await Booking.create({
      participant: participant._id,
      provider: provider._id,
      supportWorker: worker._id,
      serviceRequest: serviceRequest._id,
      availabilityBlockId: availability.blocks[0]._id,
      service: 'Transport support',
      scheduledStart: new Date('2026-08-18T09:00:00.000Z'),
      scheduledEnd: new Date('2026-08-18T11:00:00.000Z'),
      location: 'Participant home',
    });

    expect(booking.status).toBe('pending');
    expect(String(booking.participant)).toBe(String(participant._id));
    expect(String(booking.provider)).toBe(String(provider._id));
    expect(String(booking.supportWorker)).toBe(String(worker._id));
    expect(String(booking.serviceRequest)).toBe(String(serviceRequest._id));
    expect(String(booking.availabilityBlockId)).toBe(String(availability.blocks[0]._id));
  });

  it('validates booking and service request time windows and status enums', async () => {
    const participant = await createUser('participant', 'participant.invalid.booking@example.com');
    const provider = await createUser('provider', 'provider.invalid.booking@example.com');

    await expect(
      Booking.create({
        participant: participant._id,
        provider: provider._id,
        service: 'Community access',
        scheduledStart: new Date('2026-08-18T11:00:00.000Z'),
        scheduledEnd: new Date('2026-08-18T09:00:00.000Z'),
      })
    ).rejects.toThrow(/scheduledEnd must be after scheduledStart/);

    await expect(
      ServiceRequest.create({
        participant: participant._id,
        requestedBy: participant._id,
        title: 'Invalid request',
        service: 'Community access',
        preferredStartDate: new Date('2026-08-18T11:00:00.000Z'),
        preferredEndDate: new Date('2026-08-18T09:00:00.000Z'),
      })
    ).rejects.toThrow(/preferredEndDate must be after preferredStartDate/);

    await expect(
      Booking.create({
        participant: participant._id,
        provider: provider._id,
        service: 'Community access',
        scheduledStart: new Date('2026-08-18T09:00:00.000Z'),
        scheduledEnd: new Date('2026-08-18T11:00:00.000Z'),
        status: 'approved',
      })
    ).rejects.toThrow(/`approved` is not a valid enum value/);
  });

  it('finds provider booking conflicts by overlapping scheduled windows', async () => {
    const participant = await createUser('participant', 'participant.conflict@example.com');
    const provider = await createUser('provider', 'provider.conflict@example.com');
    const otherProvider = await createUser('provider', 'provider.no.conflict@example.com');

    const conflict = await Booking.create({
      participant: participant._id,
      provider: provider._id,
      service: 'Community access',
      scheduledStart: new Date('2026-08-18T09:00:00.000Z'),
      scheduledEnd: new Date('2026-08-18T11:00:00.000Z'),
      status: 'confirmed',
    });
    await Booking.create({
      participant: participant._id,
      provider: provider._id,
      service: 'Community access',
      scheduledStart: new Date('2026-08-18T12:00:00.000Z'),
      scheduledEnd: new Date('2026-08-18T13:00:00.000Z'),
      status: 'confirmed',
    });
    await Booking.create({
      participant: participant._id,
      provider: otherProvider._id,
      service: 'Community access',
      scheduledStart: new Date('2026-08-18T09:30:00.000Z'),
      scheduledEnd: new Date('2026-08-18T10:30:00.000Z'),
      status: 'confirmed',
    });
    await Booking.create({
      participant: participant._id,
      provider: provider._id,
      service: 'Community access',
      scheduledStart: new Date('2026-08-18T09:30:00.000Z'),
      scheduledEnd: new Date('2026-08-18T10:30:00.000Z'),
      status: 'cancelled',
    });

    const conflicts = await Booking.findProviderConflicts(
      provider._id,
      new Date('2026-08-18T10:00:00.000Z'),
      new Date('2026-08-18T11:30:00.000Z')
    );

    expect(conflicts).toHaveLength(1);
    expect(String(conflicts[0]._id)).toBe(String(conflict._id));
  });
});
