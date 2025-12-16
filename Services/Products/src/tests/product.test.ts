import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken'; // We need this to forge tokens
import mongoose from 'mongoose';



import app from '../app.js'; // Ensure app is exported from app.ts
import { connectDB, closeDB, clearDB } from './setup.js';

// Setup DB
beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Product API - Create', () => {

  // --- HELPER: Forge a JWT Token ---
  const generateTestToken = (role: string) => {
    // We create a fake user ID
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    
    // We sign it using the SAME secret your app uses
    return jwt.sign(
      { id: fakeUserId, role: role, email: 'test@example.com' },
      process.env.JWT_SECRET || 'testsecret', // Fallback if env is missing
      { expiresIn: '1h' }
    );
  };

  it('should allow a Seller to create a product', async () => {
    // 1. Get a token with 'seller' role
    const sellerToken = generateTestToken('seller');

    const productData = {
      name: "Gaming Mouse",
      description: "High precision mouse",
      price: 50,
      category: "electronics",
      stock: 100,
      images: ["http://example.com/mouse.jpg"]
    };

    const res = await request(app)
      .post('/api/products/add') // Update this if your route prefix is different
      .set('Authorization', `Bearer ${sellerToken}`) // Send Token
      .send(productData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toEqual("Product created successfully");
    expect(res.body.product.name).toEqual("Gaming Mouse");
    expect(res.body.product.seller).toBeDefined(); // Ensure seller ID was saved
  });

  it('should allow an Admin to create a product', async () => {
    const adminToken = generateTestToken('admin');

    const res = await request(app)
      .post('/api/products/add')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: "Admin Product",
        description: "Test",
        price: 10,
        category: "test",
        stock: 1
      });

    expect(res.statusCode).toEqual(201);
  });

  it('should BLOCK a regular User from creating a product', async () => {
    // 1. Get a token with 'user' role
    const userToken = generateTestToken('user');

    const res = await request(app)
      .post('/api/products/add')
      .set('Authorization', `Bearer ${userToken}`) // Send User Token
      .send({ name: "Hacker Product", price: 100 });

    expect(res.statusCode).toEqual(403); // Forbidden
    expect(res.body.message).toContain("Insufficient permissions");
  });

  it('should fail if price is negative', async () => {
    const sellerToken = generateTestToken('seller');

    const res = await request(app)
      .post('/api/products/add')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: "Bad Product",
        description: "Desc",
        price: -50, // ❌ Invalid
        category: "oops",
        stock: 10
      });

    expect(res.statusCode).toEqual(400); // Validation Error
    expect(res.body.message).toContain("Price cannot be negative");
  });

});