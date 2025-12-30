import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// define custom interface so 'req.user' doesn't throw errors
export interface AuthRequest extends Request {
    user?: JwtPayload | string;
}

// Default role is "user", but you can pass ["seller", "admin"]
export const createAuthMiddleware = (roles: string[] = ["user"]) => {
    
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        
        // 1. Look for token in Cookies OR Headers
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        try {
            // 2. Verify Token
            if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

            

            // 4. Attach User to Request
            req.user = decoded;
            next();

        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    };
};