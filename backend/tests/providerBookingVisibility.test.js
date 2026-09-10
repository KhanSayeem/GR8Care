const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../src/models/Booking');
const Notification = require('../src/models/Notification');
const ProviderAvailability = require('../src/models/ProviderAvailability');
const ProviderProfile = require('../src/models/ProviderProfile');
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
  await ProviderProfile.deleteMany({});
  await User.deleteMany({});
});

// The service anchors everything to UTC, so the test builds its dates the same
// way rather than trusting the machine's local timezone.
function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

// Weeks start on Monday, matching startOfUtcWeek in providerDashboard.js.
function startOfUtcWeek(date) {
  const normalized = startOfUtcDay(date);
  const day = normalized.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addUtcDays(normalized, mondayOffset);
}

function atUtcHour(dayStart, hour) {
  return new Date(dayStart.getTime() + hour * 3600000);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

// Today is somewhere inside this week, so "another day this week" has to be
// picked relative to today or the test breaks every Monday and every Sunday.
function weekAnchors() {
  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const weekStart = startOfUtcWeek(now);
  const todayIndex = Math.round((dayStart - weekStart) / 86400000);
  const otherIndex = todayIndex === 0 ? 1 : 0;
  return { dayStart, weekStart, otherDayStart: addUtcDays(weekStart, otherIndex) };
}

async function registerUser(role, email, fullName) {
  const res = await request(app).post('/auth/register').send({
    fullName,
    email,
    password: 'supersecret',
    role,
  });
  expect(res.status).toBe(201);
  return res.body;
}

function createBooking({ participant, provider, supportWorker = null, service = 'Community access', start, end, status = 'confirmed' }) {
  return Booking.create({
    participant,
    provider,
    supportWorker,
    service,
    scheduledStart: start,
    scheduledEnd: end,
    status,
  });
}

function getStats(token) {
  return request(app).get('/providers/me/stats').set('Authorization', `Bearer ${token}`);
}

function getScheduleToday(token, date) {
  const query = date ? `?date=${date}` : '';
  return request(app)
    .get(`/providers/me/schedule-today${query}`)
    .set('Authorization', `Bearer ${token}`);
}

describe('provider booking visibility', () => {
  it('puts a participant booking on the provider schedule for today', async () => {
    const participant = await registerUser('participant', 'visibility.participant@example.com', 'Ada Participant');
    const provider = await registerUser('provider', 'visibility.provider@example.com', 'Visible Provider');
    const { dayStart } = weekAnchors();

    const booking = await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Community access',
      start: atUtcHour(dayStart, 9),
      end: atUtcHour(dayStart, 11),
      status: 'confirmed',
    });

    const res = await getScheduleToday(provider.token);

    expect(res.status).toBe(200);
    expect(res.body.bookedCount).toBe(1);
    expect(res.body.schedule).toHaveLength(1);
    expect(res.body.schedule[0]).toEqual(
      expect.objectContaining({
        status: 'booked',
        bookingStatus: 'confirmed',
        bookingId: String(booking._id),
        participantName: 'Ada Participant',
        service: 'Community access',
        start: '09:00',
        end: '11:00',
      })
    );
  });

  it('counts real bookings for today and this week instead of reporting zero', async () => {
    const participant = await registerUser('participant', 'counts.participant@example.com', 'Counted Participant');
    const provider = await registerUser('provider', 'counts.provider@example.com', 'Counting Provider');
    const { dayStart, otherDayStart } = weekAnchors();

    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      start: atUtcHour(dayStart, 9),
      end: atUtcHour(dayStart, 11),
      status: 'confirmed',
    });
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      start: atUtcHour(dayStart, 13),
      end: atUtcHour(dayStart, 14),
      status: 'inProgress',
    });
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      start: atUtcHour(otherDayStart, 10),
      end: atUtcHour(otherDayStart, 12),
      status: 'completed',
    });

    const res = await getStats(provider.token);

    expect(res.status).toBe(200);
    expect(res.body.stats.sessionsToday).toBe(2);
    expect(res.body.stats.sessionsThisWeek).toBe(3);
  });

  it('estimates weekly earnings from booked hours at the listed rate and skips pending work', async () => {
    const participant = await registerUser('participant', 'earnings.participant@example.com', 'Earning Participant');
    const provider = await registerUser('provider', 'earnings.provider@example.com', 'Earning Provider');
    const { dayStart, otherDayStart } = weekAnchors();

    await ProviderProfile.create({
      provider: provider.user._id,
      location: 'Perth',
      hourlyRate: 80,
    });

    // 2 hours confirmed plus 1 hour completed = 3 billable hours at 80.
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      start: atUtcHour(dayStart, 9),
      end: atUtcHour(dayStart, 11),
      status: 'confirmed',
    });
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      start: atUtcHour(otherDayStart, 9),
      end: atUtcHour(otherDayStart, 10),
      status: 'completed',
    });
    // Pending work is still on the books but is not earned yet.
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      start: atUtcHour(otherDayStart, 14),
      end: atUtcHour(otherDayStart, 18),
      status: 'pending',
    });

    const res = await getStats(provider.token);

    expect(res.status).toBe(200);
    expect(res.body.stats.sessionsThisWeek).toBe(3);
    expect(res.body.stats.earningsThisWeek).toBe(240);
  });

  it('leaves cancelled and declined bookings out of the counts and the schedule', async () => {
    const participant = await registerUser('participant', 'excluded.participant@example.com', 'Excluded Participant');
    const provider = await registerUser('provider', 'excluded.provider@example.com', 'Excluding Provider');
    const { dayStart } = weekAnchors();

    await ProviderProfile.create({
      provider: provider.user._id,
      location: 'Perth',
      hourlyRate: 90,
    });

    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Kept session',
      start: atUtcHour(dayStart, 9),
      end: atUtcHour(dayStart, 10),
      status: 'confirmed',
    });
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Cancelled session',
      start: atUtcHour(dayStart, 11),
      end: atUtcHour(dayStart, 13),
      status: 'cancelled',
    });
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Declined session',
      start: atUtcHour(dayStart, 14),
      end: atUtcHour(dayStart, 16),
      status: 'declined',
    });

    const stats = await getStats(provider.token);
    const schedule = await getScheduleToday(provider.token, isoDate(dayStart));

    expect(stats.status).toBe(200);
    expect(stats.body.stats.sessionsToday).toBe(1);
    expect(stats.body.stats.sessionsThisWeek).toBe(1);
    expect(stats.body.stats.earningsThisWeek).toBe(90);

    expect(schedule.status).toBe(200);
    expect(schedule.body.bookedCount).toBe(1);
    expect(schedule.body.schedule).toEqual([
      expect.objectContaining({ service: 'Kept session', status: 'booked' }),
    ]);
  });

  it('shows a support worker the bookings they are assigned to as well as their own', async () => {
    const participant = await registerUser('participant', 'worker.participant@example.com', 'Worker Participant');
    const supportWorker = await registerUser('supportWorker', 'worker.support@example.com', 'Sam Support');
    const otherProvider = await registerUser('provider', 'worker.provider@example.com', 'Host Provider');
    const { dayStart } = weekAnchors();

    // Booked straight against the support worker as the provider on the record.
    await createBooking({
      participant: participant.user._id,
      provider: supportWorker.user._id,
      service: 'Own session',
      start: atUtcHour(dayStart, 9),
      end: atUtcHour(dayStart, 10),
      status: 'confirmed',
    });
    // Booked against a provider, with the support worker assigned to deliver it.
    await createBooking({
      participant: participant.user._id,
      provider: otherProvider.user._id,
      supportWorker: supportWorker.user._id,
      service: 'Assigned session',
      start: atUtcHour(dayStart, 12),
      end: atUtcHour(dayStart, 13),
      status: 'confirmed',
    });

    const stats = await getStats(supportWorker.token);
    const schedule = await getScheduleToday(supportWorker.token, isoDate(dayStart));

    expect(stats.status).toBe(200);
    expect(stats.body.stats.sessionsToday).toBe(2);
    expect(schedule.status).toBe(200);
    expect(schedule.body.schedule.map((entry) => entry.service)).toEqual([
      'Own session',
      'Assigned session',
    ]);
  });

  it('never shows one provider the bookings of another', async () => {
    const participant = await registerUser('participant', 'isolation.participant@example.com', 'Isolated Participant');
    const providerOne = await registerUser('provider', 'isolation.one@example.com', 'Provider One');
    const providerTwo = await registerUser('provider', 'isolation.two@example.com', 'Provider Two');
    const { dayStart } = weekAnchors();

    await createBooking({
      participant: participant.user._id,
      provider: providerTwo.user._id,
      service: 'Not yours',
      start: atUtcHour(dayStart, 9),
      end: atUtcHour(dayStart, 11),
      status: 'confirmed',
    });

    const stats = await getStats(providerOne.token);
    const schedule = await getScheduleToday(providerOne.token, isoDate(dayStart));
    const ownerStats = await getStats(providerTwo.token);

    expect(stats.status).toBe(200);
    expect(stats.body.stats.sessionsToday).toBe(0);
    expect(stats.body.stats.sessionsThisWeek).toBe(0);
    expect(schedule.status).toBe(200);
    expect(schedule.body.bookedCount).toBe(0);
    expect(schedule.body.schedule).toEqual([]);

    expect(ownerStats.body.stats.sessionsToday).toBe(1);
  });

  it('lists booked sessions ahead of the enabled availability blocks for the day', async () => {
    const participant = await registerUser('participant', 'mixed.participant@example.com', 'Mixed Participant');
    const provider = await registerUser('provider', 'mixed.provider@example.com', 'Mixed Provider');

    await ProviderAvailability.create({
      provider: provider.user._id,
      blocks: [
        { day: 'Monday', start: '09:00', end: '11:00', service: 'Morning support', enabled: true },
        { day: 'Monday', start: '16:00', end: '18:00', service: 'Disabled support', enabled: false },
        { day: 'Tuesday', start: '09:00', end: '11:00', service: 'Wrong day', enabled: true },
      ],
    });

    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Booked support',
      start: new Date('2026-08-17T14:00:00.000Z'),
      end: new Date('2026-08-17T15:30:00.000Z'),
      status: 'confirmed',
    });

    const res = await getScheduleToday(provider.token, '2026-08-17');

    expect(res.status).toBe(200);
    expect(res.body.day).toBe('Monday');
    expect(res.body.bookedCount).toBe(1);
    expect(res.body.availableCount).toBe(1);
    expect(res.body.schedule).toEqual([
      expect.objectContaining({ status: 'booked', service: 'Booked support', start: '14:00', end: '15:30' }),
      expect.objectContaining({ status: 'available', service: 'Morning support', start: '09:00' }),
    ]);
  });

  it('places booked sessions on the right day of the weekly schedule', async () => {
    const participant = await registerUser('participant', 'weekly.participant@example.com', 'Weekly Participant');
    const provider = await registerUser('provider', 'weekly.provider@example.com', 'Weekly Provider');

    const tuesday = await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Tuesday session',
      start: new Date('2026-08-18T09:00:00.000Z'),
      end: new Date('2026-08-18T10:00:00.000Z'),
      status: 'confirmed',
    });
    const thursday = await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Thursday session',
      start: new Date('2026-08-20T13:00:00.000Z'),
      end: new Date('2026-08-20T15:00:00.000Z'),
      status: 'pending',
    });
    // The following Monday is outside the requested window.
    await createBooking({
      participant: participant.user._id,
      provider: provider.user._id,
      service: 'Next week session',
      start: new Date('2026-08-24T09:00:00.000Z'),
      end: new Date('2026-08-24T10:00:00.000Z'),
      status: 'confirmed',
    });

    const res = await request(app)
      .get('/providers/me/schedule?date=2026-08-19&range=this-week')
      .set('Authorization', `Bearer ${provider.token}`);

    expect(res.status).toBe(200);
    expect(res.body.startDate).toBe('2026-08-17');
    expect(res.body.endDate).toBe('2026-08-23');
    expect(res.body.schedule).toHaveLength(7);
    expect(res.body.schedule[0].blocks).toEqual([]);
    expect(res.body.schedule[1]).toEqual(
      expect.objectContaining({
        date: '2026-08-18',
        day: 'Tuesday',
        blocks: [
          expect.objectContaining({
            status: 'booked',
            bookingId: String(tuesday._id),
            bookingStatus: 'confirmed',
            participantName: 'Weekly Participant',
            start: '09:00',
          }),
        ],
      })
    );
    expect(res.body.schedule[3]).toEqual(
      expect.objectContaining({
        date: '2026-08-20',
        day: 'Thursday',
        blocks: [
          expect.objectContaining({
            status: 'booked',
            bookingId: String(thursday._id),
            bookingStatus: 'pending',
            start: '13:00',
          }),
        ],
      })
    );
    const allServices = res.body.schedule.flatMap((day) => day.blocks.map((block) => block.service));
    expect(allServices).toEqual(['Tuesday session', 'Thursday session']);
  });
});
