import express from 'express';
import { createOrder,getMyOrders,getOrderById } from '../controllers/order.controller.js';
import { validateOrder } from '../middlewares/validator.middleware.js';
import {authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
    '/create', 
   authMiddleware, 
    validateOrder,                   
    createOrder
);


router.get(
    '/my-orders', 
    authMiddleware, 
    getMyOrders
);


router.get(
    '/:id', 
    authMiddleware, 
    getOrderById
);

export default router;