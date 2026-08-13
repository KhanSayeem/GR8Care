const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
const {
  listNotificationsForUser,
  markNotificationsReadForUser,
  normalizeNotificationIds,
} = require('../src/services/notifications');

let mongod;
let app;

jest.setTimeout(120000);

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test-secret';
  await mongoose.connect(mongod.getUri());
  app = require('../src/app');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

afterEach(async () => {
  await Notification.deleteMany({});
  await User.deleteMany({});
});

describe('Notification model', () => {
  async function createParticipant() {
    return User.create({
      fullName: 'Amina Rahman',
      email: 'amina.notifications@example.com',
      password: 'supersecret',
      role: 'participant',
    });
  }

  it('stores participant notification content and read state', async () => {
    const participant = await createParticipant();

    const notification = await Notification.create({
      recipient: participant._id,
      type: 'funding',
      priority: 'warning',
      title: 'Budget alert',
      body: 'Capital Supports is tracking over allocation.',
      category: 'Funding',
      contextLabel: '$200 over',
      actionLabel: 'Review funding',
      metadata: {
        source: 'budget-over-threshold',
        category: 'capitalSupports',
      },
    });

    expect(notification.recipient.toString()).toBe(participant._id.toString());
    expect(notification.type).toBe('funding');
    expect(notification.priority).toBe('warning');
    expect(notification.readAt).toBeNull();
    expect(notification.isRead).toBe(false);
    expect(notification.metadata).toEqual(
      expect.objectContaining({
        source: 'budget-over-threshold',
      })
    );

    notification.readAt = new Date('2026-08-13T00:00:00.000Z');
    await notification.save();

    const serialized = notification.toJSON();
    expect(serialized.isRead).toBe(true);
  });

  it('validates required fields and supported notification types', async () => {
    const participant = await createParticipant();

    await expect(
      Notification.create({
        recipient: participant._id,
        type: 'payment',
        title: 'Unsupported type',
        body: 'This should fail.',
      })
    ).rejects.toThrow(/`payment` is not a valid enum value/);

    await expect(
      Notification.create({
        recipient: participant._id,
        type: 'booking',
        title: 'Missing body',
      })
    ).rejects.toThrow(/Path `body` is required/);
  });

  it('supports unread queries by recipient for the mark-read endpoint', async () => {
    const participant = await createParticipant();
    const otherParticipant = await User.create({
      fullName: 'Other User',
      email: 'other.notifications@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    await Notification.create([
      {
        recipient: participant._id,
        type: 'booking',
        title: 'Provider on the way',
        body: 'Maria Rodriguez is 12 minutes away.',
      },
      {
        recipient: participant._id,
        type: 'education',
        title: 'AI bot suggestion',
        body: 'Try the plan review guide.',
        readAt: new Date('2026-08-12T00:00:00.000Z'),
      },
      {
        recipient: otherParticipant._id,
        type: 'system',
        title: 'Different user',
        body: 'This must not be returned.',
      },
    ]);

    const unreadForParticipant = await Notification.find({
      recipient: participant._id,
      readAt: null,
    }).sort({ createdAt: -1 });

    expect(unreadForParticipant).toHaveLength(1);
    expect(unreadForParticipant[0].title).toBe('Provider on the way');
  });

  it('normalizes notification id arrays before mark-read updates', () => {
    expect(normalizeNotificationIds(['  abc  ', '', null, undefined, 123])).toEqual(['abc', '123']);
    expect(normalizeNotificationIds('not-array')).toEqual([]);
  });

  it('lists and marks read notifications for one recipient only', async () => {
    const participant = await createParticipant();
    const otherParticipant = await User.create({
      fullName: 'Other User',
      email: 'other.readstate@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    const [first, second] = await Notification.create([
      {
        recipient: participant._id,
        type: 'booking',
        title: 'Provider on the way',
        body: 'Maria Rodriguez is 12 minutes away.',
      },
      {
        recipient: participant._id,
        type: 'funding',
        priority: 'warning',
        title: 'Budget alert',
        body: 'Capital Supports is tracking over allocation.',
      },
      {
        recipient: otherParticipant._id,
        type: 'system',
        title: 'Other user alert',
        body: 'This belongs to another user.',
      },
    ]);

    const before = await listNotificationsForUser(participant._id);
    expect(before.unreadCount).toBe(2);
    expect(before.notifications.map((item) => item.title)).toEqual(
      expect.arrayContaining(['Provider on the way', 'Budget alert'])
    );
    expect(before.notifications).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Other user alert' })])
    );

    const markOne = await markNotificationsReadForUser(participant._id, [first._id]);
    expect(markOne.updatedCount).toBe(1);

    const unreadOnly = await listNotificationsForUser(participant._id, { unreadOnly: true });
    expect(unreadOnly.unreadCount).toBe(1);
    expect(unreadOnly.notifications).toHaveLength(1);
    expect(unreadOnly.notifications[0].id).toBe(second._id.toString());

    const otherUserUnread = await listNotificationsForUser(otherParticipant._id);
    expect(otherUserUnread.unreadCount).toBe(1);
  });

  it('exposes current-user notification list and mark-read endpoints', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Endpoint User',
      email: 'endpoint.notifications@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    await Notification.create([
      {
        recipient: registration.body.user._id,
        type: 'booking',
        title: 'Provider on the way',
        body: 'Maria Rodriguez is 12 minutes away.',
        category: 'Booking',
      },
      {
        recipient: registration.body.user._id,
        type: 'education',
        title: 'AI bot suggestion',
        body: 'Try the plan review guide.',
        category: 'Education',
      },
    ]);

    const listRes = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.mode).toBe('notifications');
    expect(listRes.body.unreadCount).toBe(2);
    expect(listRes.body.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Provider on the way',
          isRead: false,
        }),
      ])
    );

    const markReadRes = await request(app)
      .patch('/notifications/mark-read')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({});

    expect(markReadRes.status).toBe(200);
    expect(markReadRes.body.updatedCount).toBe(2);

    const unreadRes = await request(app)
      .get('/notifications?unread=true')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(unreadRes.status).toBe(200);
    expect(unreadRes.body.unreadCount).toBe(0);
    expect(unreadRes.body.notifications).toHaveLength(0);
  });

  it('rejects malformed notification ids on mark-read', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Invalid Id User',
      email: 'invalid-id.notifications@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    const res = await request(app)
      .patch('/notifications/mark-read')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ ids: ['not-an-object-id'] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid notification ids');
  });
});
