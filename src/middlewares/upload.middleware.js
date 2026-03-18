// @ts-check
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import AppError from "./error.middleware.js";

// Get the server directory (current directory)
const getRootDir = () => process.cwd();
const VALID_REPORT_TYPES = ["actionPlan", "bylaws", "financial", "proposal"];

/** @param {string} reportType */
const sanitizeReportType = (reportType) => {
  if (!reportType || typeof reportType !== "string") {
    throw new AppError("Report type is required and must be a string", 400);
  }

  const trimmed = reportType.trim();

  if (!VALID_REPORT_TYPES.includes(trimmed)) {
    throw new AppError("Report type must be one of: actionPlan, bylaws, financial, proposal", 400);
  }

  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    throw new AppError("Invalid report type: path traversal detected", 400);
  }

  return trimmed;
};

/**
 * @param {express.Request} _request
 * @param {Express.Multer.File} file
 * @param {multer.FileFilterCallback} cb
 */
const fileFilter = (_request, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xlsx|xls|ppt|pptx|jpg|jpeg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  return cb(new Error(`File type "${path.extname(file.originalname)}" not allowed. Allowed types: PDF, DOC, DOCX, XLSX, XLS, PPT, PPTX, JPG, JPEG, PNG`));
};

const storage = multer.diskStorage({
  destination: (request, _file, cb) => {
    try {
      const rootDir = getRootDir();
      const tempDir = path.join(rootDir, "uploads", "reports", "temp");

      // Verify the resolved path is within the expected directory
      const expectedBaseDir = path.join(rootDir, "uploads", "reports");
      const resolvedPath = path.resolve(tempDir);
      const resolvedBaseDir = path.resolve(expectedBaseDir);

      if (!resolvedPath.startsWith(resolvedBaseDir)) {
        return cb(new AppError("Invalid upload path: path traversal detected", 400), "");
      }

      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      cb(null, tempDir);
    } catch (error) {
      cb(error instanceof Error ? error : new AppError(String(error), 400), "");
    }
  },
  filename: (_request, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Sanitize filename to prevent path traversal
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "").replace(/\.\./g, "");
    const ext = path.extname(safeFilename) || path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${ext}`);
  },
});

const createMulterInstance = () => {
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
    fileFilter,
  });

  // return upload.array("files", 5);
  return upload.any();
};

const upload = createMulterInstance();
/**
 * @param {express.Request} request
 * @param {express.Response} response
 * @param {express.NextFunction} next
 */
const uploadReportFiles = (request, response, next) => {
  const upload = createMulterInstance();

  upload(request, response, async (err) => {
    if (err) {
      // Clean up any files that might have been created before the error
      if (request.files && Array.isArray(request.files)) {
        request.files.forEach((file) => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (unlinkError) {
            console.error("Error cleaning up file after upload error:", unlinkError);
          }
        });
      }
      return next(err);
    }

    if (request.files && Array.isArray(request.files)) {
      request.files = request.files.filter((file) => file.fieldname === "files");
    } else {
      request.files = [];
    }

    try {
      const rawReportType = request.body?.reportType;
      if (!rawReportType) {
        // Clean up any temp files if reportType is missing
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
        return next(new AppError("Report type is required", 400));
      }

      // Sanitize and validate reportType
      const reportType = sanitizeReportType(rawReportType);

      // If files were uploaded, move them from temp directory to correct location
      if (request.files && Array.isArray(request.files) && request.files.length > 0) {
        // Create the correct destination directory
        const rootDir = getRootDir();
        const uploadDir = path.join(rootDir, "uploads", "reports", reportType);

        // Verify the resolved path is within the expected directory
        const expectedBaseDir = path.join(rootDir, "uploads", "reports");
        const resolvedPath = path.resolve(uploadDir);
        const resolvedBaseDir = path.resolve(expectedBaseDir);

        if (!resolvedPath.startsWith(resolvedBaseDir)) {
          // Clean up temp files
          request.files.forEach((file) => {
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            } catch (unlinkError) {
              console.error("Error cleaning up file:", unlinkError);
            }
          });
          return next(new AppError("Invalid report type: path traversal detected", 400));
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Move files from temp directory to the correct reportType directory
        for (const file of request.files) {
          const tempPath = file.path;
          const newFilename = path.basename(tempPath);
          const newPath = path.join(uploadDir, newFilename);

          try {
            // Move file from temp to final location
            fs.renameSync(tempPath, newPath);
            // Update file path in request.files
            file.path = newPath;
            file.destination = uploadDir;
          } catch (moveError) {
            // Clean up all files if move fails
            request.files.forEach((f) => {
              try {
                if (fs.existsSync(f.path)) {
                  fs.unlinkSync(f.path);
                }
              } catch (unlinkError) {
                console.error("Error cleaning up file:", unlinkError);
              }
            });

            const message = moveError instanceof Error ? moveError.message : "Unknown file move error";

            return next(new AppError(`Failed to move file: ${message}`, 500));
          }
        }
      }
    } catch (error) {
      // Clean up files if reportType validation fails
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
      return next(error instanceof Error ? error : new AppError(String(error), 400));
    }

    return next();
  });
};

/**
 * @param {Error} error
 * @param {express.Request} _request
 * @param {express.Response} response
 * @param {express.NextFunction} next
 */
const handleMulterError = (error, _request, response, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return response.status(400).json({
        success: false,
        status: "fail",
        message: "File size too large. Maximum size is 10mb per file",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return response.status(400).json({
        success: false,
        status: "fail",
        message: "Too many files. Maximum is 5 files per upload",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return response.status(400).json({
        success: false,
        status: "fail",
        message: 'Unexpected field. Use "files" as field name',
      });
    }
  } else if (error) {
    // Handle AppError instances (from destination function validation)
    if (error instanceof AppError) {
      return response.status(error.statusCode).json({
        success: false,
        status: "fail",
        message: error.message || "File upload error",
      });
    }
    const statusCode = /** @type {Error & { statusCode?: number }} */ (error).statusCode;
    if (statusCode) {
      return response.status(statusCode).json({
        success: false,
        status: "fail",
        message: error.message || "File upload error",
      });
    }
    return response.status(400).json({
      success: false,
      status: "fail",
      message: error.message || "File upload error",
    });
  }
  return next();
};

/**
 * @param {express.Request} _request
 * @param {express.Response} _response
 * @param {express.NextFunction} next
 */
const parseFormData = (_request, _response, next) => {
  next();
};

export { uploadReportFiles, parseFormData, handleMulterError };
