process.env.JWT_SECRET = "test_jwt_secret";
process.env.NODE_ENV = "test";

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const User = require('../src/models/user.model');

let mongoServer;

/* ------------------- DB SETUP ------------------- */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

/* ------------------- HELPERS ------------------- */
async function createUser() {
  const plainPassword = 'password123';
  const hashed = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    username: 'user_' + Date.now(),
    email: `user_${Date.now()}@test.com`,
    password: hashed,
    fullname: { firstname: 'Test', lastname: 'User' },
  });

  return { user, plainPassword };
}

/* ------------------- TESTS ------------------- */
describe('GET /api/auth/me', () => {

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid token', async () => {
    const fakeToken = jwt.sign(
      { id: '000000000000000000000000' },
      'wrong_secret'
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 200 and user for valid token', async () => {
    const { user, plainPassword } = await createUser();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: plainPassword });

    expect(login.status).toBe(200);
    expect(login.body).toHaveProperty('token');

    const token = login.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

});
