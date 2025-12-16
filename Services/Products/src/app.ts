import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cookierParser from 'cookie-parser';

const app: Application = express();

//middlewares
app.use(express.json());
app.use(cookierParser());

//routes imports
import productRoutes from './routes/product.routes.js';

app.use('/api/products', productRoutes);





export default app; 