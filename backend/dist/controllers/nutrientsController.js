"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFoodItem = exports.uploadImage = exports.getAllFood = exports.createFood = void 0;
const nutrients_1 = require("../models/nutrients");
const cloudinary_1 = require("../cloudinary/cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createFood = async (req, res) => {
    const authReq = req;
    try {
        const food = new nutrients_1.Food({
            ...authReq.body,
            userId: authReq.userId,
        });
        await food.save();
        res.status(201).json({ msg: "Food created", data: food });
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.createFood = createFood;
const getAllFood = async (req, res) => {
    const authReq = req;
    try {
        const data = await nutrients_1.Food.find({ userId: authReq.userId }).sort({ name: "ascending" });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.getAllFood = getAllFood;
const uploadImage = async (req, res) => {
    const authReq = req;
    const UPLOAD_PRESET = process.env.UPLOAD_PRESET;
    try {
        const name = Date.now();
        const uploadedImage = await cloudinary_1.cloudinary.uploader.upload(authReq.body.image, {
            upload_preset: UPLOAD_PRESET,
            public_id: `${name}`,
            allowed_formats: ["jpg", "png", "jpeg", "gif", "svg"],
        }, function (error, result) {
            if (error)
                console.log(error);
        });
        if (uploadedImage) {
            const cloudImg = uploadedImage.secure_url;
            const cloudImgPub = uploadedImage.public_id;
            const response = await nutrients_1.Food.findOneAndUpdate({ _id: authReq.params.id, userId: authReq.userId }, { image: cloudImgPub }, { new: true });
            if (authReq.body.previousImage) {
                await cloudinary_1.cloudinary.uploader.destroy(authReq.body.previousImage, (error, result) => {
                    if (error) {
                        console.error("Error deleting image:", error);
                    }
                    else {
                        console.log("Image deleted successfully:", result);
                    }
                });
            }
            res.status(200).send(response);
            return;
        }
        res.status(400).json({ msg: "Image upload failed!" });
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.uploadImage = uploadImage;
const deleteFoodItem = async (req, res) => {
    const authReq = req;
    try {
        await nutrients_1.Food.findOneAndDelete({
            name: authReq.body.name,
            userId: authReq.userId,
        });
        res.status(204).end();
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.deleteFoodItem = deleteFoodItem;
