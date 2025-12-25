import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ------------------------------------------------------------------
// 1. DEFINE MOCKS
// ------------------------------------------------------------------

// Mock Redis
jest.unstable_mockModule('../db/redis.js', () => ({
    redis: {
        get: jest.fn(),
        set: jest.fn(),
    }
}));

// Mock Axios
jest.unstable_mockModule('axios', () => ({
    default: {
        get: jest.fn(),
        post: jest.fn()
    }
}));

// ------------------------------------------------------------------
// 2. DYNAMIC IMPORTS
// ------------------------------------------------------------------
const redisModule = await import('../db/redis.js') as any;
const redis = redisModule.redis;

const axiosModule = await import('axios') as any;
const axios = axiosModule.default;

const appModule = await import('../app.js') as any;
const app = appModule.app || appModule.default;

describe('Cart Service APIs', () => {
    let userToken: string;
    const userId = "user_123";
    const productId = "prod_abc";

    beforeAll(() => {
        userToken = jwt.sign(
            { id: userId, role: 'buyer' }, 
            process.env.JWT_SECRET || 'testsecret'
        );
    });

    beforeEach(() => {
        // 1. Clear history and implementations
        jest.resetAllMocks();

        // 2. RESTORE DEFAULT IMPLEMENTATIONS (Crucial Step!)
        
        // Redis Defaults: get returns null (empty), set returns "OK"
        (redis.get as jest.Mock<any>).mockResolvedValue(null);
        (redis.set as jest.Mock<any>).mockResolvedValue("OK");

        // Axios Defaults: returns 200 OK to prevent crashes
        (axios.get as jest.Mock<any>).mockResolvedValue({ status: 200, data: {} });
        (axios.post as jest.Mock<any>).mockResolvedValue({ status: 200, data: {} });
    });

    // ==================================================================
    // TEST 1: VIEW CART (GET /)
    // ==================================================================
    describe('GET /api/cart', () => {
        it('should return an EMPTY cart if Redis is null', async () => {
            (redis.get as jest.Mock<any>).mockResolvedValue(null);

            const res = await request(app)
                .get('/api/cart')
                .set('Cookie', [`token=${userToken}`]);

            expect(res.statusCode).toEqual(200);
            expect(res.body.cart.items).toEqual([]);
        });

        it('should return existing cart items from Redis', async () => {
            const mockCart = {
                items: [{ productId, name: "Test Item", price: 100, quantity: 2 }],
                totalPrice: 200
            };
            (redis.get as jest.Mock<any>).mockResolvedValue(JSON.stringify(mockCart));

            const res = await request(app)
                .get('/api/cart')
                .set('Cookie', [`token=${userToken}`]);

            expect(res.statusCode).toEqual(200);
            expect(res.body.cart.items.length).toEqual(1);
        });
    });

    // ==================================================================
    // TEST 2: ADD TO CART (POST /add)
    // ==================================================================
    describe('POST /api/cart/add', () => {
        it('should fetch product details via Axios and add to cart', async () => {
            (redis.get as jest.Mock<any>).mockResolvedValue(null);
            
            // Mock Axios to return the Product
            (axios.get as jest.Mock<any>).mockResolvedValue({
                status: 200,
                data: {
                    product: { 
                        _id: productId, 
                        name: "New Phone", 
                        price: 500, 
                        images: ["img.jpg"] 
                    }
                }
            });

            const res = await request(app)
                .post('/api/cart/add')
                .set('Cookie', [`token=${userToken}`])
                .send({ productId, quantity: 1 });

            // Debug log if it fails
            if (res.statusCode !== 200) console.log("POST Error:", res.body);

            expect(res.statusCode).toEqual(200);
            expect(axios.get).toHaveBeenCalled();
            expect(redis.set).toHaveBeenCalled();
        });
    });

    // ==================================================================
    // TEST 3: UPDATE QUANTITY (PUT /item)
    // ==================================================================
    describe('PUT /api/cart/item', () => {
        it('should update quantity and recalculate total', async () => {
            const initialCart = {
                items: [{ productId, name: "Test Item", price: 100, quantity: 1 }],
                totalPrice: 100
            };
            
            // Ensure Redis returns this cart
            (redis.get as jest.Mock<any>).mockResolvedValue(JSON.stringify(initialCart));

            const res = await request(app)
                .put('/api/cart/item')
                .set('Cookie', [`token=${userToken}`])
                .send({ productId, quantity: 3 });

            if (res.statusCode !== 200) console.log("PUT Error:", res.body);

            expect(res.statusCode).toEqual(200);
            expect(res.body.cart.totalPrice).toEqual(300);
        });
    });

    // ==================================================================
    // TEST 4: REMOVE ITEM (DELETE /item)
    // ==================================================================
    describe('DELETE /api/cart/item/:id', () => {
        it('should remove the specific item', async () => {
            const initialCart = {
                items: [
                    { productId: "prod_1", price: 10, quantity: 1 },
                    { productId: "prod_2", price: 20, quantity: 1 }
                ],
                totalPrice: 30
            };
            (redis.get as jest.Mock<any>).mockResolvedValue(JSON.stringify(initialCart));

            const res = await request(app)
                .delete(`/api/cart/item/prod_2`)
                .set('Cookie', [`token=${userToken}`]);

            if (res.statusCode !== 200) console.log("DELETE Error:", res.body);

            expect(res.statusCode).toEqual(200);
            expect(res.body.cart.items.length).toEqual(1);
            expect(res.body.cart.items[0].productId).toEqual("prod_1");
        });
    });
});