process.env.JWT_SECRET = "test_jwt_secret";
process.env.NODE_ENV = "test";

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

async function createUser(overrides = {}) {
  const password = overrides.password || 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    username: overrides.username || 'u' + Date.now(),
    email: overrides.email || `e${Date.now()}@example.com`,
    password: hashedPassword,
    fullname: { firstname: 'F', lastname: 'L' },
    role: 'user',
  });

  await user.save();
  return { user, plainPassword: password };
}

describe('POST /api/auth/login', () => {

  it('authenticates with email and password and returns token + user', async () => {
    const { user, plainPassword } = await createUser({
      email: 'login@test.com',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: plainPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 for wrong password', async () => {
    const { user } = await createUser({
      email: 'wrong@test.com',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });

});
