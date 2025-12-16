import express from 'express';
// import { createProduct } from '../controllers/product.controller.js';
import { createAuthMiddleware } from '../middlewares/auth.middleware.js';
import { createProduct } from '../controllers/product.controller.js';

const router = express.Router();

// ✅ PROTECTED: Only 'seller' or 'admin' can add products
router.post(
  '/add', 
  createAuthMiddleware(['seller', 'admin']),createProduct
);

export default router;