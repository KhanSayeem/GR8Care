const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

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

describe('Auth API', () => {
  const credentials = {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'supersecret',
    role: 'participant',
    language: 'en',
  };

  it('registers a new user', async () => {
    const res = await request(app).post('/auth/register').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.role).toBe(credentials.role);
    expect(res.body.user.language).toBe(credentials.language);
    expect(res.body.user.password).toBeUndefined();
  });

  it('registers a Support Worker with MVP signup fields only', async () => {
    const supportWorkerCredentials = {
      fullName: 'Sam Worker',
      email: 'sam.worker@example.com',
      password: 'supersecret',
      role: 'supportWorker',
      language: 'bn',
      ndisNumber: 'NDIS-123',
      subscriptionTier: 'enterprise',
      identityVerificationStatus: 'verified',
      providerRegistrationVerified: true,
      paymentMethodId: 'pm_test',
    };

    const res = await request(app).post('/auth/register').send(supportWorkerCredentials);
    expect(res.status).toBe(201);
    expect(res.body.user).toEqual(
      expect.objectContaining({
        fullName: supportWorkerCredentials.fullName,
        email: supportWorkerCredentials.email,
        role: 'supportWorker',
        language: 'bn',
      })
    );
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.ndisNumber).toBeUndefined();
    expect(res.body.user.subscriptionTier).toBe('starter');
    expect(res.body.user).not.toHaveProperty('identityVerificationStatus');
    expect(res.body.user).not.toHaveProperty('providerRegistrationVerified');
    expect(res.body.user).not.toHaveProperty('paymentMethodId');

    const storedUser = await mongoose.connection
      .collection('users')
      .findOne({ email: supportWorkerCredentials.email });
    expect(storedUser.password).toBeDefined();
    expect(storedUser.password).not.toBe(supportWorkerCredentials.password);
    expect(storedUser.role).toBe('supportWorker');
    expect(storedUser.language).toBe('bn');
    expect(storedUser.ndisNumber).toBeUndefined();
    expect(storedUser.subscriptionTier).toBe('starter');
    expect(storedUser.identityVerificationStatus).toBeUndefined();
    expect(storedUser.providerRegistrationVerified).toBeUndefined();
    expect(storedUser.paymentMethodId).toBeUndefined();
  });

  it('rejects unsupported roles during registration', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        fullName: 'Invalid Role',
        email: 'invalid-role@example.com',
        password: 'supersecret',
        role: 'auditor',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Unsupported role');
  });

  it('refuses to let anyone register themselves as an admin', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        fullName: 'Privilege Escalation',
        email: 'self-made-admin@example.com',
        password: 'supersecret',
        role: 'admin',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Unsupported role');

    const stored = await mongoose.connection
      .collection('users')
      .findOne({ email: 'self-made-admin@example.com' });
    expect(stored).toBeNull();
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/auth/register').send(credentials);
    expect(res.status).toBe(409);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: credentials.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('protects /users/me and returns the profile with a valid token', async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    const res = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.subscriptionAccess.tier).toBe('starter');
    expect(res.body.user.subscriptionAccess.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'educationLibrary', enabled: true }),
        expect.objectContaining({ key: 'shiftNoteDrafts', enabled: false }),
      ])
    );
  });

  it('returns subscription access as permission gating without payment fields', async () => {
    const providerCredentials = {
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'supersecret',
      role: 'provider',
      subscriptionTier: 'growth',
    };

    const registration = await request(app).post('/auth/register').send(providerCredentials);
    expect(registration.status).toBe(201);
    expect(registration.body.user.subscriptionAccess.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'educationLibrary', enabled: true }),
        expect.objectContaining({ key: 'shiftNoteDrafts', enabled: true }),
        expect.objectContaining({ key: 'compatibilityDemo', enabled: true }),
        expect.objectContaining({ key: 'adminReporting', enabled: false }),
      ])
    );

    const res = await request(app)
      .get('/users/me/access')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.access.tier).toBe('growth');
    expect(res.body.access.boundary).toContain('Permission gating only');
    expect(res.body.access).not.toHaveProperty('prices');
    expect(res.body.access).not.toHaveProperty('paymentGateway');
    expect(res.body.access).not.toHaveProperty('card');
    expect(res.body.access).not.toHaveProperty('banking');
  });

  it('rejects /users/me without a token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
  });

  it('updates consent, profile fields, and preferences via PATCH /users/me', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Alan Turing',
      email: 'alan@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    const res = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({
        fullName: 'Alan M. Turing',
        location: 'Parramatta',
        goals: [' Independence ', '', 'Community access'],
        notificationsEnabled: false,
        consent: { dataCollection: true, telehealthPrivacy: true },
      });

    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe('Alan M. Turing');
    expect(res.body.user.location).toBe('Parramatta');
    expect(res.body.user.goals).toEqual(['Independence', 'Community access']);
    expect(res.body.user.notificationsEnabled).toBe(false);
    expect(res.body.user.consent).toEqual(
      expect.objectContaining({ dataCollection: true, telehealthPrivacy: true, aiTranslation: false })
    );

    const second = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ consent: { aiTranslation: true } });

    expect(second.status).toBe(200);
    expect(second.body.user.consent).toEqual(
      expect.objectContaining({ dataCollection: true, telehealthPrivacy: true, aiTranslation: true })
    );
    expect(second.body.user.fullName).toBe('Alan M. Turing');
  });

  it('rejects an empty fullName and unrecognized consent keys on PATCH /users/me', async () => {
    const registration = await request(app).post('/auth/register').send({
      fullName: 'Katherine Johnson',
      email: 'katherine@example.com',
      password: 'supersecret',
      role: 'participant',
    });

    const res = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ fullName: '   ', consent: { paymentSharing: true } });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(
      expect.arrayContaining([
        expect.stringContaining('fullName cannot be empty'),
        expect.stringContaining('consent.paymentSharing is not a recognized field'),
      ])
    );
  });

  it('rejects PATCH /users/me without a token', async () => {
    const res = await request(app).patch('/users/me').send({ fullName: 'No Token' });
    expect(res.status).toBe(401);
  });
});
