// @ts-check
import asyncHandler from "express-async-handler";
import AuditLogService from "../services/audit-log.service.js";

class AuditLogController {
  getAuditLogs = asyncHandler(async (request, response) => {
    const result = await AuditLogService.getAuditLogs(request.query);

    response.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: result,
    });
  });

  cleanup = asyncHandler(async (_request, request) => {
    const result = await AuditLogService.cleanupAuditLogs();

    request.status(200).json({
      success: true,
      message: "Audit logs cleaned up successfully",
      data: result,
    });
  });

  deleteAuditLog = asyncHandler(async (request, response) => {
    const result = await AuditLogService.deleteAuditLog({
      // @ts-ignore
      id: request.params.id,
    });

    response.status(200).json({
      success: true,
      message: "Audit log deleted successfully",
      data: result,
    });
  });

  getLogById = asyncHandler(async (request, response) => {
    const result = await AuditLogService.getAuditLogById({
      // @ts-ignore
      id: request.params.id,
    });

    response.status(200).json({
      success: true,
      message: "Audit log fetched successfully",
      data: result,
    });
  });
}

export default new AuditLogController();
