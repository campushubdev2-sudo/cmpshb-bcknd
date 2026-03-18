// @ts-check
import { config } from "dotenv";

config({ quiet: true });

/**
 * @param {string} key
 * @param {string | undefined} value
 * @returns {string}
 */
const requireEnv = (key, value) => {
  const envFile = `.env.${process.env.NODE_ENV || "development"}`;
  if (!value) {
    throw new Error(`[Config Error] Missing "${key}" in ${envFile}. System cannot start without it.`);
  }
  return value;
};

export const CLIENT_URL = requireEnv("CLIENT_URL", process.env.CLIENT_URL);
export const EMAIL_PASSWORD = requireEnv("EMAIL_PASSWORD", process.env.EMAIL_PASSWORD);
export const EMAIL_SERVICE = requireEnv("EMAIL_SERVICE", process.env.EMAIL_SERVICE);
export const EMAIL_USER = requireEnv("EMAIL_USER", process.env.EMAIL_USER);
export const JWT_EXPIRES_IN = requireEnv("JWT_EXPIRES_IN", process.env.JWT_EXPIRES_IN);
export const JWT_ISSUER = requireEnv("JWT_ISSUER", process.env.JWT_ISSUER);
export const JWT_SECRET = requireEnv("JWT_SECRET", process.env.JWT_SECRET);
export const MONGODB_URI = requireEnv("MONGODB_URI", process.env.MONGODB_URI);
export const NODE_ENV = requireEnv("NODE_ENV", process.env.NODE_ENV);
export const PORT = requireEnv("PORT", process.env.PORT);
export const SEMAPHORE_API_KEY = requireEnv("SEMAPHORE_API_KEY", process.env.SEMAPHORE_API_KEY);
export const SEMAPHORE_SENDER_NAME = requireEnv("SEMAPHORE_SENDER_NAME", process.env.SEMAPHORE_SENDER_NAME);
