// @ts-check
import AppError from "../middlewares/error.middleware.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import bcrypt from "bcryptjs";
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER } from "../config/env.js";
import jwt from "jsonwebtoken";
import OtpRepository from "../repositories/otp.repositories.js";
import { resetPasswordSchema } from "../validators/otp.validator.js";
import { signInSchema, signupSchema } from "../validators/auth.validator.js";
import UserRepository from "../repositories/user.repositories.js";

/** @typedef {import("mongoose").Types.ObjectId} ObjectId */

class AuthService {
  /** @param {{ identifier: string, password: string }} payload */
  async signIn(payload) {
    const { error, value } = signInSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { identifier, password } = value;
    const user = await UserRepository.findByIdentifier(identifier);

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const { password: _password, ...safeUser } = user;

    await AuditLogRepository.create({
      userId: user._id,
      action: "Sign In",
    });

    const token = this.generateToken(safeUser);

    return { user: safeUser, token };
  }

  /** @param {{ username: string, email: string, role?: string, phoneNumber: string, password: string }} payload */
  async signUp(payload) {
    const { error, value } = signupSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { username, email, password, role, phoneNumber } = value;
    const userByUsername = await UserRepository.findByUsername(username);
    const userByEmail = await UserRepository.findByEmail(email);

    if (userByUsername) {
      throw new AppError("Username already exists", 409);
    }

    if (userByEmail) {
      throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await UserRepository.create({ username, email, password: hashedPassword, role, phoneNumber });

    await AuditLogRepository.create({
      userId: user._id,
      action: "Sign Up",
    });

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /** @param {{ email: string, otp: string, newPassword: string }} payload */
  async resetPassword(payload) {
    const { error, value } = resetPasswordSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { email, otp, newPassword } = value;
    const userByEmail = await UserRepository.findByEmail(email);

    if (!userByEmail) {
      throw new AppError("User not found", 404);
    }

    const otpRecord = await OtpRepository.findValidOtp({ email, otp });
    if (!otpRecord) {
      throw new AppError("Invalid OTP", 400);
    }

    const NOW = new Date();
    if (otpRecord.expiresAt < NOW) {
      throw new AppError("OTP has expired", 400);
    }

    const MAX_OTP_VERIFICATION_ATTEMPTS = 5;
    if (otpRecord.verificationAttempts >= MAX_OTP_VERIFICATION_ATTEMPTS) {
      throw new AppError("OTP verification limit exceeded", 429);
    }

    await OtpRepository.markOtpVerified(otpRecord._id);
    const _hashedPassword = await this.hashPassword(newPassword);
    await OtpRepository.deleteOtpsByEmail(email);

    await AuditLogRepository.create({
      userId: userByEmail._id,
      action: "Reset Password",
    });

    return true;
  }

  /**
   * @param {{ _id: ObjectId, email: string, role?: string, username?: string }} user
   * @returns {string}
   */
  generateToken(user) {
    if (!user || !user._id || !user.email) {
      throw new AppError("Valid user object with id and email is required", 400);
    }

    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    /** @type {jwt.Secret} */
    const secret = JWT_SECRET;

    const options = {
      expiresIn: /** @type {import("ms").StringValue | number} */ (JWT_EXPIRES_IN),
      issuer: JWT_ISSUER,
    };

    const token = jwt.sign(payload, secret, options);
    return token;
  }

  /** @param {string} plainPassword */
  async hashPassword(plainPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
    return passwordHash;
  }

  /**
   * @function verifyToken
   * @param {string} token
   * @returns {jwt.JwtPayload | string}
   */
  verifyToken(token) {
    try {
      if (!token) {
        throw new AppError("Token is required", 400);
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError("Token expired. Please login again.", 401);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AppError("Invalid token", 401);
      }

      throw new AppError("Token verification failed", 401);
    }
  }
}

export default new AuthService();
