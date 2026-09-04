const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../src/models/Booking');
const Notification = require('../src/models/Notification');
const ProviderAvailability = require('../src/models/ProviderAvailability');
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
  await Notification.deleteMany({});
  await ProviderAvailability.deleteMany({});
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

async function seedAvailability(providerId) {
  return ProviderAvailability.create({
    provider: providerId,
    blocks: [{ day: 'Tuesday', start: '09:00', end: '12:00', service: 'Community access', enabled: true }],
  });
}

async function createBookingFor(participant, provider) {
  const res = await request(app)
    .post('/bookings')
    .set('Authorization', `Bearer ${participant.token}`)
    .send({
      providerId: provider.user._id,
      service: 'Community access',
      supportCategory: 'core',
      scheduledStart: '2026-08-18T09:30:00.000Z',
      scheduledEnd: '2026-08-18T10:30:00.000Z',
      location: 'Participant home',
    });
  return res.body.booking;
}

describe('booking notifications', () => {
  it('notifies the provider when a participant requests a booking', async () => {
    const participant = await registerUser('participant', 'p.notify.create@example.com');
    const provider = await registerUser('provider', 'pr.notify.create@example.com');
    await seedAvailability(provider.user._id);

    await createBookingFor(participant, provider);

    const forProvider = await Notification.find({ recipient: provider.user._id });
    expect(forProvider).toHaveLength(1);
    expect(forProvider[0].type).toBe('booking');
    expect(forProvider[0].title).toBe('New booking request');
    expect(forProvider[0].readAt).toBeNull();

    // The participant made the request; they should not be told about their own action.
    const forParticipant = await Notification.find({ recipient: participant.user._id });
    expect(forParticipant).toHaveLength(0);
  });

  it('notifies the participant when the provider confirms', async () => {
    const participant = await registerUser('participant', 'p.notify.confirm@example.com');
    const provider = await registerUser('provider', 'pr.notify.confirm@example.com');
    await seedAvailability(provider.user._id);
    const booking = await createBookingFor(participant, provider);

    await request(app)
      .patch(`/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send({ status: 'confirmed' });

    const forParticipant = await Notification.find({ recipient: participant.user._id });
    expect(forParticipant).toHaveLength(1);
    expect(forParticipant[0].title).toBe('Booking confirmed');
    expect(forParticipant[0].priority).toBe('success');
  });

  it('notifies the participant when the provider declines', async () => {
    const participant = await registerUser('participant', 'p.notify.decline@example.com');
    const provider = await registerUser('provider', 'pr.notify.decline@example.com');
    await seedAvailability(provider.user._id);
    const booking = await createBookingFor(participant, provider);

    await request(app)
      .patch(`/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send({ status: 'declined' });

    const forParticipant = await Notification.find({ recipient: participant.user._id });
    expect(forParticipant).toHaveLength(1);
    expect(forParticipant[0].title).toBe('Booking declined');
  });

  it('notifies the other party on cancellation, not the canceller', async () => {
    const participant = await registerUser('participant', 'p.notify.cancel@example.com');
    const provider = await registerUser('provider', 'pr.notify.cancel@example.com');
    await seedAvailability(provider.user._id);
    const booking = await createBookingFor(participant, provider);
    await Notification.deleteMany({});

    await request(app).delete(`/bookings/${booking.id}`).set('Authorization', `Bearer ${participant.token}`);

    const forProvider = await Notification.find({ recipient: provider.user._id });
    expect(forProvider).toHaveLength(1);
    expect(forProvider[0].title).toBe('Booking cancelled');

    const forParticipant = await Notification.find({ recipient: participant.user._id });
    expect(forParticipant).toHaveLength(0);
  });

  it('surfaces created notifications through GET /notifications', async () => {
    const participant = await registerUser('participant', 'p.notify.list@example.com');
    const provider = await registerUser('provider', 'pr.notify.list@example.com');
    await seedAvailability(provider.user._id);
    await createBookingFor(participant, provider);

    const res = await request(app).get('/notifications').set('Authorization', `Bearer ${provider.token}`);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(1);
    expect(res.body.notifications[0].title).toBe('New booking request');
    expect(res.body.notifications[0].isRead).toBe(false);
  });
});
