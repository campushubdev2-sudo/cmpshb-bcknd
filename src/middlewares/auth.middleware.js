// @ts-check
import AppError from "./error.middleware.js";
import AuthService from "../services/auth.service.js";
import express from "express";
import mongoose from "mongoose";

/** @typedef {{ id: string | mongoose.Types.ObjectId, username: string, email: string, role: string }} AuthUser */
/** @typedef {{ userId: string, username: string, email: string, role: string }} JwtPayload */

/**
 * @param {express.Request & { user?: AuthUser }} request
 * @param {express.Response} _response
 * @param {express.NextFunction} next
 */
const authenticate = async (request, _response, next) => {
  try {
    let token = request.cookies?.token || null;

    if (!token && request.headers.authorization) {
      if (request.headers.authorization.startsWith("Bearer ")) {
        token = request.headers.authorization.split(" ")[1];
      }
    }

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = AuthService.verifyToken(token);
    const { userId, username, email, role } = /** @type {JwtPayload} */ (payload);

    /** @type {AuthUser} */
    request.user = {
      id: userId,
      username,
      email,
      role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * @param {express.Request & { user?: AuthUser }} request
 * @param {express.Response} _response
 * @param {express.NextFunction} next
 */
const optionalAuthenticate = async (request, _response, next) => {
  try {
    let token = request.cookies?.token || null;

    if (!token && request.headers.authorization) {
      if (request.headers.authorization.startsWith("Bearer ")) {
        token = request.headers.authorization.split(" ")[1];
      }
    }

    if (!token) {
      next();
      return;
    }

    const payload = AuthService.verifyToken(token);
    const { userId, username, email, role } = /** @type {JwtPayload} */ (payload);

    /** @type {AuthUser} */
    request.user = {
      id: userId,
      username,
      email,
      role,
    };

    next();
    return;
  } catch {
    next();
    return;
  }
};

/**
 * @param {...string} allowedRoles
 * @returns {(request: express.Request & { user?: AuthUser }, res: express.Response, next: express.NextFunction) => void}
 */
const authorize =
  (...allowedRoles) =>
  (request, _response, next) => {
    const userRole = request.user?.role || "guest";

    if (!allowedRoles.includes(userRole)) {
      return next(new AppError(`Forbidden: role "${userRole}" is not allowed`, 403));
    }

    return next();
  };

export { authenticate, authorize, optionalAuthenticate };
