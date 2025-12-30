import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import paymentRoutes from './routes/payment.routes';


const app = express();
app.use(express.json());
app.use(cookieParser());

app.use('/api/payments', paymentRoutes);


export default app;

