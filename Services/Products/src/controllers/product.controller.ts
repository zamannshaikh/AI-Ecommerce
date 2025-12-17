import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { productModel } from "../models/product.model.js";
import { uploadImage } from "../utils/imagekit.js";
import mongoose from "mongoose";

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Validate User
        // The middleware guarantees req.user exists, but we check 'id' safely
        const userId = (req.user as any)?.id; 
        
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID missing" });
        }

        const { name, description, price, category, stock } = req.body;
        const imageFiles = req.files as Express.Multer.File[]; // Cast to correct type
        let imageUrls: string[] = [];
        if (imageFiles && imageFiles.length > 0) {
            // Upload all images in parallel to save time
            const uploadPromises = imageFiles.map(file => uploadImage(file));
            imageUrls = await Promise.all(uploadPromises);
        }

        // 2. Create Product
        const newProduct = await productModel.create({
            name,
            description,
            price,
            category,
            stock,
            images: imageUrls,
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




export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const { q, minprice, maxprice,  limit = 10,page=1, category } = req.query;

        const filter: any = {};

        // 1. Text Search
        if (q) {
            filter.$text = { $search: q as string };
        }

        // 2. Category Filter
        if (category) {
            filter.category = category;
        }

        // 3. Price Filter (Fix: Use 'price', not 'price.amount')
        if (minprice || maxprice) {
            filter.price = {};
            if (minprice) filter.price.$gte = Number(minprice);
            if (maxprice) filter.price.$lte = Number(maxprice);
        }
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;
        // 4. Build Query with Sorting
        // If searching, sort by Relevance. Otherwise, sort by Newest.
        let query = productModel.find(filter)
            .skip(Number(skip))
            .limit(Math.min(Number(limit), 50)); // Cap limit at 50 for safety

        if (q) {
            query = query.sort({ score: { $meta: "textScore" } });
        } else {
            query = query.sort({ createdAt: -1 });
        }

        // 5. Execute Query & Count Total (Parallel for speed)
        const [products, total] = await Promise.all([
            query,
            productModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: "Success",
            data: products,
            pagination: {
                total,
                skip: Number(skip),
                limit: Number(limit)
            }
        });

    } catch (error: any) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}