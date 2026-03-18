// @ts-check
import mongoose from "mongoose";
import { MONGODB_URI, NODE_ENV } from "../config/env.js";

/**
 * @typedef {Object} DiagnosticRule
 * @property {(name: string, code?: string | number) => boolean} matches
 * @property {string} message
 */

const ENV_DB_MAP = Object.freeze({
  production: "campushub_prod",
});

const DEFAULT_DB_NAME = "campushub_dev";

/**
 * @type {Readonly<Record<string, DiagnosticRule>>}
 */
const DIAGNOSTICS = Object.freeze({
  network: {
    matches: (name, code) => name === "MongoNetworkError" || code === "ECONNREFUSED",
    message: "Diagnosis: Connection refused. Verify:\n" + "  1. MongoDB service is running\n" + "  2. IP address is whitelisted in MongoDB Atlas (if using cloud)\n" + "  3. MONGODB_URI is correctly formatted (mongodb+srv://... or mongodb://...)",
  },
  auth: {
    matches: (name, code) => name === "MongoServerError" && code === 18,
    message: "Authentication failed: Check username/password in MONGODB_URI",
  },
  dns: {
    matches: (name) => name === "MongooseServerSelectionError",
    message: "DNS/network issue: Verify URI hostname and network connectivity",
  },
});

const getDatabaseName = () => {
  // @ts-ignore
  return ENV_DB_MAP[NODE_ENV] ?? DEFAULT_DB_NAME;
};

export const connectToDatabase = async () => {
  const dbName = getDatabaseName();
  try {
    await mongoose.connect(MONGODB_URI, { dbName });
    console.log(`[Database] Connected to "${dbName}" in ${NODE_ENV} mode`);
  } catch (rawError) {
    const err = rawError instanceof Error ? rawError : new Error(String(rawError));
    const mongoError = /** @type {Error & { code?: string | number }} */ (err);

    console.error("Error connecting to Database: ", err.message);

    const activeDiagnostic = Object.values(DIAGNOSTICS).find((rule) => rule.matches(mongoError.name, mongoError.code));

    if (activeDiagnostic) {
      console.error(activeDiagnostic.message);
    }

    process.exit(1);
  }
};

export const disconnectFromDatabase = async () => {
  try {
    const { connection } = mongoose;

    if (connection.readyState === 1) {
      await connection.close();
      console.log("[Database] Disconnected successfully");
    } else {
      console.warn("[Database] No active connection to close.");
    }
  } catch (rawError) {
    const err = rawError instanceof Error ? rawError : new Error(String(rawError));
    console.error("[Database] Error during disconnection:", err.message);
    throw err;
  }
};
