// @ts-check
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { CORS_ORIGINS, NODE_ENV, PORT } from "./config/env.js";
import { disconnectFromDatabase, connectToDatabase } from "./database/mongodb.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { formatUptime } from "./utils/time.js";
import requestLogger from "./middlewares/request-logger.middleware.js";

// ROUTES
import authRoutes from "./routes/auth.routes.js";
import auditLogRoutes from "./routes/audit-log.routes.js";
import calendarEntryRoutes from "./routes/calendar-entries.js";
import eventNotificationRoutes from "./routes/event-notification.route.js";
import officerRoutes from "./routes/officer.route.js";
import otpRoutes from "./routes/otp.routes.js";
import orgRoutes from "./routes/org.routes.js";
import reportsRoutes from "./routes/report.routes.js";
import schoolEventRoutes from "./routes/school-event.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
const isDev = NODE_ENV === "development";
const isProd = NODE_ENV === "production";
/** @type {import("http").Server} */
let server;
let shuttingDown = false;

if (isProd) {
  app.set("trust proxy", 1);
}

if (isDev) {
  app.use(requestLogger);
}

const allowedOrigins = CORS_ORIGINS.split(", ")
  .map((origin) => origin.trim())
  .filter(Boolean);

// MIDDLEWARES
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (_request, response) => {
  const uptimeSeconds = process.uptime();

  response.status(200).json({
    success: true,
    message: "Server is healthy",
    environment: NODE_ENV,
    uptime: {
      humanReadable: formatUptime(uptimeSeconds),
      seconds: Math.floor(uptimeSeconds),
    },
    timestamp: new Date().toISOString(),
  });
});

// ROUTES
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/calendar-entries", calendarEntryRoutes);
app.use("/api/v1/event-notifications", eventNotificationRoutes);
app.use("/api/v1/officers", officerRoutes);
app.use("/api/v1/orgs", orgRoutes);
app.use("/api/v1/otp", otpRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/school-events", schoolEventRoutes);
app.use("/api/v1/users", userRoutes);

// 404 HANDLER
app.use((request, response, _next) => {
  response.status(404).json({
    success: false,
    message: "Resource not found",
    path: request.originalUrl,
  });
});

app.use(errorMiddleware);

(async () => {
  try {
    await connectToDatabase();

    server = app.listen(PORT, () => {
      if (isDev) {
        console.log(`Server is listening at http://localhost:${PORT}`);
      } else {
        console.log(`Server is running on port ${PORT}`);
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error("Startup failed: ", err);
    process.exit(1);
  }
})();

/**
 * @param {NodeJS.Signals} signal
 * @returns {Promise<void>}
 */
const shutdown = async (signal) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`\n[${signal}] Shutdown initiated...`);

  // after 10 seconds
  const forceQuit = setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down.");
    process.exit(1);
  }, 10000);

  try {
    if (server) {
      console.log("Closing HTTP server...");
      await new Promise((resolve, reject) => {
        server.close((err) => {
          err ? reject(err) : resolve(undefined);
        });
      });
      console.log("HTTP server closed.");
    }

    await disconnectFromDatabase();

    clearTimeout(forceQuit);
    console.log("Shutdown complete. Goodbye!");
    process.exit(0);
  } catch (error) {
    console.error("Shutdown failed: ", error);
    process.exitCode = 1;
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
