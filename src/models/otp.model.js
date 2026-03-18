// @ts-check
import { Schema, model } from "mongoose";

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      ref: "User",
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

otpSchema.index({ email: 1, isVerified: 1 });
otpSchema.index({ email: 1, otp: 1 });

const OTP = model("OTP", otpSchema);

export default OTP;
