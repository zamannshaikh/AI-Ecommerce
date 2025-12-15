import { userModel } from "../models/user.model.js";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from 'jsonwebtoken';
import redis from "../db/redis.js";

export interface AuthRequest extends Request {
  user?: string | JwtPayload; 
}

async function registerUser(req: Request, res: Response) {
    const { username, email, password, fullname:{firstName,lastName}, role } = req.body;

    try {
        // Check if user already exists
        const existingUser = await userModel.findOne({ 
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new userModel({
            username,
            email,
            password: hashedPassword,
            fullname: { firstName, lastName },
            role,
        });

        const token =jwt.sign({
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }, process.env.JWT_SECRET as string , {expiresIn:'1d'   
        })

        res.cookie("token",token,{
            httpOnly:true,
            secure:true,
            maxAge:24*60*60*1000 //1 day
        })

        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }    
}

async function loginUser(req: Request, res: Response) {
    const { email, username, password } = req.body;
    try {
        const user = await userModel.findOne({
            $or: [{ email }, { username }]
        }).select('+password');
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token =jwt.sign({
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }, process.env.JWT_SECRET as string , {expiresIn:'1d'   
        })

        res.cookie("token",token,{
            httpOnly:true,
            secure:true,
            maxAge:24*60*60*1000 //1 day
        })

        res.status(200).json({ message: "Login successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
    
}

async function getCurrentUser(req:AuthRequest,res:Response) {
    return res.status(200).json({
        message:"Current user fetched successfully",
        user:req.user});
    
}

async function logoutUser(req:Request,res:Response) {

    const token = req.cookies.token;

    if(token){
        redis.set(`Blacklist:${token}`, 'true', 'EX', 24*60*60); // Set expiry to 1 day
    }

    res.clearCookie("token");
    return res.status(200).json({message:"Logged out successfully"});
}

export { registerUser ,loginUser ,getCurrentUser,logoutUser};