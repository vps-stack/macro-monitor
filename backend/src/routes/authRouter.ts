import { Router } from "express";
import { register, login, getProfile, logout } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limiter";

const authRouter = Router();

authRouter
   .post("/register", authLimiter, register)
   .post("/login", authLimiter, login)
   .get("/profile", authenticate, getProfile)
   .post("/logout", logout)

export default authRouter;
