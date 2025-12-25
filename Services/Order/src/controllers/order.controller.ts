import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js'; // Assuming you have this
import { orderModel } from "../models/order.model.js";
import axios from 'axios';

export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = (req.user as any).id; 
        const { items, shippingAddress } = req.body;
        const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001';
        console.log(productServiceUrl);
        let totalAmount = 0;
        const finalOrderItems = [];

        // 1. Verify Stock & Price with Product Service
        // We loop through items and verify them one by one (or use a bulk API if available)
        for (const item of items) {
            try {
                // Call Product Service
                const productRes = await axios.get(`${productServiceUrl}/api/products/${item.productId}`);
                console.log("Product Service Response:", productRes.data);
                const product = productRes.data.Product;
                console.log("Fetched Product:", product);
                console.log("Product id from request:", item.productId);

                if (!product) {
                    return res.status(404).json({ message: `Product ${item.productId} not found` });
                }

                if (product.stock < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
                }

                // 2. Build the Safe Order Item (Using Server Price)
                finalOrderItems.push({
                    productId: item.productId,
                    name: product.name,
                    image: product.images[0], // Assuming images array
                    price: product.price,     // SECURITY: Use DB price, not Request price
                    quantity: item.quantity
                });

                totalAmount += product.price * item.quantity;

            } catch (error) {
                return res.status(500).json({ message: "Error contacting Product Service" });
            }
        }
        console.log("----- DEBUGGING ORDER -----");
console.log("1. Item from Request:", items[0]);
console.log("2. Product from Service:", finalOrderItems[0]); 
console.log("---------------------------");
        // 3. Create Order in DB
        const newOrder = await orderModel.create({
            userId,
            items: finalOrderItems,
            totalAmount,
            shippingAddress,
            status: 'pending' // Default status
        });

        res.status(201).json({ 
            message: "Order created successfully", 
            orderId: newOrder._id,
            order: newOrder 
        });

    } catch (error: any) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};