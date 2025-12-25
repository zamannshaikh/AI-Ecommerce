import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import orderRoutes from './routes/order.route.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/orders', orderRoutes);




export default app;