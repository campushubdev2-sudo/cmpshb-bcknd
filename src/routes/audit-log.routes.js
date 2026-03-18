// @ts-check
import AuditLogController from "../controllers/audit-log.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";
import { Router } from "express";

const auditLogRouter = Router();

auditLogRouter.use(authenticate, authorize("admin"));

auditLogRouter.delete("/cleanup", createRateLimiter({ limit: 10, windowMs: 60000 }), AuditLogController.cleanup);
auditLogRouter.get("/", createRateLimiter({ limit: 100, windowMs: 60000 }), AuditLogController.getAuditLogs);
auditLogRouter.delete("/:id", createRateLimiter({ limit: 10, windowMs: 60000 }), AuditLogController.deleteAuditLog);
auditLogRouter.get("/:id", createRateLimiter({ limit: 10, windowMs: 60000 }), AuditLogController.getLogById);

export default auditLogRouter;
