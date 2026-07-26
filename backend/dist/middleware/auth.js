"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../models/user");
const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn: expiresIn,
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
};
const authenticate = async (req, res, next) => {
    const authReq = req;
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ msg: "Authentication failed!" });
        }
        const decoded = verifyToken(token);
        const user = await user_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found!" });
        }
        authReq.userId = decoded.userId;
        authReq.user = user;
        next();
    }
    catch (error) {
        return res.status(403).json({ msg: "Authentication error!" });
    }
};
exports.authenticate = authenticate;
