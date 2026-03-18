import AuthController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";

const authRouter = Router();

authRouter.post("/sign-in", createRateLimiter({ limit: 10, windowMs: 60000 }), AuthController.signIn);
authRouter.get("/profile", authenticate, AuthController.getProfile);
authRouter.post("/sign-up", createRateLimiter({ limit: 10, windowMs: 60000 }), AuthController.signUp);
authRouter.post("/reset-password", createRateLimiter({ limit: 10, windowMs: 60000 }), AuthController.resetPassword);
authRouter.post("/logout", authenticate, createRateLimiter({ limit: 10, windowMs: 60000 }), AuthController.logOut);

export default authRouter;
