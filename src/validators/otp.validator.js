// @ts-check
import Joi from "joi";
import { emailField, otpField } from "./fields.js";

/** @typedef {{ email: string, otp: string, newPassword: string}} ResetPasswordBody */
/** @typedef {{ email: string }} SendOtpBody */
/** @typedef {{ email: string, otp: string }} VerifyOtpBody */

/** @type {Joi.ObjectSchema<ResetPasswordBody>} */
const resetPasswordSchema = Joi.object({
  email: emailField.required().messages({
    "any.required": "Email is required",
  }),
  otp: otpField.required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#^()_\-+=]).+$/)
    .required()
    .messages({
      "string.empty": "New password cannot be empty.",
      "any.required": "A new password is required.",
      "string.min": "Your new password must be at least 8 characters long.",
      "string.max": "Your new password cannot exceed 128 characters.",
      "string.pattern.base": "Password must include uppercase, lowercase, number, and special character",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<SendOtpBody>} */
const sendOtpSchema = Joi.object({
  email: emailField.required().messages({
    "any.required": "Email is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<VerifyOtpBody>} */
const verifyOtpSchema = Joi.object({
  email: emailField.required(),
  otp: otpField.required(),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export { resetPasswordSchema, sendOtpSchema, verifyOtpSchema };
