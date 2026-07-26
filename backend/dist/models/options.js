"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Options = void 0;
const mongoose_1 = require("mongoose");
const optionsSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    calories: { type: Number, default: 2000 },
    carbohydrates: { type: Number, default: 0.55 },
    fat: { type: Number, default: 0.3 },
    protein: { type: Number, default: 0.15 },
    saturatedFat: { type: Number, default: 0.1 },
    sugar: { type: Number, default: 0.1 },
    salt: { type: Number, default: 6 }
});
optionsSchema.pre('save', function (next) {
    if (this.calories) {
        this.carbohydrates = Math.round((+this.calories * +this.carbohydrates) / 4); // 1 gram of carbs = 4 calories
        this.fat = Math.round((+this.calories * +this.fat) / 9); // 1 gram of fat = 9 calories
        this.protein = Math.round((+this.calories * +this.protein) / 4); // 1 gram of protein = 4 calories
        this.saturatedFat = Math.round((+this.calories * +this.saturatedFat) / 9); // belongs to fat
        this.sugar = Math.round((+this.calories * +this.sugar) / 4); // belongs to carbs
    }
    next();
});
exports.Options = (0, mongoose_1.model)("Options", optionsSchema);
