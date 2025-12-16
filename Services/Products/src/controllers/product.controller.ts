import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { productModel } from "../models/product.model.js";
import mongoose from "mongoose";

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Validate User
        // The middleware guarantees req.user exists, but we check 'id' safely
        const userId = (req.user as any)?.id; 
        
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID missing" });
        }

        const { name, description, price, category, stock, images } = req.body;

        // 2. Create Product
        const newProduct = await productModel.create({
            name,
            description,
            price,
            category,
            stock,
            images,
            // Convert string ID from token to MongoDB ObjectId
            seller: new mongoose.Types.ObjectId(userId) 
        } as any);

        // 3. Respond
        res.status(201).json({
            message: "Product created successfully",
            product: newProduct
        });

    } catch (error: any) {
        // Handle Mongoose Validation Errors (e.g., negative price)
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Server error", error });
    }
};