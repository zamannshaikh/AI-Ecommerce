import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';

import {  registerUser,loginUser,getCurrentUser,logoutUser } from '../controllers/auth.controller.js';
import {registerUserValidator, validateLogin} from '../middleware/validator.middleware.js';


const router = express.Router();



router.post('/register',registerUserValidator, registerUser);
router.post('/login',validateLogin, loginUser);
router.get('/current',authMiddleware, getCurrentUser);
router.post("/logout",logoutUser);






export default router;