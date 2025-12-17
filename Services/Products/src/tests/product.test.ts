import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB, closeDB, clearDB } from './setup.js';
import { productModel } from '../models/product.model.js'; // <--- ADD THIS


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



describe('Product API - Get All (Filters & Search)', () => {

    // Helper: Create dummy data for testing
    const seedDatabase = async () => {
        const sellerId = new mongoose.Types.ObjectId();
        console.log("============", sellerId);
        
        // We explicitly ensure indexes are built so Text Search works in the test DB
        await productModel.ensureIndexes();

        await productModel.create([
            { 
                name: "Apple iPhone 15", 
                description: "Latest smartphone", 
                price: 1000, 
                category: "electronics", 
                stock: 10, 
                seller: sellerId,
                createdAt: new Date("2023-01-01") // Oldest
            },
            { 
                name: "Samsung Galaxy S24", 
                description: "Android smartphone", 
                price: 900, 
                category: "electronics", 
                stock: 10, 
                seller: sellerId,
                createdAt: new Date("2023-01-02") 
            },
            { 
                name: "Harry Potter Book", 
                description: "Fantasy novel about wizards", 
                price: 20, 
                category: "books", 
                stock: 50, 
                seller: sellerId,
                createdAt: new Date("2023-01-03")
            },
            { 
                name: "Clean Code", 
                description: "A book for developers", 
                price: 45, 
                category: "books", 
                stock: 30, 
                seller: sellerId,
                createdAt: new Date("2023-01-04")
            },
            { 
                name: "MacBook Pro", 
                description: "Powerful laptop", 
                price: 2000, 
                category: "electronics", 
                stock: 5, 
                seller: sellerId,
                createdAt: new Date("2023-01-05") // Newest
            }
        ] as any);
    };

    // Run seed before each test in this block
    beforeEach(async () => {
        await seedDatabase();
    });

    it('should return all products with default pagination', async () => {
        const res = await request(app).get('/api/products/list');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(5); // We created 5 items
        expect(res.body.pagination.total).toEqual(5);
    });

    it('should FILTER by Category', async () => {
        const res = await request(app).get('/api/products/list?category=books');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(2); // Only 2 books
        expect(res.body.data[0].category).toEqual("books");
    });

    it('should FILTER by Price Range (Min & Max)', async () => {
        // Look for items between $30 and $950
        // Should exclude: Harry Potter ($20), iPhone ($1000), MacBook ($2000)
        // Should include: Clean Code ($45), Samsung ($900)
        const res = await request(app).get('/api/products/list?minprice=30&maxprice=950');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(2);
        
        const prices = res.body.data.map((p: any) => p.price);
        expect(prices).toContain(45);
        expect(prices).toContain(900);
    });

    it('should SEARCH by Text (Name & Description)', async () => {
        // Search for "smartphone" (Found in iPhone desc and Samsung desc)
        const res = await request(app).get('/api/products/list?q=smartphone');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(2);
        
        const names = res.body.data.map((p: any) => p.name);
        expect(names).toContain("Apple iPhone 15");
        expect(names).toContain("Samsung Galaxy S24");
    });

    it('should handle PAGINATION correctly', async () => {
        // Total 5 items. Request Page 1, Limit 2.
        const res1 = await request(app).get('/api/products/list?page=1&limit=2');
        
        expect(res1.statusCode).toEqual(200);
        expect(res1.body.data.length).toEqual(2);
        
        // Request Page 2, Limit 2
        const res2 = await request(app).get('/api/products/list?page=2&limit=2');
        expect(res2.body.data.length).toEqual(2);

        // Request Page 3, Limit 2 (Should have 1 item left)
        const res3 = await request(app).get('/api/products/list?page=3&limit=2');
        expect(res3.body.data.length).toEqual(1);
    });

    it('should SORT by Newest by default (when no search term)', async () => {
        const res = await request(app).get('/api/products/list');
        
        // MacBook was created last (March), iPhone created first (Jan)
        // Default sort is createdAt: -1 (Newest first)
        expect(res.body.data[0].name).toEqual("MacBook Pro"); // Newest
        expect(res.body.data[4].name).toEqual("Apple iPhone 15"); // Oldest
    });

    it('should SORT by Relevance when searching', async () => {
        // "Apple" is in the name of iPhone (High score)
        // "Apple" is in the description of iPhone (More score)
        // If we had another item with "Apple" only in description, it would be lower.
        
        const res = await request(app).get('/api/products/list?q=Apple');
        
        expect(res.body.data.length).toBeGreaterThan(0);
        // The first result should be the most relevant one
        expect(res.body.data[0].name).toContain("Apple");
    });

});