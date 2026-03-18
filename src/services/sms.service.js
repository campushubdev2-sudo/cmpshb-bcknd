// @ts-check
import axios from "axios";
import querystring from "querystring";
import { SEMAPHORE_API_KEY, SEMAPHORE_SENDER_NAME } from "../config/env.js";
import AppError from "../middlewares/error.middleware.js";

class SmsService {
  constructor() {
    this.apikey = SEMAPHORE_API_KEY;
    this.senderName = SEMAPHORE_SENDER_NAME;

    /** @type {import("axios").AxiosInstance} */
    this.axiosClient = axios.create({
      baseURL: "https://semaphore.co/api/v4",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /** @param {{ to?: string | null | undefined; message: string | undefined }} data */
  async sendSMS({ to, message }) {
    if (!to || !message) {
      throw new AppError("Missing sms parameters", 400);
    }

    const numbers = Array.isArray(to) ? to.join(",") : to;

    const payload = querystring.stringify({
      apikey: this.apikey,
      number: numbers,
      message,
      sendername: this.senderName,
    });

    try {
      const { data } = await this.axiosClient.post("/messages", payload);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message || error.message;
        const status = error.response?.status || 500;
        throw new AppError(serverMessage, status);
      }
      throw new AppError("An unexpected error occurred", 500);
    }
  }

  async getBalance() {
    try {
      const response = await this.axiosClient.get("/account", {
        params: {
          apikey: this.apikey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to fetch balance";
        const status = error.response?.status || 500;
        throw new AppError(message, status);
      }

      // 2. Fallback for generic errors (like network being down or code bugs)
      const genericMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      throw new AppError(genericMessage, 500);
    }
  }
}

export default new SmsService();
