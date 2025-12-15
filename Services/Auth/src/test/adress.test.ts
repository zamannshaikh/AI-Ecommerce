import { jest } from '@jest/globals';
import request from 'supertest';

// Mock Redis (Required since you use it in Auth)
jest.mock('../db/redis.js', () => ({
  __esModule: true,
  default: { set: jest.fn(), on: jest.fn() }
}));

import app from '../app.js';
import { connectDB, closeDB, clearDB } from './setup.js';

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Address API', () => {

  // Helper Variables
  let token: string;
  let addressId: string;

  const userPayload = {
    username: 'addressuser',
    email: 'addr@example.com',
    password: 'StrongPassword@123',
    fullname: { firstName: 'Addr', lastName: 'User' }
  };

  // Run this BEFORE the tests to create a user and get a token
  beforeEach(async () => {
    // 1. Register
    await request(app).post('/api/auth/register').send(userPayload);
    // 2. Login
    const res = await request(app).post('/api/auth/login').send({
      email: userPayload.email, password: userPayload.password
    });
    // 3. Extract Token Cookie
    const cookie = res.headers['set-cookie'];
    token = cookie; // Save for tests
  });

  it('should add a new address', async () => {
    const newAddress = {
      street: '123 Tech Lane',
      city: 'Code City',
      state: 'TS',
      zip: '90210',
      country: 'USA'
    };

    const res = await request(app)
      .post('/api/address')
      .set('Cookie', token)
      .send(newAddress);

    expect(res.statusCode).toEqual(201);
    expect(res.body.address).toHaveProperty('street', '123 Tech Lane');
    expect(res.body.address).toHaveProperty('_id'); // Ensure it has an ID
  });

  it('should update an existing address', async () => {
    // 1. Create an address first
    const createRes = await request(app)
      .post('/api/address')
      .set('Cookie', token)
      .send({ street: 'Old St', city: 'Old', state: 'O', zip: '000', country: 'Old' });
    
    const addrId = createRes.body.address._id;

    // 2. Update it
    const updateRes = await request(app)
      .put(`/api/address/${addrId}`)
      .set('Cookie', token)
      .send({ 
        street: 'New St', city: 'New', state: 'N', zip: '111', country: 'New' 
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.message).toEqual('Address updated successfully');
  });

  it('should delete an address', async () => {
    // 1. Create an address
    const createRes = await request(app)
      .post('/api/address')
      .set('Cookie', token)
      .send({ street: 'Delete St', city: 'Del', state: 'D', zip: '666', country: 'Del' });

    const addrId = createRes.body.address._id;

    // 2. Delete it
    const deleteRes = await request(app)
      .delete(`/api/address/${addrId}`)
      .set('Cookie', token);

    expect(deleteRes.statusCode).toEqual(200);
    expect(deleteRes.body.message).toEqual('Address deleted successfully');
  });

});