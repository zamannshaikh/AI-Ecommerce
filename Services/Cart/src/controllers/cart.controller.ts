import redis from "../db/redis.js";
import axios from "axios";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { Response } from "express";


const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";

export const addToCart = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = (req.user as any).id;
        const { productId, quantity } = req.body;

        const cartKey = `cart:${userId}`;

        // 1. GET CURRENT CART FROM REDIS
        let cartData = await redis.get(cartKey);
        let cart = cartData ? JSON.parse(cartData) : { items: [], totalPrice: 0 };

        // 2. CHECK IF ITEM EXISTS IN CART
        const existingItemIndex = cart.items.findIndex((item: any) => item.productId === productId);

        if (existingItemIndex > -1) {
            // A. Item exists? Just update quantity.
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // B. New Item? FETCH DETAILS FROM PRODUCT SERVICE (Secure Step)
            // We only do this network call ONCE per item add.
            const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
            const product = productResponse.data.product;

            cart.items.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                image: product.images[0], // Take first image
                quantity: quantity
            });
        }

        // 3. RECALCULATE TOTALS
        cart.totalPrice = cart.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

        // 4. SAVE BACK TO REDIS (With Expiry, e.g., 7 days)
        await redis.set(cartKey, JSON.stringify(cart), "EX", 604800);

        return res.status(200).json({ message: "Item added", cart });

    } catch (error) {
        return res.status(500).json({ message: "Error", error });
    }
};