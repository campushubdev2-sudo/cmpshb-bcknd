// @ts-check
import mongoose, { connect, disconnect } from "mongoose";
import { MONGODB_URI, NODE_ENV } from "../config/env.js";

/**
 * @returns {"campushub_prod" | "campushub_dev"}
 */
const getDatabaseName = () => {
  switch (NODE_ENV) {
    case "production":
      return "campushub_prod";
    default:
      return "campushub_dev";
  }
};

const connectToDatabase = async () => {
  const dbName = getDatabaseName();
  try {
    await connect(MONGODB_URI, { dbName });
    console.log(`[Database] Connected to "${dbName}" in ${NODE_ENV} mode`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error connecting to Database: ", err.message);

    const mongoError = /** @type {Error & { code?: string | number }} */ (err);
    if (mongoError.name === "MongoNetworkError" || mongoError.code === "ECONNREFUSED") {
      console.error("Diagnosis: Connection refused. Verify:\n" + "  1. MongoDB service is running\n" + "  2. IP address is whitelisted in MongoDB Atlas (if using cloud)\n" + "  3. MONGODB_URI is correctly formatted (mongodb+srv://... or mongodb://...)");
    } else if (mongoError.name === "MongoServerError" && mongoError.code === 18) {
      console.error("Authentication failed: Check username/password in MONGODB_URI");
    } else if (mongoError.name === "MongooseServerSelectionError") {
      console.error("DNS/network issue: Verify URI hostname and network connectivity");
    }
    process.exit(1);
  }
};

const disconnectFromDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await disconnect();
      console.log("[Database] Disconnected successfully");
    } else {
      console.warn("[Database] No active connection to close.");
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Database] Error during disconnection:", err.message);
  }
};

export { connectToDatabase, disconnectFromDatabase };
