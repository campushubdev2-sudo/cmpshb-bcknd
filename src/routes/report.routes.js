// @ts-check
import { Router } from "express";
import ReportController from "../controllers/report.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { uploadReportFiles, handleMulterError, parseFormData } from "../middlewares/upload.middleware.js";

const reportRouter = Router();

reportRouter.post("/", parseFormData, authenticate, authorize("admin", "officer"), uploadReportFiles, handleMulterError, ReportController.createReport);
reportRouter.get("/", authenticate, authorize("admin", "officer", "adviser"), ReportController.getAllReports);
reportRouter.get("/:id/download", authenticate, authorize("admin"), ReportController.downloadReportFiles);
reportRouter.put("/:id", authenticate, authorize("admin"), ReportController.updateStatus);
reportRouter.get("/:id", authenticate, authorize("admin", "officer", "adviser"), ReportController.getReportById);
reportRouter.delete("/:id", authenticate, authorize("admin"), ReportController.deleteReportById);

export default reportRouter;
