import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js"; // Import your custom type
import { userModel } from "../models/user.model.js";

// 1. ADD ADDRESS
export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { street, city, state, zip, country } = req.body;
    
    // We assume req.user is populated by your authMiddleware
    // We verify req.user is an object and has an id
    const userId = typeof req.user === 'object' ? req.user?.id : null;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Use $push to add to the array
    const user = await userModel.findByIdAndUpdate(
      userId,
      { 
        $push: { 
          addresses: { street, city, state, zip, country } 
        } 
      },
      { new: true } // Return the updated user object
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Return the newly added address (it will be the last one)
    const newAddress = user.addresses[user.addresses.length - 1];
    
    res.status(201).json({ message: "Address added", address: newAddress });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 2. DELETE ADDRESS
export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Address ID to delete
    const userId = typeof req.user === 'object' ? req.user?.id : null;

    // Use $pull to remove item matching the _id
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: id } } }, 
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 3. UPDATE ADDRESS
export const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Address ID to update
    const { street, city, state, zip, country } = req.body;
    const userId = typeof req.user === 'object' ? req.user?.id : null;

    // Use array filters to update a specific item in the array
    const user = await userModel.findOneAndUpdate(
      { _id: userId, "addresses._id": id },
      { 
        $set: { 
          "addresses.$.street": street,
          "addresses.$.city": city,
          "addresses.$.state": state,
          "addresses.$.zip": zip,
          "addresses.$.country": country
        } 
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "Address not found" });

    res.status(200).json({ message: "Address updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



// ... existing imports ...

// 4. GET ADDRESSES
export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = typeof req.user === 'object' ? req.user?.id : null;

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the list (it might be empty, which is fine)
    res.status(200).json({ addresses: user.addresses });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};