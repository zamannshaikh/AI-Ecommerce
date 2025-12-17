import express from 'express';
// import { createProduct } from '../controllers/product.controller.js';
import { createAuthMiddleware } from '../middlewares/auth.middleware.js';
import { createProduct,getProducts } from '../controllers/product.controller.js';
import multer from 'multer';

const router = express.Router();
const storage = multer.memoryStorage(); // We store files in memory to send to ImageKit
const upload = multer({ storage });

// ✅ PROTECTED: Only 'seller' or 'admin' can add products
router.post(
  '/add', 
  createAuthMiddleware(['seller', 'admin']),
  upload.array('images', 5),
  createProduct
);

router.get('/list', getProducts);



export default router;