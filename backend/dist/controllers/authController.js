"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.deleteAccount = exports.updatePassword = exports.updateEmail = exports.getProfile = exports.login = exports.register = void 0;
const user_1 = require("../models/user");
const auth_1 = require("../middleware/auth");
const bcrypt_1 = __importDefault(require("bcrypt"));
const options_1 = require("../models/options");
const nutrients_1 = require("../models/nutrients");
const consumption_1 = require("../models/consumption");
const archive_1 = require("../models/archive");
const cloudinary_1 = require("../cloudinary/cloudinary");
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ msg: "Email and password are required!" });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters!" });
        }
        // Create new user
        const user = new user_1.User({ email, password, name });
        await user.save();
        // Generate token
        const token = (0, auth_1.generateToken)({ userId: user._id.toString() });
        res.status(201)
            .cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
            .json({
            msg: "User registered successfully!",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ msg: "Registration failed!" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ msg: "Email and password are required!" });
        }
        // Find user
        const user = await user_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({ msg: "Invalid credentials!" });
        }
        // Compare password
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: "Invalid credentials!" });
        }
        // Generate token
        const token = (0, auth_1.generateToken)({ userId: user._id.toString() });
        res.status(200)
            .cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
            .json({
            msg: "Login successful!",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ msg: "Login failed!" });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await user_1.User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found!" });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ msg: "Failed to fetch profile!" });
    }
};
exports.getProfile = getProfile;
const updateEmail = async (req, res) => {
    try {
        const userId = req.userId;
        const { email, currentPassword } = req.body;
        if (!email || !currentPassword) {
            return res.status(400).json({ msg: "Email and current password are required!" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({ msg: "Please enter a valid email address!" });
        }
        const user = await user_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found!" });
        }
        const passwordMatches = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!passwordMatches) {
            return res.status(403).json({ msg: "Current password is incorrect!" });
        }
        const emailIsTaken = await user_1.User.exists({
            email: normalizedEmail,
            _id: { $ne: userId },
        });
        if (emailIsTaken) {
            return res.status(409).json({ msg: "This email address is already in use!" });
        }
        user.email = normalizedEmail;
        await user.save();
        return res.status(200).json({
            msg: "Email updated successfully!",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    }
    catch (error) {
        console.error("Update email error:", error);
        return res.status(500).json({ msg: "Failed to update email!" });
    }
};
exports.updateEmail = updateEmail;
const updatePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: "Current and new password are required!" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters!" });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ msg: "The new password must be different!" });
        }
        const user = await user_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found!" });
        }
        const passwordMatches = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!passwordMatches) {
            return res.status(403).json({ msg: "Current password is incorrect!" });
        }
        user.password = newPassword;
        await user.save();
        return res.status(200).json({ msg: "Password updated successfully!" });
    }
    catch (error) {
        console.error("Update password error:", error);
        return res.status(500).json({ msg: "Failed to update password!" });
    }
};
exports.updatePassword = updatePassword;
const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ msg: "Password is required!" });
        }
        const user = await user_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: "User not found!" });
        }
        const passwordMatches = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(403).json({ msg: "Password is incorrect!" });
        }
        const foods = await nutrients_1.Food.find({ userId }).select("image").lean();
        const imageIds = foods
            .map((food) => food.image)
            .filter((image) => Boolean(image));
        await Promise.allSettled(imageIds.map((imageId) => cloudinary_1.cloudinary.uploader.destroy(imageId)));
        await Promise.all([
            options_1.Options.deleteMany({ userId }),
            nutrients_1.Food.deleteMany({ userId }),
            consumption_1.Consumption.deleteMany({ userId }),
            archive_1.Archive.deleteMany({ userId }),
        ]);
        await user_1.User.findByIdAndDelete(userId);
        res.clearCookie("jwt");
        return res.status(200).json({ msg: "Account deleted successfully!" });
    }
    catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({ msg: "Failed to delete account!" });
    }
};
exports.deleteAccount = deleteAccount;
const logout = async (req, res) => {
    try {
        res.clearCookie("jwt");
        res.status(200).json({ msg: "Logout successful!" });
    }
    catch (error) {
        res.status(500).json({ msg: "Logout failed!" });
    }
};
exports.logout = logout;
