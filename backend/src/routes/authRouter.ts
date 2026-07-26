import { Router } from "express";
import {
   register,
   login,
   getProfile,
   updateEmail,
   updatePassword,
   deleteAccount,
   logout,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limiter";

const authRouter = Router();

authRouter
   .post("/register", authLimiter, register)
   .post("/login", authLimiter, login)
   .get("/profile", authenticate, getProfile)
   .patch("/profile/email", authLimiter, authenticate, updateEmail)
   .patch("/profile/password", authLimiter, authenticate, updatePassword)
   .delete("/profile", authLimiter, authenticate, deleteAccount)
   .post("/logout", logout)

export default authRouter;
