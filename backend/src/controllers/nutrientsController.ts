import { Request, Response } from "express";
import { Food } from "../models/nutrients";
import { cloudinary } from "../cloudinary/cloudinary";
import dotenv from "dotenv";
import { AuthRequest } from "../middleware/auth"; // Reuse shared interface

dotenv.config();

type CloudinaryResult = {
    resultKey: string;
};

export const createFood = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;

    try {
        const food = new Food({
            ...authReq.body,
            userId: authReq.userId,
        });
        await food.save();
        res.status(201).json({ msg: "Food created", data: food });
    } catch (error) {
        res.status(500).send(error);
    }
};

export const getAllFood = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;

    try {
        const data = await Food.find({ userId: authReq.userId }).sort({ name: "ascending" });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).send(error);
    }
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;
    const UPLOAD_PRESET = process.env.UPLOAD_PRESET;

    try {
        const name = Date.now();

        const uploadedImage = await cloudinary.uploader.upload(
            authReq.body.image,
            {
                upload_preset: UPLOAD_PRESET,
                public_id: `${name}`,
                allowed_formats: ["jpg", "png", "jpeg", "gif", "svg"],
            }
        );

        if (uploadedImage) {
            const cloudImgPub = uploadedImage.public_id;

            const response = await Food.findOneAndUpdate(
                { _id: authReq.params.id, userId: authReq.userId },
                { image: cloudImgPub },
                { new: true }
            );

            if (authReq.body.previousImage) {
                await cloudinary.uploader.destroy(
                    authReq.body.previousImage,
                    (error: Error | undefined, result: CloudinaryResult | undefined) => {
                        if (error) {
                            console.error("Error deleting image:", error);
                        } else {
                            console.log("Image deleted successfully:", result);
                        }
                    }
                );
            }
            res.status(200).send(response);
            return 
        }

        res.status(400).json({ msg: "Image upload failed!" });
    } catch (error) {
        res.status(500).send(error);
    }
};

export const deleteFoodItem = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthRequest;

    try {
        await Food.findOneAndDelete({
            name: authReq.body.name,
            userId: authReq.userId,
        });
        res.status(204).end();
    } catch (error) {
        res.status(500).send(error);
    }
};
