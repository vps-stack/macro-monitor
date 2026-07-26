"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConsumption = exports.deleteConsumptionItem = exports.getConsumption = exports.createConsumption = void 0;
const consumption_1 = require("../models/consumption");
const createConsumption = async (req, res) => {
    const authReq = req;
    try {
        const itemsWithUserId = authReq.body.map((item) => ({
            ...item,
            userId: authReq.userId,
        }));
        const consumption = await consumption_1.Consumption.insertMany(itemsWithUserId);
        res.status(201).json({ msg: "Consumption created", data: consumption });
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.createConsumption = createConsumption;
const getConsumption = async (req, res) => {
    const authReq = req;
    try {
        const data = await consumption_1.Consumption.find({ userId: authReq.userId });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.getConsumption = getConsumption;
const deleteConsumptionItem = async (req, res) => {
    const authReq = req;
    try {
        await consumption_1.Consumption.findOneAndDelete({
            _id: authReq.params.id,
            userId: authReq.userId,
        });
        res.status(204).end();
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.deleteConsumptionItem = deleteConsumptionItem;
const deleteConsumption = async (req, res) => {
    const authReq = req;
    try {
        await consumption_1.Consumption.deleteMany({ userId: authReq.userId });
        res.status(204).end();
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.deleteConsumption = deleteConsumption;
