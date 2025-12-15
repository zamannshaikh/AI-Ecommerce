import {body,validationResult} from 'express-validator';
import { Request, Response, NextFunction } from 'express';


const respondWithValidationErrors = (req:Request,res:Response,next:NextFunction) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }    next();
}


const registerUserValidator = [

    body('username')
    .isString().withMessage('Username must be a string')
    .isLength({min:3,max:30}).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
    .isEmail().withMessage('Invalid email format'),
    



    body('password')
    .isLength({min:6}).withMessage('Password must be at least 6 characters long')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character (@, $, !, %, *, ?, &)')
    ,


    body('fullname.firstName')
    .isString().withMessage('First name must be a string')
    .isLength({min:1,max:50}).withMessage('First name must be between 1 and 50 characters'),
    

    body('fullname.lastName')
    .isString().withMessage('Last name must be a string')
    .isLength({min:1,max:50}).withMessage('Last name must be between 1 and 50 characters'),

    respondWithValidationErrors
];



const validateLogin = [
    body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),

    body('username')
    .optional()
    .isString().withMessage('Username must be a string'),

    body('password')
    
    .notEmpty().withMessage('Password is required'),

    (req:Request,res:Response,next:NextFunction) => {
        if(!req.body.email && !req.body.username){
            return  res.status(400).json({errors:[{msg:'Either email or username is required'}]});
        }
        
    respondWithValidationErrors(req,res,next);
    }

];


export {registerUserValidator, validateLogin};