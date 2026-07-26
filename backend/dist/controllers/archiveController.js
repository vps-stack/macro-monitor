"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArchive = exports.deleteArchiveItem = exports.getArchive = exports.createArchive = void 0;
const archive_1 = require("../models/archive");
const createArchive = async (req, res) => {
    const authReq = req;
    try {
        const archive = new archive_1.Archive({
            ...authReq.body,
            userId: authReq.userId,
        });
        await archive.save();
        res.status(201).json({ msg: "Archive item created", data: archive });
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.createArchive = createArchive;
const getArchive = async (req, res) => {
    const authReq = req;
    try {
        const data = await archive_1.Archive.find({ userId: authReq.userId });
        res.status(200).json(data);
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.getArchive = getArchive;
const deleteArchiveItem = async (req, res) => {
    const authReq = req;
    try {
        await archive_1.Archive.findOneAndDelete({
            _id: authReq.params.id,
            userId: authReq.userId,
        });
        res.status(204).end();
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.deleteArchiveItem = deleteArchiveItem;
const deleteArchive = async (req, res) => {
    const authReq = req;
    try {
        await archive_1.Archive.deleteMany({ userId: authReq.userId });
        res.status(204).end();
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.deleteArchive = deleteArchive;
