// @ts-check
import archiver from "archiver";
import asyncHandler from "express-async-handler";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ReportService from "../services/report.service.js";

/** @typedef {{ fieldname: string; originalname: string; encoding: string; mimetype: string; size: number; destination: string; filename: string; path: string; }} MulterFile */
/**
 * @typedef {express.Request & { user: { id: string } }} AuthenticatedRequest
 * @typedef {AuthenticatedRequest & { files?: MulterFile[] }} ReportRequest
 */

class ReportController {
  createReport = asyncHandler(async (request, response) => {
    try {
      const files = request.files && Array.isArray(request.files) ? request.files : [];

      const uploadedFilePaths = files.map((file) => {
        const serverDir = process.cwd();
        const relativePath = path.relative(serverDir, file.path);
        return relativePath.replace(/\\/g, "/");
      });

      const allFilePaths = [...uploadedFilePaths, ...(request.body.filePaths || [])];

      const reportsData = {
        orgId: request.body.orgId,
        reportType: request.body.reportType,
        filePaths: allFilePaths,
      };

      const result = await ReportService.createReport(reportsData, /** @type {ReportRequest} */ (request).user.id);

      response.status(201).json({
        success: true,
        message: "Report submitted successfully",
        data: result,
      });
    } catch (error) {
      if (request.files && Array.isArray(request.files)) {
        request.files.forEach((file) => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (unlinkError) {
            console.error("Error cleaning up file:", unlinkError);
          }
        });
      }
      throw error;
    }
  });

  getAllReports = asyncHandler(async (request, response) => {
    const result = await ReportService.getAllReports(/** @type {ReportRequest} */ (request).user.id, request.query);

    response.status(200).json({
      success: true,
      count: result.count,
      data: result.data,
    });
  });

  getReportById = asyncHandler(async (request, response) => {
    const { id } = request.params;
    const report = await ReportService.getReportById(/** @type {ReportRequest} */ (request).user.id, id);

    response.status(200).json({
      success: true,
      data: report,
    });
  });

  downloadReportFiles = asyncHandler(async (request, response) => {
    const result = await ReportService.downloadFiles(/** @type {ReportRequest} */ (request).user.id, request.params.id);

    // MULTIPLE FILES → ZIP
    if (result.filePaths.length > 1) {
      response.setHeader("Content-Type", "application/zip");
      response.setHeader("Content-Disposition", `attachment; filename=${result.reportType}-reports.zip`);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.on("error", (err) => {
        throw err;
      });

      archive.pipe(response);

      for (const filePath of result.filePaths) {
        archive.file(filePath, {
          name: path.basename(filePath),
        });
      }

      await archive.finalize();
      return;
    }

    // SINGLE FILE → DIRECT DOWNLOAD
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const filePath = path.join(__dirname, "../../", result.filePaths[0]);
    response.download(filePath);
  });

  updateStatus = asyncHandler(async (request, response) => {
    const payload = {
      id: request.params.id,
      status: request.body.status,
      ...(request.body.message && { message: request.body.message }),
    };

    const result = await ReportService.updateReportStatus(/** @type {ReportRequest} **/ (request).user.id, payload);

    response.status(200).json({
      success: true,
      message: "Report status updated successfully",
      data: result,
    });
  });

  deleteReportById = asyncHandler(async (request, response) => {
    const result = await ReportService.deleteReportById(/** @type {ReportRequest} */ (request).user.id, {
      id: request.params.id,
    });

    response.status(200).json({
      success: true,
      message: "Report deleted successfully",
      data: result,
    });
  });
}

export default new ReportController();
