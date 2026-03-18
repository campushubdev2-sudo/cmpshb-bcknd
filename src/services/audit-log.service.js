// @ts-check
import AppError from "../middlewares/error.middleware.js";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import { deleteAuditLogSchema, getAuditLogsSchema, getAuditLogByIdSchema } from "../validators/audit-log.validator.js";
import mongoose from "mongoose";

class AuditLogService {
  /** @param {import("../validators/audit-log.validator.js").GetAuditLogsQuery} query */
  async getAuditLogs(query) {
    const { error, value } = getAuditLogsSchema.validate(query);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { userId, action, sort, fields } = value;
    const filter = {};

    if (userId) {
      filter.userId = userId;
    }

    if (action) {
      filter.action = action;
    }

    return AuditLogRepository.findAll({ filter, sort, fields });
  }

  async cleanupAuditLogs() {
    const result = await AuditLogRepository.deleteAll();

    return {
      deletedCount: result.deletedCount,
    };
  }

  /** @param {import("../validators/audit-log.validator.js").AuditLogIdParam} payload */
  async deleteAuditLog(payload) {
    const { error, value } = deleteAuditLogSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    const existingLog = await AuditLogRepository.findById(id);
    if (!existingLog) {
      throw new AppError("Audit log not found", 404);
    }

    const deletedLog = await AuditLogRepository.deleteById(id);
    return deletedLog;
  }

  /** @param {mongoose.Types.ObjectId} payload */
  async getAuditLogById(payload) {
    const { error, value } = getAuditLogByIdSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;
    const auditLog = await AuditLogRepository.findById(id);

    if (!auditLog) {
      throw new AppError("Audit log not found", 404);
    }

    return auditLog;
  }
}

export default new AuditLogService();
