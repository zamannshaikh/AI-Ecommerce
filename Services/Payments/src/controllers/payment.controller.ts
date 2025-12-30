import { Response } from 'express';
import { razorpay } from '../utils/razarpay';
import { paymentModel } from '../models/payment.model';
import axios from 'axios';
import { AuthRequest } from '../middlewares/auth.middleware';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';


export const createPayment = async (req: AuthRequest, res: Response) => {
    
    const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

    try {
        const { orderId } = req.params;
        const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3003";

        //  Fetch Order Details
        const orderResponse = await axios.get(`${orderServiceUrl}/api/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const amountInRupees = orderResponse.data.order.totalAmount; 

        
        // 3. Create Razorpay Order
        const options = {
            amount: amountInRupees * 100, 
            currency: "INR",
            receipt: `receipt_${orderId}`,
            payment_capture: 1 as any // Cast to 'any' to bypass boolean check
        };

        
        const razorpayOrder = await razorpay.orders.create(options) as any;

        // 4. Save to DB
        const payment = await paymentModel.create({
            orderId: orderId,
            userId: (req.user as any).id, // Fix 5: Cast req.user
            razorpayOrderId: razorpayOrder.id,
            amount: amountInRupees,
            currency: "INR",
            status: "pending",
        });

        // 5. Return Response
        res.status(201).json({ 
            message: 'Payment initiated', 
            keyId: process.env.RAZORPAY_KEY_ID, 
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount, 
            currency: razorpayOrder.currency,
            payment: payment 
        });

    } catch (err: any) { // Fix 6: Type 'err' as 'any'
        console.error("Create Payment Error:", err.message);

        if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
                 return res.status(404).json({ message: 'Order not found' });
            }
        }
        
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const verifyPayment = async (req: AuthRequest, res: Response) => {
    const { razorpayOrderId, paymentId, signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || "";

    try {
        // 1. Validate Signature using Razorpay Utility
        const isValid = validatePaymentVerification(
            {
                order_id: razorpayOrderId,
                payment_id: paymentId
            },
            signature,
            secret
        );

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // 2. Find Pending Payment
       
        const payment = await paymentModel.findOne({ 
            razorpayOrderId, 
            status: 'pending' 
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found or already processed' });
        }

        // 3. Update Payment Status
        payment.razorpayPaymentId = paymentId; // Ensure this matches your Schema field name
        payment.razorpaySignature = signature;
        payment.status = 'completed';

        await payment.save();

        return res.status(200).json({ message: 'Payment verified successfully', paymentId });

    } catch (error: any) {
        console.error("Verification Error:", error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

