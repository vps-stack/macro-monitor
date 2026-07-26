"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOptions = exports.updateOptions = exports.createOptions = void 0;
const options_1 = require("../models/options");
const createOptions = async (req, res) => {
    const authReq = req;
    try {
        const count = await options_1.Options.countDocuments({ userId: authReq.userId });
        if (count === 0) {
            const options = new options_1.Options({
                ...authReq.body,
                userId: authReq.userId,
            });
            const response = await options.save();
            res.status(201).json({ msg: "Options created", data: response });
            return;
        }
        res.status(409).json({ msg: "Options already created!" });
        return;
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.createOptions = createOptions;
const updateOptions = async (req, res) => {
    const authReq = req;
    try {
        const { id, calories, salt } = authReq.body;
        const carbohydrates = Math.round((+calories * +authReq.body.carbohydrates) / 4);
        const fat = Math.round((+calories * +authReq.body.fat) / 9);
        const protein = Math.round((+calories * +authReq.body.protein) / 4);
        const saturatedFat = Math.round((+calories * +authReq.body.saturatedFat) / 9);
        const sugar = Math.round((+calories * +authReq.body.sugar) / 4);
        const response = await options_1.Options.findOneAndUpdate({ _id: id, userId: authReq.userId }, { calories: +calories, carbohydrates, fat, protein, saturatedFat, sugar, salt: +salt }, { new: true });
        res.status(200).json({ msg: "Options updated", data: response });
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.updateOptions = updateOptions;
const getAllOptions = async (req, res) => {
    const authReq = req;
    try {
        const data = await options_1.Options.find({ userId: authReq.userId });
        res.status(200).send(data);
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.getAllOptions = getAllOptions;
