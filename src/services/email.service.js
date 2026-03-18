// @ts-check
import AppError from "../middlewares/error.middleware.js";
import { EMAIL_PASSWORD, EMAIL_SERVICE, EMAIL_USER } from "../config/env.js";
import nodemailer from "nodemailer";

/** @typedef {nodemailer.Transporter} Transporter */

class EmailService {
  constructor() {
    /** @type {Transporter} */
    this.transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  /**
   * @param {string} email
   * @param {string} otpCode
   */
  async sendOTPEmail(email, otpCode) {
    /** @type {nodemailer.SendMailOptions} */
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Your OTP Verification Code",
      text: `Your OTP is: ${otpCode}`,
      html: `<b>Your OTP is: <span style="font-size: 1.2em; color: #2c3e50;">${otpCode}</span></b>`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Email Service Error:", error);
      throw new AppError("We couldn't send your OTP. Please try again in a moment.", 500);
    }
  }
}

export default new EmailService();
