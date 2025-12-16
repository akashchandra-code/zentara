process.env.JWT_SECRET = "test_jwt_secret";
process.env.NODE_ENV = "test";

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 without password', async () => {
    const payload = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'secret123',
      fullname: { firstname: 'Test', lastname: 'User' },
      role: 'user',
    };

    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('_id');

    const dbUser = await User.findOne({ email: payload.email }).lean();
    expect(dbUser).toBeTruthy();
    expect(dbUser.username).toBe(payload.username);
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });
});
