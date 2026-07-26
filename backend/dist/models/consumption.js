"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Consumption = void 0;
const mongoose_1 = require("mongoose");
const consumptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    grams: { type: Number, required: true },
    calories: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
    fat: { type: Number, required: true },
    protein: { type: Number, required: true },
    saturatedFat: { type: Number, required: true },
    sugar: { type: Number, required: true },
    salt: { type: Number, required: true }
});
exports.Consumption = (0, mongoose_1.model)("Consumption", consumptionSchema);
