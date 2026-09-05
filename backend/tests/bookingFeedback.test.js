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

// Admins cannot be created through /auth/register - that endpoint rejects the
// admin role so nobody can grant it to themselves. Seed one directly, then log
// in for a token.
async function registerAdmin(email = 'admin.feedback@example.com') {
  await User.create({
    fullName: 'Admin User',
    email,
    password: 'supersecret',
    role: 'admin',
    language: 'en',
  });

  const res = await request(app).post('/auth/login').send({ email, password: 'supersecret' });
  return res.body;
}

async function seedAvailability(providerId) {
  return ProviderAvailability.create({
    provider: providerId,
    blocks: [{ day: 'Tuesday', start: '09:00', end: '12:00', service: 'Community access', enabled: true }],
  });
}

async function createBookingFor(participant, provider, overrides = {}) {
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
      ...overrides,
    });
  return res.body.booking;
}

function setStatus(provider, bookingId, status) {
  return request(app)
    .patch(`/bookings/${bookingId}`)
    .set('Authorization', `Bearer ${provider.token}`)
    .send({ status });
}

function submitFeedback(token, bookingId, payload) {
  return request(app)
    .post(`/bookings/${bookingId}/feedback`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

// A completed booking is the only state feedback makes sense in, so most cases
// need one to exist first.
async function completedBooking(participant, provider) {
  await seedAvailability(provider.user._id);
  const booking = await createBookingFor(participant, provider);
  await setStatus(provider, booking.id, 'completed');
  return booking;
}

describe('POST /bookings/:id/feedback', () => {
  it('records a rating and comment on a completed booking', async () => {
    const participant = await registerUser('participant', 'p.feedback.happy@example.com');
    const provider = await registerUser('provider', 'pr.feedback.happy@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, {
      rating: 5,
      comment: '  Really  helpful session  ',
    });

    expect(res.status).toBe(201);
    expect(res.body.mode).toBe('bookingFeedback');
    expect(typeof res.body.boundary).toBe('string');
    expect(res.body.booking.id).toBe(booking.id);
    expect(res.body.booking.status).toBe('completed');
    expect(res.body.booking.feedback.rating).toBe(5);
    // Comment text is normalised: trimmed with runs of whitespace collapsed.
    expect(res.body.booking.feedback.comment).toBe('Really helpful session');
    expect(res.body.booking.feedback.submittedAt).toBeTruthy();

    const stored = await Booking.findById(booking.id);
    expect(stored.feedback.rating).toBe(5);
    expect(stored.feedback.comment).toBe('Really helpful session');
    expect(stored.feedback.submittedAt).toBeInstanceOf(Date);
  });

  it('accepts feedback with no comment', async () => {
    const participant = await registerUser('participant', 'p.feedback.nocomment@example.com');
    const provider = await registerUser('provider', 'pr.feedback.nocomment@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { rating: 3 });

    expect(res.status).toBe(201);
    expect(res.body.booking.feedback.rating).toBe(3);
    expect(res.body.booking.feedback.comment).toBe('');
  });

  it('accepts a rating supplied as a numeric string', async () => {
    const participant = await registerUser('participant', 'p.feedback.string@example.com');
    const provider = await registerUser('provider', 'pr.feedback.string@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { rating: '4' });

    expect(res.status).toBe(201);
    expect(res.body.booking.feedback.rating).toBe(4);
  });

  it('lets a resubmission replace the earlier rating', async () => {
    const participant = await registerUser('participant', 'p.feedback.resubmit@example.com');
    const provider = await registerUser('provider', 'pr.feedback.resubmit@example.com');
    const booking = await completedBooking(participant, provider);

    await submitFeedback(participant.token, booking.id, { rating: 2, comment: 'Ran late' });
    const res = await submitFeedback(participant.token, booking.id, { rating: 4, comment: 'Made up for it' });

    expect(res.status).toBe(201);
    expect(res.body.booking.feedback.rating).toBe(4);
    expect(res.body.booking.feedback.comment).toBe('Made up for it');

    const stored = await Booking.findById(booking.id);
    expect(stored.feedback.rating).toBe(4);
  });

  it('surfaces the feedback on the booking detail endpoint', async () => {
    const participant = await registerUser('participant', 'p.feedback.detail@example.com');
    const provider = await registerUser('provider', 'pr.feedback.detail@example.com');
    const booking = await completedBooking(participant, provider);

    await submitFeedback(participant.token, booking.id, { rating: 5, comment: 'Great' });

    const res = await request(app)
      .get(`/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${participant.token}`);

    expect(res.status).toBe(200);
    expect(res.body.booking.feedback.rating).toBe(5);
    expect(res.body.booking.feedback.comment).toBe('Great');
  });

  it('rejects a rating below 1', async () => {
    const participant = await registerUser('participant', 'p.feedback.low@example.com');
    const provider = await registerUser('provider', 'pr.feedback.low@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { rating: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('rating must be a whole number between 1 and 5');

    const stored = await Booking.findById(booking.id);
    expect(stored.feedback.rating).toBeNull();
  });

  it('rejects a rating above 5', async () => {
    const participant = await registerUser('participant', 'p.feedback.high@example.com');
    const provider = await registerUser('provider', 'pr.feedback.high@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { rating: 6 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('rating must be a whole number between 1 and 5');
  });

  it('rejects a fractional rating', async () => {
    const participant = await registerUser('participant', 'p.feedback.fraction@example.com');
    const provider = await registerUser('provider', 'pr.feedback.fraction@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { rating: 4.5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('rating must be a whole number between 1 and 5');
  });

  it('rejects a non-numeric rating', async () => {
    const participant = await registerUser('participant', 'p.feedback.text@example.com');
    const provider = await registerUser('provider', 'pr.feedback.text@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { rating: 'excellent' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('rating must be a whole number between 1 and 5');
  });

  it('rejects a missing rating', async () => {
    const participant = await registerUser('participant', 'p.feedback.missing@example.com');
    const provider = await registerUser('provider', 'pr.feedback.missing@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { comment: 'No stars given' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('rating must be a whole number between 1 and 5');
  });

  it('refuses feedback on a booking that is still pending', async () => {
    const participant = await registerUser('participant', 'p.feedback.pending@example.com');
    const provider = await registerUser('provider', 'pr.feedback.pending@example.com');
    await seedAvailability(provider.user._id);
    const booking = await createBookingFor(participant, provider);

    const res = await submitFeedback(participant.token, booking.id, { rating: 5 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Feedback can only be given on a completed booking');

    const stored = await Booking.findById(booking.id);
    expect(stored.feedback.rating).toBeNull();
  });

  it('refuses feedback on a cancelled booking', async () => {
    const participant = await registerUser('participant', 'p.feedback.cancelled@example.com');
    const provider = await registerUser('provider', 'pr.feedback.cancelled@example.com');
    await seedAvailability(provider.user._id);
    const booking = await createBookingFor(participant, provider);
    await request(app).delete(`/bookings/${booking.id}`).set('Authorization', `Bearer ${participant.token}`);

    const res = await submitFeedback(participant.token, booking.id, { rating: 5 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Feedback can only be given on a completed booking');
  });

  it('does not let the provider rate their own completed booking', async () => {
    const participant = await registerUser('participant', 'p.feedback.provider@example.com');
    const provider = await registerUser('provider', 'pr.feedback.provider@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(provider.token, booking.id, { rating: 5, comment: 'I was great' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Only participants, caregivers, or admins can request bookings');

    const stored = await Booking.findById(booking.id);
    expect(stored.feedback.rating).toBeNull();
  });

  it('hides another participant booking behind a 404', async () => {
    const participant = await registerUser('participant', 'p.feedback.owner@example.com');
    const provider = await registerUser('provider', 'pr.feedback.owner@example.com');
    const stranger = await registerUser('participant', 'p.feedback.stranger@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(stranger.token, booking.id, { rating: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Booking not found');

    const stored = await Booking.findById(booking.id);
    expect(stored.feedback.rating).toBeNull();
  });

  it('lets an admin record feedback on any completed booking', async () => {
    const participant = await registerUser('participant', 'p.feedback.admin@example.com');
    const provider = await registerUser('provider', 'pr.feedback.admin@example.com');
    const admin = await registerAdmin();
    const booking = await completedBooking(participant, provider);

    const res = await submitFeedback(admin.token, booking.id, { rating: 4, comment: 'Logged on request' });

    expect(res.status).toBe(201);
    expect(res.body.booking.feedback.rating).toBe(4);
  });

  it('returns 404 for a booking that does not exist', async () => {
    const participant = await registerUser('participant', 'p.feedback.nobooking@example.com');
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await submitFeedback(participant.token, missingId, { rating: 5 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Booking not found');
  });

  it('returns 404 for an id that is not an ObjectId', async () => {
    const participant = await registerUser('participant', 'p.feedback.badid@example.com');

    const res = await submitFeedback(participant.token, 'not-an-id', { rating: 5 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Booking not found');
  });

  it('requires authentication', async () => {
    const participant = await registerUser('participant', 'p.feedback.auth@example.com');
    const provider = await registerUser('provider', 'pr.feedback.auth@example.com');
    const booking = await completedBooking(participant, provider);

    const res = await request(app).post(`/bookings/${booking.id}/feedback`).send({ rating: 5 });

    expect(res.status).toBe(401);

    const stored = await Booking.findById(booking.id);
    expect(stored.feedback.rating).toBeNull();
  });
});
