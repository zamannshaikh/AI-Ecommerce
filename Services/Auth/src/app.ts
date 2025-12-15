import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cookierParser from 'cookie-parser';




const app: Application = express(); // 2. Add Type Annotation ': Application'

//middlewares
app.use(express.json());
app.use(cookierParser());




//routes imports 
import authRoutes from "./routes/auth.routes.js";
import addressRoutes from './routes/adress.routes.js';





app.use('/api/auth',authRoutes);
app.use('/api/address', addressRoutes);


export default app; // 3. Use 'export default'