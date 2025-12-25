import express from 'express';
import { createOrder } from '../controllers/order.controller.js';
import { validateOrder } from '../middlewares/validator.middleware.js';
import { createAuthMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
    '/', 
    createAuthMiddleware(['user']), // Only buyers create orders
    validateOrder,                   // Express-Validator runs here
    createOrder
);

export default router;