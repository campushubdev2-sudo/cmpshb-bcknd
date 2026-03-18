// @ts-check
import OTP from "../models/otp.model.js";
import mongoose from "mongoose";

/** @typedef {{ email: string, otp: string, expiresAt: Date, isVerified: boolean, verifiedAt: Date | undefined, verificationAttempts: number, createdAt: Date, updatedAt: Date }} Otp */

class OtpRepository {
  /** @param {{ email: string, otp: string }} payload */
  async findValidOtp(payload) {
    const query = {
      email: payload.email,
      otp: payload.otp,
      isVerified: false,
    };

    const result = await OTP.findOne(query).lean();
    return result;
  }

  /** @param {mongoose.Types.ObjectId} otpId */
  async markOtpVerified(otpId) {
    const verifiedAt = new Date();
    const update = { verifiedAt };
    const options = { new: true };
    return OTP.findByIdAndUpdate(otpId, update, options);
  }

  /** @param {string} email */
  async deleteOtpsByEmail(email) {
    const filter = { email };
    const result = OTP.deleteMany(filter);
    return result;
  }

  /** @param {Pick<Otp, "email" | "otp" | "expiresAt">} data */
  async create(data) {
    const otpDocument = await OTP.create(data);
    const otpObject = otpDocument.toObject();
    return otpObject;
  }

  /** @param {{ email: string }} payload */
  async findLatestUnverifiedByEmail(payload) {
    const query = {
      email: payload.email,
      isVerified: false,
    };

    const result = await OTP.findOne(query).sort({ createdAt: 1 }).lean();
    return result;
  }

  /** @param {mongoose.Types.ObjectId | string} otpId */
  async incrementOtpAttempts(otpId) {
    const filter = { _id: otpId };
    const update = {
      $inc: { verificationAttempts: 1 },
    };
    const options = {
      new: true,
    };

    const updatedOtp = await OTP.findByIdAndUpdate(filter, update, options);
    return updatedOtp;
  }

  async deleteExpiredOtps() {
    const now = new Date();
    const filter = {
      expiresAt: { $lt: now },
    };
    const result = OTP.deleteMany(filter);
    return result;
  }

  async getStatistics() {
    const now = new Date();
    const totalOTPsPromise = OTP.countDocuments();
    const expiredOTPsPromise = OTP.countDocuments({ expiresAt: { $lt: now } });
    const verifiedOTPsPromise = OTP.countDocuments({ isVerified: true });
    const activeOTPsPromise = OTP.countDocuments({
      isVerified: false,
      expiresAt: { $gte: now },
    });

    const otpsByEmailPromise = OTP.aggregate([
      {
        $group: {
          _id: "$email",
          totalOTPs: { $sum: 1 },
          verifiedOTPs: { $sum: { $cond: ["$isVerified", 1, 0] } },
        },
      },
      {
        $project: {
          email: "$_id",
          totalOTPs: 1,
          verifiedOTPs: 1,
          _id: 0,
        },
      },
      { $sort: { totalOTPs: -1 } },
    ]);

    const [totalOTPs, expiredOTPs, verifiedOTPs, activeOTPs, otpsByEmail] = await Promise.all([totalOTPsPromise, expiredOTPsPromise, verifiedOTPsPromise, activeOTPsPromise, otpsByEmailPromise]);

    return { totalOTPs, activeOTPs, expiredOTPs, verifiedOTPs, otpsByEmail };
  }
}

export default new OtpRepository();
