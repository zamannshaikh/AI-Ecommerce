import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cookierParser from 'cookie-parser';
import { connect } from 'node:http2';



const app: Application = express(); // 2. Add Type Annotation ': Application'

//middlewares
app.use(express.json());
app.use(cookierParser());




//routes imports 
import authRoutes from "./routes/auth.routes.js";





app.use('/api/auth',authRoutes);


export default app; // 3. Use 'export default'