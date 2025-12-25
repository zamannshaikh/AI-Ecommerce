import { NextFunction ,Request,Response} from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';


export interface AuthRequest extends Request {
  user?: string | JwtPayload; 
}

async function authMiddleware(req:AuthRequest,res:Response,next:NextFunction) {
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({message:"No token provided"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) ;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({message:"Invalid token"});
    }
    
}
export {authMiddleware};