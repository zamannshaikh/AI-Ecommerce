import ImageKit from "imagekit";
import { v4 as uuidv4 } from 'uuid';

// 1. Initialize with Type Assertion to fix "undefined" errors
export const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
});

// 2. Helper function to upload file
export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
    try {
        // Convert Buffer to Base64
        const fileBase64 = file.buffer.toString("base64");
        
        const result = await imagekit.upload({
            file: fileBase64, // required
            fileName: `${uuidv4()}_${file.originalname}`, // unique file name
            folder: "/products" // optional: organize your images
        });

        return result.url;
    } catch (error) {
        console.error("ImageKit Upload Error:", error);
        throw new Error("Image upload failed");
    }
};