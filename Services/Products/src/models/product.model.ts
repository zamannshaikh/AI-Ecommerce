import mongoose, { Schema, Document } from "mongoose";

// 1. The Interface (TypeScript Rules)
export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  seller: string; // We will store the User ID of the seller/admin
  createdAt: Date;
  updatedAt: Date;
}

// 2. The Schema (Database Rules)
const productSchema = new Schema<IProduct>(
  {
    name: { 
      type: String, 
      required: [true, "Product name is required"],
      trim: true 
    },
    description: { 
      type: String, 
      required: [true, "Product description is required"] 
    },
    price: { 
      type: Number, 
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"] 
    },
    category: { 
      type: String, 
      required: true,
      lowercase: true,
      index: true // Makes searching by category faster
    },
    stock: { 
      type: Number, 
      required: true, 
      default: 0,
      min: [0, "Stock cannot be negative"]
    },
    images: {
      type: [String], // Array of URL strings
      default: []
    },
    seller: {
      type: String, // We use String here to keep services independent (Microservices pattern)
      required: true
    }
  },
  { 
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

// 3. The Model
export const productModel = mongoose.model<IProduct>("Product", productSchema);