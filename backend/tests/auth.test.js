const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

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

describe('Auth API', () => {
  const credentials = {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'supersecret',
    role: 'participant',
  };

  it('registers a new user', async () => {
    const res = await request(app).post('/auth/register').send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.password).toBeUndefined();
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
});
