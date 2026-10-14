import { Request, Response } from "express";
import { Food } from "../models/nutrients";
import { cloudinary } from "../cloudinary/cloudinary";
import dotenv from "dotenv";
import { AuthRequest } from "../middleware/auth"; // Reuse shared interface
import { isObjectIdOrHexString } from "mongoose";

dotenv.config();

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
    let uploadedImageId: string | undefined;

    try {
        if (!isObjectIdOrHexString(authReq.params.id)) {
            res.status(404).json({ msg: "Food not found!" });
            return;
        }

        const foodFilter = { _id: authReq.params.id, userId: authReq.userId };
        const food = await Food.findOne(foodFilter);
        if (!food) {
            res.status(404).json({ msg: "Food not found!" });
            return;
        }

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
            uploadedImageId = cloudImgPub;

            const response = await Food.findOneAndUpdate(
                foodFilter,
                { image: cloudImgPub },
                { new: true }
            );

            if (!response) {
                throw new Error("Food image update failed");
            }

            // The new image is now persisted and must not be cleaned up on later errors.
            uploadedImageId = undefined;
            if (food.image && food.image !== cloudImgPub) {
                await cloudinary.uploader.destroy(food.image);
            }
            res.status(200).send(response);
            return;
        }

        res.status(400).json({ msg: "Image upload failed!" });
    } catch (error) {
        if (uploadedImageId) {
            try {
                await cloudinary.uploader.destroy(uploadedImageId);
            } catch (cleanupError) {
                console.error("Error cleaning up uploaded image:", cleanupError);
            }
        }
        res.status(500).json({ msg: "Image update failed!" });
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
