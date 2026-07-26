import { Request, Response } from "express";
import { User } from "../models/user";
import { AuthRequest, generateToken } from "../middleware/auth";
import bcrypt from "bcrypt";
import { Options } from "../models/options";
import { Food } from "../models/nutrients";
import { Consumption } from "../models/consumption";
import { Archive } from "../models/archive";
import { cloudinary } from "../cloudinary/cloudinary";

export const register = async (req: Request, res: Response) => {
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
      const user = new User({ email, password, name });
      await user.save();

      // Generate token
      const token = generateToken({ userId: user._id.toString() });

      res.status(201)
         .cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
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
   } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ msg: "Registration failed!" });
   }
};

export const login = async (req: Request, res: Response) => {
   try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
         return res.status(400).json({ msg: "Email and password are required!" });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
         return res.status(401).json({ msg: "Invalid credentials!" });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(401).json({ msg: "Invalid credentials!" });
      }

      // Generate token
      const token = generateToken({ userId: user._id.toString() });

      res.status(200)
         .cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // HTTPS only in production
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
   } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ msg: "Login failed!" });
   }
};

export const getProfile = async (req: Request, res: Response) => {
   try {
      const userId = (req as AuthRequest).userId;
      const user = await User.findById(userId).select("-password");

      if (!user) {
         return res.status(404).json({ msg: "User not found!" });
      }

      res.status(200).json({ user });
   } catch (error) {
      res.status(500).json({ msg: "Failed to fetch profile!" });
   }
};

export const updateEmail = async (req: Request, res: Response) => {
   try {
      const userId = (req as AuthRequest).userId;
      const { email, currentPassword } = req.body;

      if (!email || !currentPassword) {
         return res.status(400).json({ msg: "Email and current password are required!" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(normalizedEmail)) {
         return res.status(400).json({ msg: "Please enter a valid email address!" });
      }

      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ msg: "User not found!" });
      }

      const passwordMatches = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatches) {
         return res.status(403).json({ msg: "Current password is incorrect!" });
      }

      const emailIsTaken = await User.exists({
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
   } catch (error) {
      console.error("Update email error:", error);
      return res.status(500).json({ msg: "Failed to update email!" });
   }
};

export const updatePassword = async (req: Request, res: Response) => {
   try {
      const userId = (req as AuthRequest).userId;
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

      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ msg: "User not found!" });
      }

      const passwordMatches = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatches) {
         return res.status(403).json({ msg: "Current password is incorrect!" });
      }

      user.password = newPassword;
      await user.save();

      return res.status(200).json({ msg: "Password updated successfully!" });
   } catch (error) {
      console.error("Update password error:", error);
      return res.status(500).json({ msg: "Failed to update password!" });
   }
};

export const deleteAccount = async (req: Request, res: Response) => {
   try {
      const userId = (req as AuthRequest).userId;
      const { password } = req.body;

      if (!password) {
         return res.status(400).json({ msg: "Password is required!" });
      }

      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ msg: "User not found!" });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
         return res.status(403).json({ msg: "Password is incorrect!" });
      }

      const foods = await Food.find({ userId }).select("image").lean();
      const imageIds = foods
         .map((food) => food.image)
         .filter((image): image is string => Boolean(image));

      await Promise.allSettled(imageIds.map((imageId) => cloudinary.uploader.destroy(imageId)));

      await Promise.all([
         Options.deleteMany({ userId }),
         Food.deleteMany({ userId }),
         Consumption.deleteMany({ userId }),
         Archive.deleteMany({ userId }),
      ]);
      await User.findByIdAndDelete(userId);

      res.clearCookie("jwt");
      return res.status(200).json({ msg: "Account deleted successfully!" });
   } catch (error) {
      console.error("Delete account error:", error);
      return res.status(500).json({ msg: "Failed to delete account!" });
   }
};

export const logout = async (req: Request, res: Response) => {
   try {
      res.clearCookie("jwt");
      res.status(200).json({ msg: "Logout successful!" });
   } catch (error) {
      res.status(500).json({ msg: "Logout failed!" });
   }
};
