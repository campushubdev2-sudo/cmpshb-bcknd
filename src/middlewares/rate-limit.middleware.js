// @ts-check
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { rateLimiterSchema } from "../validators/rate-limit.validator.js";
import AppError from "../middlewares/error.middleware.js";
import express from "express";
import mongoose from "mongoose";

/** @typedef {{ limit: number, windowMs: number, keyGenerator?: (request: express.Request) => string}} RateLimitOptions */

/** @param {express.Request & { user?: { id: string |  mongoose.Types.ObjectId } }} request */
const defaultKeyGenerator = (request) => request.user?.id || ipKeyGenerator(request.ip || "");

/**
 * @param {express.Request} _request
 * @param {express.Response} response
 */
const defaultHandler = (_request, response) => {
  response.status(429).json({
    success: false,
    status: "fail",
    message: "Too many requests. Please try again later.",
  });
};

/** @param {RateLimitOptions} options */
const createRateLimiter = (options) => {
  const optionsWithDefaults = {
    keyGenerator: defaultKeyGenerator,
    ...options,
  };

  const { error, value } = rateLimiterSchema.validate(optionsWithDefaults);

  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    throw new AppError(message, 400);
  }

  const { limit, windowMs, keyGenerator } = value;

  return rateLimit({
    windowMs,
    max: limit,
    keyGenerator,
    handler: defaultHandler,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
};

export { createRateLimiter };
