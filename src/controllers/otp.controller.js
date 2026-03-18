// @ts-check
import asyncHandler from "express-async-handler";
import OtpService from "../services/otp.service.js";
import express from "express";

/** @typedef {express.Request & { user: { id: string }}} AuthenticatedRequest */

class OtpController {
  sendOtp = asyncHandler(async (request, response) => {
    const { email, expiresAt } = await OtpService.sendOtp(request.body);

    response.status(200).json({
      success: true,
      message: "OTP has been sent to your email address",
      email,
      expiresAt,
    });
  });

  resendOtp = asyncHandler(async (request, response) => {
    const { email, expiresAt } = await OtpService.resendOtp(request.body);

    response.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email address",
      email,
      expiresAt,
    });
  });

  verifyOtp = asyncHandler(async (request, response) => {
    const { email, verified } = await OtpService.verifyOtp(request.body);

    response.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: { email, verified },
    });
  });

  cleanupExpiredOtps = asyncHandler(async (_request, response) => {
    const result = await OtpService.cleanupExpiredOtps();
    response.status(200).json({ success: true, ...result });
  });

  getStats = asyncHandler(async (request, response) => {
    const stats = await OtpService.getOtpStatistics(/** @type {AuthenticatedRequest} */ (request).user.id);

    response.status(200).json({
      success: true,
      message: "OTP statistics retrieved successfully",
      data: stats,
    });
  });
}

export default new OtpController();
