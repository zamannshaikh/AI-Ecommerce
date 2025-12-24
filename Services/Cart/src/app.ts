import 'dotenv/config';
import express from "express";
import cartRoutes from "./routes/cart.routes.js";
import cookieParser from 'cookie-parser';


const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/cart", cartRoutes);


export default app;