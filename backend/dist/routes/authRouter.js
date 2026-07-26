"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const rate_limiter_1 = require("../middleware/rate-limiter");
const authRouter = (0, express_1.Router)();
authRouter
    .post("/register", rate_limiter_1.authLimiter, authController_1.register)
    .post("/login", rate_limiter_1.authLimiter, authController_1.login)
    .get("/profile", auth_1.authenticate, authController_1.getProfile)
    .patch("/profile/email", rate_limiter_1.authLimiter, auth_1.authenticate, authController_1.updateEmail)
    .patch("/profile/password", rate_limiter_1.authLimiter, auth_1.authenticate, authController_1.updatePassword)
    .delete("/profile", rate_limiter_1.authLimiter, auth_1.authenticate, authController_1.deleteAccount)
    .post("/logout", authController_1.logout);
exports.default = authRouter;
