import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../app.js';
import { connectDB, closeDB, clearDB } from './setup.js';




jest.mock('../db/redis.js', () => ({
  __esModule: true, // Needed for ES Modules
  default: {
    set: jest.fn(), // We fake the 'set' function (used in logout)
    on: jest.fn(),  // Fake event listeners
  }
}));

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Auth API - Register', () => {
  
  it('should register a new user successfully', async () => {
    const newUser = {
      username: 'tdduser',
      email: 'tdd@example.com',
      password: 'StrongPassword@123', // ✅ Fixed: Strong Password
      fullname: {
        firstName: 'Test',            // ✅ Fixed: lowercase keys
        lastName: 'Driven'
      }
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    // If this fails, console log the error to see why!
    if (res.statusCode !== 201) {
      console.log("Test 1 Failed Response:", res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
  });

  it('should fail if email is already taken', async () => {
    const duplicateUser = {
      username: 'user1', 
      email: 'tdd@example.com', 
      password: 'StrongPassword@123', // ✅ Fixed: Strong Password
      fullname: { firstName: 'Abc', lastName: 'Bbb'}
    };

    // 1. First registration (Should Succeed)
    await request(app).post('/api/auth/register').send(duplicateUser);

    // 2. Second registration (Should Fail)
    const res = await request(app).post('/api/auth/register').send(duplicateUser);

    expect(res.statusCode).toEqual(400); 
    expect(res.body.message).toEqual('User already exists');
  });
});




describe('Auth API - Login', () => {

  // We need a helper function or just copy-paste the user data
  const validUser = {
    username: 'loginuser',
    email: 'login@example.com',
    password: 'StrongPassword@123',
    fullname: { firstName: 'Login', lastName: 'User' }
  };

  it('should login successfully with valid credentials', async () => {
    // 1. ARRANGE: Create the user first (so they exist in DB)
    await request(app).post('/api/auth/register').send(validUser);

    // 2. ACT: Try to login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: validUser.password
      });

    // 3. ASSERT
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Login successful');
    
    // Check if the HTTP-Only cookie was set
    // 'set-cookie' is an array of strings
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
  });

  it('should fail login with incorrect password', async () => {
    // 1. ARRANGE: Create the user
    await request(app).post('/api/auth/register').send(validUser);

    // 2. ACT: Login with WRONG password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: 'WrongPassword123'
      });

    // 3. ASSERT
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Invalid credentials');
  });

  it('should fail login if user does not exist', async () => {
    // 1. ARRANGE: Do NOT register anyone. Database is empty.

    // 2. ACT: Try to login with random credentials
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ghost@example.com',
        password: 'anypassword'
      });

    // 3. ASSERT
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Invalid credentials');
  });
});


describe('Auth API - Get Current User', () => {

  const userPayload = {
    username: 'profileuser',
    email: 'profile@example.com',
    password: 'StrongPassword@123',
    fullname: { firstName: 'Profile', lastName: 'User' }
  };

  it('should retrieve current user profile when logged in', async () => {
    // 1. ARRANGE: Register and Login to get a valid token
    await request(app).post('/api/auth/register').send(userPayload);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: userPayload.password
    });

    // ⚠️ CRITICAL STEP: Extract the cookie from the login response
    const cookie = loginRes.headers['set-cookie'];

    // 2. ACT: Request the profile WITH the cookie
    const res = await request(app)
      .get('/api/auth/current') // <--- Make sure this matches your actual route!
      .set('Cookie', cookie); // Attach the cookie to the request

    // 3. ASSERT
    expect(res.statusCode).toEqual(200);
    // Check that we got the correct user data back
    expect(res.body.user.email).toEqual(userPayload.email);
    expect(res.body.user.username).toEqual(userPayload.username);
    // Security Check: Password should NOT be returned
    expect(res.body.user.password).toBeUndefined();
  });

  it('should fail to get profile if not logged in', async () => {
    // 1. ACT: Request profile WITHOUT any cookie
    const res = await request(app).get('/api/auth/current');

    // 2. ASSERT
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('No token provided');
  });

  it('should fail if token is invalid (tampered cookie)', async () => {
    // 1. ACT: Request with a fake cookie
    const res = await request(app)
      .get('/api/auth/current')
      .set('Cookie', ['token=invalid_fake_token']);

    // 2. ASSERT
    // Your middleware catches the error and returns 401
    expect(res.statusCode).toEqual(401); 
  });

});



describe('Auth API - Logout', () => {

  const userPayload = {
    username: 'logoutuser',
    email: 'logout@example.com',
    password: 'StrongPassword@123',
    fullname: { firstName: 'Log', lastName: 'Out' }
  };

  it('should logout successfully and clear cookie', async () => {
    // A. ARRANGE: Register & Login to get a valid token
    await request(app).post('/api/auth/register').send(userPayload);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userPayload.email,
      password: userPayload.password
    });
    
    const cookie = loginRes.headers['set-cookie']; // Grab the login cookie

    // B. ACT: Call Logout WITH the cookie
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    // C. ASSERT
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual("Logged out successfully");

    // Check if the cookie was cleared
    // When clearing a cookie, Express sends it back with an empty value 
    // and an expiry date in the past (1970).
    const logoutCookie = res.headers['set-cookie'][0];
    expect(logoutCookie).toMatch(/token=;/); // Value should be empty
  });

  it('should handle logout even if user is not logged in', async () => {
    // A. ACT: Call logout with NO cookie
    const res = await request(app).post('/api/auth/logout');

    // B. ASSERT
    // Your controller doesn't throw an error if token is missing,
    // it just clears the (non-existent) cookie and returns 200.
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual("Logged out successfully");
  });

});