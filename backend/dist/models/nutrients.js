"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Food = void 0;
const mongoose_1 = require("mongoose");
const foodSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    carbohydrates: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    saturatedFat: { type: Number, required: true, min: 0 },
    sugar: { type: Number, required: true, min: 0 },
    salt: { type: Number, required: true, min: 0 },
    image: { type: String }
}, { timestamps: true });
foodSchema.index({ userId: 1, name: 1 }, { unique: true }); // makes name unique per user, not globally
exports.Food = (0, mongoose_1.model)("Food", foodSchema);
