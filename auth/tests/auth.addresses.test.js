process.env.JWT_SECRET = 'test_jwt_secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const User = require('../src/models/user.model');

let mongoServer;

/* -------------------- DB SETUP -------------------- */
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

/* -------------------- HELPERS -------------------- */
async function seedUserAndLogin({
  username = 'addr_user',
  email = 'addr@test.com',
  password = 'Secret123!'
} = {}) {
  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hash,
    fullname: { firstname: 'Addr', lastname: 'User' },
    addresses: [],
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  expect(loginRes.status).toBe(200);
  const cookies = loginRes.headers['set-cookie'];
  expect(cookies).toBeDefined();

  return { user, cookies };
}

/* -------------------- TESTS -------------------- */
describe('User Addresses API', () => {

  /* -------- GET ADDRESSES -------- */
  describe('GET /api/auth/users/me/addresses', () => {

    it('requires authentication', async () => {
      const res = await request(app)
        .get('/api/auth/users/me/addresses');

      expect(res.status).toBe(401);
    });

    it('returns addresses with a default one', async () => {
      const { user, cookies } = await seedUserAndLogin({
        email: 'list@test.com'
      });

      user.addresses.push(
        {
          street: '221B Baker St',
          city: 'London',
          state: 'LDN',
          pincode: '560001',
          country: 'UK',
          isDefault: true,
        },
        {
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'SP',
          pincode: '49007',
          country: 'USA',
        }
      );
      await user.save();

      const res = await request(app)
        .get('/api/auth/users/me/addresses')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.addresses)).toBe(true);
      expect(res.body.addresses.length).toBe(2);
      expect(
        res.body.addresses.some(a => a.isDefault === true)
      ).toBe(true);
    });
  });

  /* -------- ADD ADDRESS -------- */
  describe('POST /api/auth/users/me/addresses', () => {

    it('validates pincode and phone', async () => {
      const { cookies } = await seedUserAndLogin({
        email: 'bad@test.com'
      });

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', cookies)
        .send({
          street: 'Invalid',
          city: 'X',
          state: 'Y',
          pincode: '12',
          country: 'IN',
          phone: 'abc',
        });

      expect([400, 422]).toContain(res.status);
    });

    it('adds an address and sets default', async () => {
      const { cookies } = await seedUserAndLogin({
        email: 'add@test.com'
      });

      const res = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', cookies)
        .send({
          street: '1600 Amphitheatre Pkwy',
          city: 'Mountain View',
          state: 'CA',
          pincode: '94043',
          country: 'US',
          phone: '9876543210',
          isDefault: true,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.address).toBeDefined();
      expect(res.body.address.isDefault).toBe(true);
    });
  });

  /* -------- DELETE ADDRESS -------- */
  describe('DELETE /api/auth/users/me/addresses/:id', () => {

    it('removes an address', async () => {
      const { user, cookies } = await seedUserAndLogin({
        email: 'del@test.com'
      });

      user.addresses.push({
        street: 'Delete St',
        city: 'X',
        state: 'Y',
        pincode: '560001',
        country: 'IN',
      });
      await user.save();

      const addressId = user.addresses[0]._id.toString();

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${addressId}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);

      const refreshed = await User.findById(user._id);
      expect(refreshed.addresses.length).toBe(0);
    });

    it('returns 404 if address not found', async () => {
      const { cookies } = await seedUserAndLogin({
        email: 'nf@test.com'
      });

      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/auth/users/me/addresses/${fakeId}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(404);
    });
  });
});
