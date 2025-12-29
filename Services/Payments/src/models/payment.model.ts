import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
    userId: string;        // Our User ID
    orderId: string;       // Our internal Order Service ID
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    
    // Razorpay Specific Fields
    razorpayOrderId: string;    // The ID starting with "order_..."
    razorpayPaymentId?: string; // The ID starting with "pay_..." (filled after success)
    razorpaySignature?: string; // For security audit
    
    createdAt: Date;
}

const paymentSchema = new Schema<IPayment>({
    userId: { type: String, required: true },
    orderId: { type: String, required: true }, // Links to Order Service
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    
    // Razorpay Fields
    razorpayOrderId: { type: String, required: true }, 
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }

}, { timestamps: true });

export const paymentModel = mongoose.model<IPayment>("Payment", paymentSchema);