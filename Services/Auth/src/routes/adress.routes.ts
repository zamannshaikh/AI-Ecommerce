import express from 'express';
import { addAddress, deleteAddress, updateAddress,getAddresses } from '../controllers/adress.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {addessValidation} from '../middleware/validator.middleware.js';

const router = express.Router();

// All these routes are protected by 'authMiddleware'
router.post('/', addessValidation, authMiddleware, addAddress);
router.delete('/:id', authMiddleware, deleteAddress);
router.put('/:id', addessValidation,authMiddleware, updateAddress);
router.get('/', authMiddleware, getAddresses);

export default router;