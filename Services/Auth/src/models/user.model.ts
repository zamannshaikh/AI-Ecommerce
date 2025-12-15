import mongoose, { Schema, Document } from "mongoose";



export interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: number;
  country: string;
  _id?: string; // Mongoose adds this automatically
}

export interface Iuser extends Document {
  username: string;
  email: string;
  password: string;
  fullname: {
    first: string;
    last: string;
  };
  role: "user" | "seller";
  createdAt: Date;
  updatedAt: Date;
  addresses: IAddress[];
}


const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: Number, required: true },
  country: { type: String, required: true },
});

const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: { type: String, required: true, unique: true },

    password: { type: String, select:false },

    fullname: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    role: { type: String, enum: ["user", "seller"], default: "user" },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

export const userModel = mongoose.model<Iuser>("User", userSchema);
