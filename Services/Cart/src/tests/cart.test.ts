import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ------------------------------------------------------------------
// 1. DEFINE MOCKS
// ------------------------------------------------------------------
jest.unstable_mockModule('../db/redis.js', () => ({
    redis: {
        get: jest.fn(),
        set: jest.fn(),
    }
}));

jest.unstable_mockModule('axios', () => ({
    default: {
        get: jest.fn()
    }
}));

// ------------------------------------------------------------------
// 2. DYNAMIC IMPORTS WITH TYPE CASTING (Fixes TS Errors)
// ------------------------------------------------------------------
// We treat these as 'any' to stop TypeScript from complaining about missing properties.
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
        jest.clearAllMocks();
    });

    // ==================================================================
    // TEST 1: VIEW CART (GET /)
    // ==================================================================
    describe('GET /api/cart', () => {
        it('should return an EMPTY cart if Redis is null', async () => {
            // FIX: Cast to jest.Mock so we can use .mockResolvedValue
            (redis.get as jest.Mock<any>).mockResolvedValue(null);

            const res = await request(app)
                .get('/api/cart/')
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
                .get('/api/cart/')
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
            
            // FIX: Cast axios.get to jest.Mock
            (axios.get as jest.Mock<any>).mockResolvedValue({
                data: {
                    product: { _id: productId, name: "New Phone", price: 500, images: ["img.jpg"] }
                }
            });

            const res = await request(app)
                .post('/api/cart/add')
                .set('Cookie', [`token=${userToken}`])
                .send({ productId, quantity: 1 });

            expect(res.statusCode).toEqual(200);
            expect(axios.get).toHaveBeenCalled();
            expect(redis.set).toHaveBeenCalled();
        });
    });

    // ==================================================================
    // TEST 3: UPDATE QUANTITY
    // ==================================================================
    describe('PUT /api/cart/item', () => {
        it('should update quantity and recalculate total', async () => {
            const initialCart = {
                items: [{ productId, name: "Test Item", price: 100, quantity: 1 }],
                totalPrice: 100
            };
            (redis.get as jest.Mock<any>).mockResolvedValue(JSON.stringify(initialCart));

            const res = await request(app)
                .put('/api/cart/item')
                .set('Cookie', [`token=${userToken}`])
                .send({ productId, quantity: 3 });

            expect(res.statusCode).toEqual(200);
            expect(res.body.cart.totalPrice).toEqual(300);
        });
    });

    // ==================================================================
    // TEST 4: REMOVE ITEM
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

            expect(res.statusCode).toEqual(200);
            expect(res.body.cart.items.length).toEqual(1);
            expect(res.body.cart.items[0].productId).toEqual("prod_1");
        });
    });
});