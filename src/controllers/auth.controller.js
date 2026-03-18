// @ts-check
import AuthService from "../services/auth.service.js";
import asyncHandler from "express-async-handler";
import { NODE_ENV } from "../config/env.js";
import express from "express";
import mongoose from "mongoose";
import AppError from "../middlewares/error.middleware.js";
import authService from "../services/auth.service.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";

/** @typedef {{id: mongoose.Types.ObjectId, username: string, email: string, role: string }} AuthUser */

class AuthController {
  signIn = asyncHandler(async (request, response) => {
    const { token, user } = await AuthService.signIn(request.body);

    if (NODE_ENV === "development") {
      response.status(200).json({
        success: true,
        message: "Login Successfully!",
        data: { token, user },
      });
      return;
    }

    /** @type {import("express").CookieOptions} */
    const options = {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    };

    response.cookie("token", token, options);
    response.status(200).json({
      success: true,
      message: "Login Successfully!",
      data: { user },
    });
  });

  signUp = asyncHandler(async (request, response) => {
    const user = await AuthService.signUp(request.body);

    response.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  });

  getProfile = asyncHandler(async (request, response) => {
    const { user } = /** @type {express.Request & { user: AuthUser }} */ (request);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await AuditLogRepository.create({
      userId: user.id,
      action: "View Profile",
    });

    response.status(200).json({
      success: true,
      data: { user },
    });
  });

  resetPassword = asyncHandler(async (request, response) => {
    await authService.resetPassword(request.body);

    response.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  });

  logOut = asyncHandler(async (request, response) => {
    // @ts-ignore
    const { user } = /** @type {Request & {user: AuthUser}} */ (request);
    await AuditLogRepository.create({
      userId: user.id,
      action: "Logout",
    });

    response.clearCookie("token");

    response.status(200).json({
      success: true,
      message: "Logout successfully",
    });
  });
}

export default new AuthController();
