import express from 'express';
import { createOrder } from '../controllers/order.controller.js';
import { validateOrder } from '../middlewares/validator.middleware.js';
import {authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
    '/create', 
   authMiddleware, 
    validateOrder,                   
    createOrder
);

export default router;