import mongoose, { Schema, Document } from "mongoose";

// 1. Sub-Schema for Order Items (The Snapshot)
export interface IOrderItem {
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}
const orderItemSchema = new Schema({
    productId: { type: String, required: true }, // Reference to Product Service
    name:      { type: String, required: true },
    image:     { type: String, required: true },
    price:     { type: Number, required: true }, // Price AT THE TIME of purchase
    quantity:  { type: Number, required: true },
}, { _id: false }); // No separate ID needed for sub-items

// 2. Main Order Interface
export interface IOrder extends Document {
    userId: string;
    items: IOrderItem[];
    totalAmount: number;
    shippingAddress: {
        fullName: string;
        address: string;
        city: string;
        postalCode: string;
        country: string;
    };
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    paymentInfo: {
        id: string; // Stripe/Razorpay Payment ID
        status: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

// 3. Main Order Schema
const orderSchema = new Schema<IOrder>({
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    items: [orderItemSchema],
    totalAmount: { 
        type: Number, 
        required: true 
    },
    shippingAddress: {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentInfo: {
        id: { type: String },
        status: { type: String }
    }
}, { timestamps: true });

export const orderModel = mongoose.model<IOrder>("Order", orderSchema);