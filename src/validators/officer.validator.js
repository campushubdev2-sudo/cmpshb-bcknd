// @ts-check
import Joi from "joi";
import { userIdField } from "./fields.js";
import { BSBA_OFFICER_POSITIONS, BSHM_OFFICER_POSITIONS, JUNIOR_PHILIPPINE_BSA_OFFICER_POSITIONS, SUPREME_STUDENT_COUNCIL_OFFICER_POSITIONS, BSCRIM_OFFICER_POSITIONS, MODERN_YOUNG_EDUCATORS_OFFICER_POSITIONS, COLLEGE_OF_TEACHER_OFFICER_POSITIONS, ELEM_OFFICER_POSITIONS, SSLG_OFFICER_POSITIONS, YWAV_OFFICER_POSITIONS, JPCS_OFFICER_POSITIONS } from "../constants/officer-positions.js";

/** @typedef {{ userId: string; orgId: string; position: string; startTerm: Date; endTerm: Date; }} CreateOfficerBody */
/** @typedef {{ orgId?: string | undefined; userId?: string | undefined; position?: string | undefined; page?: number | undefined; limit?: number | undefined; sortBy?: "createdAt" | "startTerm" | "endTerm" | "position" | undefined; order?: "asc" | "desc" | undefined; }} GetOfficersQuery */
/** @typedef {{ id: string | string[]; }} OfficerIdParam */
/** @typedef {{ userId?: string | undefined; orgId?: string | undefined; position?: string | undefined; startTerm?: Date | undefined; endTerm?: Date | undefined; }} UpdateOfficerBody */
/** @typedef {{ period?: "month" | "quarter" | "year" | undefined; }} OfficersStatsQuery */
/** @typedef {{ days?: number | undefined; }} OfficersNearTermEndQuery */

const ALL_OFFICER_POSITIONS = [...BSBA_OFFICER_POSITIONS, ...BSHM_OFFICER_POSITIONS, ...JUNIOR_PHILIPPINE_BSA_OFFICER_POSITIONS, ...SUPREME_STUDENT_COUNCIL_OFFICER_POSITIONS, ...BSCRIM_OFFICER_POSITIONS, ...MODERN_YOUNG_EDUCATORS_OFFICER_POSITIONS, ...COLLEGE_OF_TEACHER_OFFICER_POSITIONS, ...ELEM_OFFICER_POSITIONS, ...SSLG_OFFICER_POSITIONS, ...YWAV_OFFICER_POSITIONS, ...JPCS_OFFICER_POSITIONS];

/** @type {Joi.ObjectSchema<CreateOfficerBody>} */
const createOfficerSchema = Joi.object({
  userId: userIdField.required().messages({
    "any.required": `"userId" is required`,
  }),

  orgId: Joi.string().hex().length(24).required().messages({
    "string.base": `"orgId" must be a string`,
    "string.hex": `"orgId" must be a valid hexadecimal string`,
    "string.length": `"orgId" must be exactly 24 characters long`,
    "any.required": `"orgId" is required`,
  }),

  position: Joi.string()
    .max(50)
    .trim()
    .valid(...ALL_OFFICER_POSITIONS)
    .required()
    .messages({
      "string.base": `"position" must be a string`,
      "string.max": `"position" must not exceed 50 characters`,
      "any.only": `"position" must be a valid officer position`,
      "any.required": `"position" is required`,
    }),

  startTerm: Joi.date().required().messages({
    "date.base": `"startTerm" must be a valid date`,
    "any.required": `"startTerm" is required`,
  }),

  endTerm: Joi.date().greater(Joi.ref("startTerm")).required().messages({
    "date.base": `"endTerm" must be a valid date`,
    "date.greater": `"endTerm" must be later than "startTerm"`,
    "any.required": `"endTerm" is required`,
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetOfficersQuery>} */
const getOfficersSchema = Joi.object({
  orgId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "The Organization ID must be a valid hexadecimal string.",
    "string.length": "The Organization ID must be exactly 24 characters long.",
  }),

  userId: userIdField,

  position: Joi.string().max(50).optional().messages({
    "string.max": "Position name cannot exceed 50 characters.",
  }),

  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number.",
    "number.min": "Page must be at least 1.",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.max": "Limit cannot exceed 100 items per page.",
    "number.min": "Limit must be at least 1.",
  }),

  sortBy: Joi.string().valid("createdAt", "startTerm", "endTerm", "position").default("createdAt").messages({
    "any.only": "You can only sort by createdAt, startTerm, endTerm, or position.",
  }),

  order: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "Order must be either 'asc' or 'desc'.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<OfficerIdParam>} */
const getOfficerByIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.base": "ID must be a string",
    "string.hex": "ID must be a valid hexadecimal value",
    "string.length": "ID must be a valid ObjectId",
    "any.required": "ID is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<OfficerIdParam>} */
const deleteOfficerSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.base": "ID must be a string",
    "string.hex": "ID must be a valid hexadecimal value",
    "string.length": "ID must be a valid ObjectId",
    "any.required": "ID is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<UpdateOfficerBody>} */
const updateOfficerSchema = Joi.object({
  userId: Joi.string().hex().length(24).messages({
    "string.hex": "User ID must be a valid ObjectId",
    "string.length": "User ID must be 24 characters long",
  }),

  orgId: Joi.string().hex().length(24).messages({
    "string.hex": "Organization ID must be a valid ObjectId",
    "string.length": "Organization ID must be 24 characters long",
  }),
  position: Joi.string()
    .max(50)
    .trim()
    .valid(...ALL_OFFICER_POSITIONS)
    .messages({
      "string.base": "Position must be a string",
      "string.max": "Position cannot exceed 50 characters",
      "any.only": "Position is not a valid officer position",
    }),
  startTerm: Joi.date().messages({
    "date.base": "Start term must be a valid date",
  }),

  endTerm: Joi.date().messages({
    "date.base": "End term must be a valid date",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be updated",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

/** @type {Joi.ObjectSchema<OfficersStatsQuery>} */
const getOfficersStatsByPeriodSchema = Joi.object({
  period: Joi.string().valid("month", "quarter", "year").default("month").messages({
    "any.only": "Period must be one of: month, quarter, year",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<OfficersNearTermEndQuery>} */
const getOfficersNearTermEndSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30).messages({
    "number.base": "Days must be a number",
    "number.min": "Days must be at least 1",
    "number.max": "Days cannot exceed 365",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export { createOfficerSchema, getOfficersSchema, getOfficerByIdSchema, updateOfficerSchema, getOfficersStatsByPeriodSchema, getOfficersNearTermEndSchema, deleteOfficerSchema };
