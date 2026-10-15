import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDatabase = async (): Promise<void> => {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
        throw new Error("MONGO_URL is not configured.");
    }

    try {
        await mongoose.connect(mongoUrl, { dbName: process.env.DATABASE });
    } catch {
        // Driver errors may contain credentials or the connection string.
        throw new Error("Initial MongoDB connection failed.");
    }

    console.log("Connected to mongoDB!");
};
