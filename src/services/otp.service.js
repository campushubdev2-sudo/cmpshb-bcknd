// @ts-check
import AppError from "../middlewares/error.middleware.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import crypto from "crypto";
import EmailService from "./email.service.js";
import mongoose from "mongoose";
import OtpRepository from "../repositories/otp.repositories.js";
import { sendOtpSchema, verifyOtpSchema } from "../validators/otp.validator.js";
import UserRepository from "../repositories/user.repositories.js";

class OtpService {
  constructor() {
    this.MAX_VERIFICATION_ATTEMPTS = 5;
  }

  /** @param {{ email: string }} payload */
  async sendOtp(payload) {
    const { error, value } = sendOtpSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { email } = value;
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new AppError("User with this email does not exist", 404);
    }

    await OtpRepository.deleteOtpsByEmail(email);

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpRepository.create({ email, otp, expiresAt });
    await EmailService.sendOTPEmail(email, otp);

    return { email, expiresAt };
  }

  /**
   * @param {{ email: string }} payload
   * @returns {Promise<{ email: string, expiresAt: Date }>}
   */
  async resendOtp(payload) {
    const { error, value } = sendOtpSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const existingOtp = await OtpRepository.findLatestUnverifiedByEmail(value);

    if (existingOtp && existingOtp.expiresAt > new Date()) {
      const remainingTime = Math.ceil((existingOtp.expiresAt.getTime() - Date.now()) / 1000 / 60);
      throw new AppError(`Current OTP is still valid. Please check your email or wait ${remainingTime} minute(s).`, 429);
    }

    return await this.sendOtp(value);
  }

  /** @param {{email: string, otp: string }} payload */
  async verifyOtp(payload) {
    const { error, value } = verifyOtpSchema.validate(payload);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { email } = value;

    const otpDoc = await OtpRepository.findValidOtp(value);
    if (!otpDoc) {
      const latestOtp = await OtpRepository.findLatestUnverifiedByEmail(value);

      if (!latestOtp) {
        throw new AppError("Invalid OTP", 400);
      }

      const updatedOtp = await OtpRepository.incrementOtpAttempts(latestOtp._id);

      // @ts-ignore
      if (updatedOtp.verificationAttempts >= this.MAX_VERIFICATION_ATTEMPTS) {
        await OtpRepository.deleteOtpsByEmail(email);
        throw new AppError("Too many invalid attempts. OTP invalidated.", 429);
      }

      throw new AppError("Invalid OTP", 400);
    }

    if (otpDoc.expiresAt < new Date()) {
      await OtpRepository.deleteOtpsByEmail(email);
      throw new AppError("OTP has expired", 400);
    }

    if (otpDoc.verificationAttempts >= this.MAX_VERIFICATION_ATTEMPTS) {
      await OtpRepository.deleteOtpsByEmail(email);
      throw new AppError("Too many invalid attempts. OTP invalidated.", 429);
    }

    await OtpRepository.markOtpVerified(otpDoc._id);

    return { email, verified: true };
  }

  async cleanupExpiredOtps() {
    const result = await OtpRepository.deleteExpiredOtps();

    // TODO: await auditLogRepository.create({
    //   userId: actorId,
    //   action: "Cleanup OTP Records",
    // });

    return {
      message: `Expired OTPs cleaned up successfully. ${result.deletedCount} record(s) removed.`,
      meta: {
        deletedCount: result.deletedCount || 0,
      },
    };
  }

  /** @param {mongoose.Types.ObjectId | string} actorId */
  async getOtpStatistics(actorId) {
    await AuditLogRepository.create({
      userId: actorId,
      action: "OTP Statistics",
    });

    return OtpRepository.getStatistics();
  }

  generateOtp() {
    const otpNumber = crypto.randomInt(100000, 999999).toString();
    return otpNumber;
  }
}

export default new OtpService();
