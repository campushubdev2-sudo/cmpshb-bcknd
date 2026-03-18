// @ts-check
import Joi from "joi";

/** @typedef {{ filePath: string }} ReportFile */
/** @typedef {{ orgId: string; reportType: "actionPlan" | "bylaws" | "financial" | "proposal"; filePaths: string[]; status?: "pending" | "approved" | "rejected" | undefined }} CreateReportBody */
/** @typedef {{ page?: number | undefined; limit?: number | undefined; orgId?: string | undefined; reportType?: "actionPlan" | "bylaws" | "financial" | "proposal" | undefined; submittedBy?: string | undefined; sortBy?: "submittedDate" | "createdAt" | "updatedAt" | undefined; sortOrder?: "asc" | "desc" | undefined }} GetAllReportsQuery */
/** @typedef {{ id: string }} DownloadReportFilesParams */
/** @typedef {{ id: string; status: "pending"|"approved"|"rejected"; message?: string }} UpdateReportStatusBody */
/** @typedef {{ id: string|string[] }} DeleteReportParams */

/** @type {Joi.ObjectSchema<CreateReportBody>} */
const createReportSchema = Joi.object({
  orgId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Organization ID must be a valid MongoDB ObjectId",
    "string.length": "Organization ID must be 24 characters",
    "any.required": "Organization ID is required",
  }),
  reportType: Joi.string().valid("actionPlan", "bylaws", "financial", "proposal").required().messages({
    "any.only": "Report type must be one of: actionPlan, bylaws, financial, proposal",
    "any.required": "Report type is required",
  }),
  filePaths: Joi.array()
    .items(
      Joi.string().max(255).messages({
        "string.max": "File path cannot exceed 255 characters",
        "string.uri": "File path must be a valid URI",
      }),
    )
    .min(1)
    .messages({
      "array.min": "At least one file path is required",
    }),
  status: Joi.string().valid("pending", "approved", "rejected").default("pending").messages({
    "any.only": "Status must be one of: pending, approved, rejected",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetAllReportsQuery>} */
const getAllReportsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number.",
    "number.integer": "Page must be a whole number.",
    "number.min": "Page must be at least 1.",
  }),
  limit: Joi.number().min(1).max(100).default(25).messages({
    "number.base": "Limit must be a number.",
    "number.integer": "Limit must be a whole number.",
    "number.min": "Limit must be at least 1.",
    "number.max": "Limit cannot exceed 100.",
  }),
  orgId: Joi.string().hex().length(24).optional().messages({
    "string.base": "Organization ID must be a string.",
    "string.hex": "Organization ID is invalid.",
    "string.length": "Organization ID is invalid.",
  }),
  reportType: Joi.string().valid("actionPlan", "bylaws", "financial", "proposal").optional().messages({
    "any.only": "Report type must be one of: actionPlan, bylaws, financial, proposal.",
    "string.base": "Report type must be a string.",
  }),
  submittedBy: Joi.string().hex().length(24).optional().messages({
    "string.base": "Submitted-by ID must be a string.",
    "string.hex": "Submitted-by ID is invalid.",
    "string.length": "Submitted-by ID is invalid.",
  }),
  sortBy: Joi.string().valid("submittedDate", "createdAt", "updatedAt").default("submittedDate").messages({
    "any.only": "Sort field must be one of: submittedDate, createdAt, updatedAt.",
    "string.base": "Sort field must be a string.",
  }),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Sort order must be either asc or desc.",
    "string.base": "Sort order must be a string.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<DownloadReportFilesParams>} */
const downloadReportFilesSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid report ID format",
      "any.required": "Report ID is required",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<UpdateReportStatusBody>} */
const updateReportStatusSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "any.required": "Report ID is required.",
    "string.base": "Report ID must be a string.",
    "string.hex": "Report ID is invalid.",
    "string.length": "Report ID is invalid.",
  }),
  status: Joi.string().valid("pending", "approved", "rejected").required().messages({
    "any.required": "Status is required.",
    "string.base": "Status must be a string.",
    "any.only": "Status must be one of: pending, approved, rejected.",
  }),
  message: Joi.when("status", {
    is: "approved",
    then: Joi.string().trim().default("Your proposal has been approved.").messages({
      "string.base": "Message must be a string.",
    }),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "Message is only allowed when status is approved.",
      "any.forbidden": "Message is only allowed when status is approved.",
    }),
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<DeleteReportParams>} */
const deleteReportSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "any.required": "Report ID is required.",
    "string.base": "Report ID must be a string.",
    "string.hex": "Report ID is invalid.",
    "string.length": "Report ID is invalid.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export { createReportSchema, downloadReportFilesSchema, updateReportStatusSchema, deleteReportSchema, getAllReportsQuerySchema };
