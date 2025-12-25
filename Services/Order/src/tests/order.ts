import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// 1. Define Mocks
jest.unstable_mockModule('axios', () => ({
    default: {
        get: jest.fn() // We mock the Product Service call
    }
}));

// 2. Imports
const axiosModule = await import('axios') as any;
const axios = axiosModule.default;

const appModule = await import('../app.js') as any;
const app = appModule.app || appModule.default;

const { orderModel } = await import('../models/order.model.js') as any; // Import model to check DB

describe('Order Service - Create Order', () => {
    let userToken: string;

    beforeAll(() => {
        userToken = jwt.sign({ id: "user_123", role: 'buyer' }, process.env.JWT_SECRET || 'testsecret');
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should fail validation if address is missing', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', [`token=${userToken}`])
            .send({
                items: [{ productId: "p1", quantity: 1 }]
                // Missing shippingAddress
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.errors).toBeDefined();
    });

    it('should fail if Product Service says "Out of Stock"', async () => {
        // Mock Axios: Product exists but low stock
        (axios.get as jest.Mock<any>).mockResolvedValue({
            data: {
                product: { _id: "p1", name: "Phone", price: 100, stock: 0 } // Stock 0
            }
        });

        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', [`token=${userToken}`])
            .send({
                items: [{ productId: "p1", quantity: 1 }],
                shippingAddress: { fullName: "John", address: "Street", city: "NY", postalCode: "100", country: "US" }
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/Insufficient stock/);
    });

    it('should create order successfully with SERVER-SIDE price', async () => {
        // Mock Axios: Valid Product
        (axios.get as jest.Mock<any>).mockResolvedValue({
            data: {
                product: { _id: "p1", name: "Phone", price: 500, stock: 10, images: ["img.png"] }
            }
        });

        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', [`token=${userToken}`])
            .send({
                // Client tries to send fake price (10), server should ignore it
                items: [{ productId: "p1", quantity: 2, price: 10 }], 
                shippingAddress: { fullName: "John", address: "Street", city: "NY", postalCode: "100", country: "US" }
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.order.totalAmount).toEqual(1000); // 500 * 2 (Not 10 * 2)
        expect(res.body.order.status).toEqual('pending');
    });
});