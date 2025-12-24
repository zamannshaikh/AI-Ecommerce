import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true
     },
     
});