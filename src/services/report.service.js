// @ts-check
import ReportRepository from "../repositories/report.repositories.js";
import { createReportSchema, deleteReportSchema, getAllReportsQuerySchema, updateReportStatusSchema, downloadReportFilesSchema } from "../validators/report.validator.js";
import AppError from "../middlewares/error.middleware.js";
import mongoose from "mongoose";
import AuditLogRepository from "../repositories/audit-log.repositories.js";
import smsService from "./sms.service.js";
import path from "path";
import fs from "fs/promises";

class ReportService {
  /**
   * @param {import("../validators/report.validator.js").CreateReportBody} payload
   * @param {string} userId
   */
  async createReport(payload, userId) {
    const { error, value } = createReportSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { orgId, reportType, filePaths } = value;

    const reportData = { orgId, reportType, filePaths, submittedBy: userId };

    const report = await ReportRepository.createReport(reportData);

    await AuditLogRepository.create({
      userId,
      action: "Create Report",
    });

    return await ReportRepository.findReportById(report._id);
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/report.validator.js").GetAllReportsQuery} query
   */
  async getAllReports(actorId, query = {}) {
    const { value, error } = getAllReportsQuerySchema.validate(query);
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { page, limit, orgId, reportType, submittedBy, sortBy, sortOrder } = value;

    // Build filter
    const filter = {};
    if (orgId) {
      filter.orgId = orgId;
    }
    if (reportType) {
      filter.reportType = reportType;
    }
    if (submittedBy) {
      filter.submittedBy = submittedBy;
    }

    // Build sort
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const populate = [
      { path: "orgId", select: "orgName adviserId" },
      { path: "submittedBy", select: "username email role" },
    ];

    const { count, reports } = await ReportRepository.findAll({ filter, page, limit, sort, populate });

    await AuditLogRepository.create({ userId: actorId, action: "View Reports" });
    return { count, data: reports };
  }

  /**
   * @param {string} actorId
   * @param {string|string[]|mongoose.Types.ObjectId} reportId
   */
  async getReportById(actorId, reportId) {
    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      throw new AppError("Invalid report ID", 400);
    }

    const populate = [
      { path: "orgId", select: "orgName description" },
      { path: "submittedBy", select: "username email role" },
    ];

    const report = await ReportRepository.findById(reportId, { populate });

    if (!report) {
      throw new AppError("Report not found", 404);
    }

    await AuditLogRepository.create({
      userId: actorId,
      action: "View Report Details",
    });

    return report;
  }

  /**
   * @param {string} actorId
   * @param {string | string[]} reportId
   */
  async downloadFiles(actorId, reportId) {
    // Validate report ID
    const { error, value } = downloadReportFilesSchema.validate({
      id: reportId,
    });
    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    const report = await ReportRepository.findById(id);

    if (!report) {
      throw new AppError("Report not found", 404);
    }

    const filePaths = report.filePaths || [];

    await AuditLogRepository.create({
      userId: actorId,
      action: "Download Reports",
    });

    return {
      filePaths,
      reportType: report.reportType,
    };
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/report.validator.js").UpdateReportStatusBody} payload
   */
  async updateReportStatus(actorId, payload) {
    const { error, value } = updateReportStatusSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id, status, message } = value;
    const report = await ReportRepository.findById(id, { populate: ["submittedBy"] });

    if (!report) {
      throw new AppError("Report not found", 404);
    }

    if (report.status === status) {
      return report;
    }

    // Send SMS only for pending -> approved
    if (report.status === "pending" && status === "pending") {
      const to = report.submittedBy?.phoneNumber;

      if (!to) {
        throw new AppError("User phone number not found", 400);
      }

      await smsService.sendSMS({ to, message });
    }

    const updatedReport = await ReportRepository.updateStatusById(id, status);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Update Report Status",
    });

    return updatedReport;
  }

  /**
   * @param {string} actorId
   * @param {import("../validators/report.validator.js").DeleteReportParams} payload
   */
  async deleteReportById(actorId, payload) {
    const { error, value } = deleteReportSchema.validate(payload);

    if (error) {
      const message = error.details[0].message.replace(/"/g, "");
      throw new AppError(message, 400);
    }

    const { id } = value;

    const report = await ReportRepository.findById(id);
    if (!report) {
      throw new AppError("Report not found", 404);
    }

    if (Array.isArray(report.filePaths)) {
      for (const relativePath of report.filePaths) {
        const absolutePath = path.join(process.cwd(), relativePath);

        try {
          await fs.unlink(absolutePath);
        } catch (error) {
          console.error("Failed to delete file: ", absolutePath);
        }
      }
    }

    await ReportRepository.deleteById(id);

    await AuditLogRepository.create({
      userId: actorId,
      action: "Delete Report",
    });

    return report;
  }
}

export default new ReportService();
