// @ts-check
import { NODE_ENV } from "../config/env.js";

/** @typedef {Error & ErrorWithCode & MongooseValidationErrors & Partial<AppError>} ExtendedError */
/** @typedef {{ code?: number | undefined }} ErrorWithCode */
/** @typedef {{ errors?: Record<string, { message: string;}> | undefined }} MongooseValidationErrors */

class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * @param {ExtendedError} err
 * @param {import("express").Request} _request
 * @param {import("express").Response} response
 * @param {import("express").NextFunction} next
 */
const errorMiddleware = (err, _request, response, next) => {
  if (response.headersSent) {
    next(err);
  }

  try {
    let error = err instanceof AppError ? err : new AppError(err.message || "Server Error", err.statusCode || 500);

    error.statusCode = error.statusCode || err.statusCode || 500;
    error.status = error.status || err.status || "error";

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
      const message = "Resource not found";
      error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if ("code" in err && err.code === 11000) {
      const message = "Duplicate field value entered";
      error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === "ValidationError" && "errors" in err) {
      const message = Object.values(err.errors ?? {})
        .map((val) => val.message)
        .join(", ");
      error = new AppError(message, 400);
    }

    // JWT Errors
    if (err.name === "JsonWebTokenError") {
      const message = "Invalid token. Please log in again.";
      error = new AppError(message, 401);
    }

    if (err.name === "TokenExpiredError") {
      const message = "Your token has expired. Please log in again.";
      error = new AppError(message, 401);
    }

    if (NODE_ENV === "development") {
      console.error(err);

      response.status(error.statusCode).json({
        success: false,
        status: error.status,
        error: err,
        message: error.message,
        stack: err.stack,
      });
      return;
    } else {
      // PRODUCTION MODE
      if (error.isOperational || err.isOperational) {
        response.status(error.statusCode).json({
          success: false,
          status: error.status,
          message: error.message,
        });
        return;
      } else {
        console.error(err);
        response.status(500).json({
          success: false,
          status: "error",
          message: "Something went wrong!",
        });
        return;
      }
    }
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      response.status(500).json({
        success: false,
        status: "error",
        message: "Internal server error",
      });
      return;
    }

    next(error);
    return;
  }
};

export default AppError;
export { errorMiddleware };
