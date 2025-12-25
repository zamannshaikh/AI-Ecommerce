import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateOrder = [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.productId').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    
    body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
    body('shippingAddress.address').notEmpty().withMessage('Address is required'),
    body('shippingAddress.city').notEmpty().withMessage('City is required'),
    body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
    body('shippingAddress.country').notEmpty().withMessage('Country is required'),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];