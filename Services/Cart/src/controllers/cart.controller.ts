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
        console.log("Cart Data from Redis:", cartData);
        let cart = cartData ? JSON.parse(cartData) : { items: [], totalPrice: 0 };

        // 2. CHECK IF ITEM EXISTS IN CART
        const existingItemIndex = cart.items.findIndex((item: any) => item.productId === productId);
        console.log("Existing Item Index:", existingItemIndex);
        if (existingItemIndex > -1) {
            // A. Item exists? Just update quantity.
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // B. New Item? FETCH DETAILS FROM PRODUCT SERVICE (Secure Step)
            // We only do this network call ONCE per item add.
            const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
            console.log("Product Response:", productResponse.data);
            const product = productResponse.data.Product;
            console.log("Fetched Product:", product);

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

export const getCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const cartKey = `cart:${userId}`;

        const cartData = await redis.get(cartKey);
        
        // Return existing cart OR an empty structure if they haven't added anything yet
        const cart = cartData ? JSON.parse(cartData) : { items: [], totalPrice: 0 };

        return res.status(200).json({ 
            message: "Cart fetched successfully", 
            cart 
        });

    } catch (error) {
        return res.status(500).json({ message: "Error fetching cart", error });
    }
};


export const removeFromCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { productId } = req.params;
        const cartKey = `cart:${userId}`;

        const cartData = await redis.get(cartKey);
        if (!cartData) {
            return res.status(404).json({ message: "Cart is empty" });
        }

        let cart = JSON.parse(cartData);

        // Filter OUT the item to delete
        cart.items = cart.items.filter((item: any) => item.productId !== productId);

        // Recalculate Total
        cart.totalPrice = cart.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

        // Save back to Redis
        await redis.set(cartKey, JSON.stringify(cart), "EX", 604800);

        return res.status(200).json({ message: "Item removed", cart });

    } catch (error) {
        return res.status(500).json({ message: "Error removing item", error });
    }
};


export const updateQuantity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = (req.user as any).id;
        const { productId, quantity } = req.body; // quantity should be the NEW total (e.g., 3)
        const cartKey = `cart:${userId}`;

        const cartData = await redis.get(cartKey);
        if (!cartData) {
            return res.status(404).json({ message: "Cart not found" });
        }

        let cart = JSON.parse(cartData);
        const itemIndex = cart.items.findIndex((item: any) => item.productId === productId);

        if (itemIndex > -1) {
            if (quantity > 0) {
                // Update quantity
                cart.items[itemIndex].quantity = quantity;
            } else {
                // If quantity sent is 0 or negative, remove the item
                cart.items.splice(itemIndex, 1);
            }
            
            // Recalculate Total
            cart.totalPrice = cart.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

            await redis.set(cartKey, JSON.stringify(cart), "EX", 604800);
            return res.status(200).json({ message: "Cart updated", cart });
        } else {
            return res.status(404).json({ message: "Item not found in cart" });
        }

    } catch (error) {
        return res.status(500).json({ message: "Error updating cart", error });
    }
};