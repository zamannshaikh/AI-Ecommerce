import express from 'express';
import { createOrder,getMyOrders,getOrderById,cancelOrder,updateOrderStatus } from '../controllers/order.controller.js';
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

router.put('/:id/cancel', authMiddleware, cancelOrder);

router.put(
    '/:id/status', 
    authMiddleware, 
    updateOrderStatus
);

export default router;