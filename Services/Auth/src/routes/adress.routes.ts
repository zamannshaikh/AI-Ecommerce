import express from 'express';
import { addAddress, deleteAddress, updateAddress } from '../controllers/adress.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// All these routes are protected by 'authMiddleware'
router.post('/', authMiddleware, addAddress);
router.delete('/:id', authMiddleware, deleteAddress);
router.put('/:id', authMiddleware, updateAddress);

export default router;