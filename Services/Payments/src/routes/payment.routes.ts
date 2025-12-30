import express from 'express';
import { createPayment ,verifyPayment} from '../controllers/payment.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/create/:orderId',createAuthMiddleware(['user']) , createPayment);
router.post('/verify', createAuthMiddleware(['user']), verifyPayment);

export default router;