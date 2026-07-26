"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Archive = void 0;
const mongoose_1 = require("mongoose");
const archiveSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    grams: { type: Number, required: true, min: 0 },
    calories: { type: Number, required: true, min: 0 },
    carbohydrates: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    saturatedFat: { type: Number, required: true, min: 0 },
    sugar: { type: Number, required: true, min: 0 },
    salt: { type: Number, required: true, min: 0 }
}, { timestamps: true });
// Ensure one archive per user per day
archiveSchema.index({ userId: 1, date: 1 }, { unique: true });
exports.Archive = (0, mongoose_1.model)("Archive", archiveSchema);
