// @ts-check
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import OtpController from "../controllers/otp.controller.js";
import { Router } from "express";

const otpRouter = Router();

otpRouter.post("/send", createRateLimiter({ limit: 5, windowMs: 5 * 60000 }), OtpController.sendOtp);
otpRouter.post("/resend", OtpController.resendOtp);
otpRouter.post("/verify", createRateLimiter({ limit: 3, windowMs: 60000 }), OtpController.verifyOtp);
otpRouter.delete("/cleanup", authenticate, authorize("admin"), createRateLimiter({ limit: 5, windowMs: 60000 }), OtpController.cleanupExpiredOtps);
otpRouter.get("/stats", authenticate, authorize("admin"), createRateLimiter({ limit: 100, windowMs: 60000 }), OtpController.getStats);

export default otpRouter;
