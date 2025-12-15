import mongoose, { Schema, Document } from "mongoose";

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
}

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
  },
  { timestamps: true }
);

export const userModel = mongoose.model<Iuser>("User", userSchema);
