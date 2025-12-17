import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB, closeDB, clearDB } from './setup.js';

// --- 1. DEFINE MOCK BEFORE IMPORTING APP ---
// We use unstable_mockModule because you are using ES Modules ("type": "module")
jest.unstable_mockModule('../utils/imagekit.js', () => ({
  uploadImage: jest.fn().mockImplementation(async () => "https://fake-url.com/uploaded_image.jpg"),
  imagekit: {}
}));

// --- 2. DYNAMIC APP VARIABLE ---
let app: any;

beforeAll(async () => {
  await connectDB();
  
  // --- 3. IMPORT APP HERE (AFTER MOCK IS READY) ---
  // This ensures 'app.js' uses the fake imagekit, not the real one.
  const appModule = await import('../app.js');
  app = appModule.default;
});

afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe('Product API - Multi-Image Upload', () => {

  const generateSellerToken = () => {
    return jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: 'seller' },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  };

  it('should upload MULTIPLE images and create a product', async () => {
    const token = generateSellerToken();
    const buffer1 = Buffer.from('fake-image-1');
    const buffer2 = Buffer.from('fake-image-2');

    const res = await request(app)
      .post('/api/products/add')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Gallery Product')
      .field('description', 'Has many images')
      .field('price', 999)
      .field('category', 'art')
      .field('stock', 5)
      // Attach files
      .attach('images', buffer1, 'photo1.jpg')
      .attach('images', buffer2, 'photo2.jpg');

    expect(res.statusCode).toEqual(201);
    
    // ✅ Verify we got the FAKE URL (Test will pass now)
    expect(res.body.product.images[0]).toEqual("https://fake-url.com/uploaded_image.jpg");
    expect(res.body.product.images.length).toEqual(2);
  });

  it('should create a product with NO images (empty array)', async () => {
    const token = generateSellerToken();

    const res = await request(app)
      .post('/api/products/add')
      .set('Authorization', `Bearer ${token}`)
      .send({
          name: "Text Only Product",
          description: "No pics",
          price: 100,
          category: "books",
          stock: 50
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.product.images).toEqual([]);
  });

  it('should fail if user is not a seller/admin', async () => {
    const userToken = jwt.sign(
        { id: "123", role: "user" }, 
        process.env.JWT_SECRET || 'testsecret'
    );

    const res = await request(app)
      .post('/api/products/add')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: "Hacker Item", price: 10 });

    expect(res.statusCode).toEqual(403);
  });

});