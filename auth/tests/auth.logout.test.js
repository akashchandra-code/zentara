process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const userModel = require('../src/models/user.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await userModel.deleteMany({});
});

describe('GET /api/auth/logout', () => {
  it('clears the auth cookie and returns 200 when logged in', async () => {
    const password = 'Secret123!';
    const hash = await bcrypt.hash(password, 10);

    await userModel.create({
      username: 'logout_user',
      email: 'logout@example.com',
      password: hash,
      fullname: { firstname: 'Log', lastname: 'Out' },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logout@example.com', password });

    expect(loginRes.status).toBe(200);

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);

    const setCookie = res.headers['set-cookie'] || [];
    const cookieStr = setCookie.join(';');

    expect(cookieStr).toMatch(/token=;/);
    expect(cookieStr.toLowerCase()).toMatch(/expires=/);
  });

  it('is idempotent: returns 200 even without auth cookie', async () => {
    const res = await request(app).get('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});
