// @ts-check
import Joi from "joi";

/** @typedef {{ eventId: string; createdBy: string; }} CreateCalendarEntryBody */
/** @typedef {{ page?: number | undefined; limit?: number | undefined; sortBy?: "createdAt" | "dateAdded" | undefined; order?: "asc" | "desc" | undefined; eventId?: string | undefined; createdBy?: string | undefined; }} GetCalendarEntriesQuery */
/** @typedef {{ eventId: string; createdBy: string; }} UpdateCalendarEntryBody */
/** @typedef {{ id: string; }} CalendarEntryIdParam */

/** @type {Joi.ObjectSchema<CreateCalendarEntryBody>} */
const createCalendarEntrySchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Event ID must be a valid hexadecimal string",
    "string.length": "Event ID must be exactly 24 characters",
    "any.required": "Event ID is required",
  }),
  createdBy: Joi.string().hex().length(24).required().messages({
    "string.hex": "User ID must be a valid hexadecimal string",
    "string.length": "User ID must be exactly 24 characters",
    "any.required": "User ID is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetCalendarEntriesQuery>} */
const getCalendarEntriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be a whole number",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be a whole number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  sortBy: Joi.string().valid("createdAt", "dateAdded").default("createdAt").messages({
    "string.base": "Sort field must be a string",
    "any.only": "Sort field must be either 'createdAt' or 'dateAdded'",
  }),

  order: Joi.string().valid("asc", "desc").default("desc").messages({
    "string.base": "Order must be a string",
    "any.only": "Order must be either 'asc' or 'desc'",
  }),

  eventId: Joi.string().hex().length(24).optional().messages({
    "string.base": "Event ID must be a string",
    "string.hex": "Event ID must be a valid hexadecimal string",
    "string.length": "Event ID must be exactly 24 characters",
  }),

  createdBy: Joi.string().hex().length(24).optional().messages({
    "string.base": "User ID must be a string",
    "string.hex": "User ID must be a valid hexadecimal string",
    "string.length": "User ID must be exactly 24 characters",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<UpdateCalendarEntryBody>} */
const updateCalendarEntrySchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Event ID must be a valid MongoDB ObjectId",
    "string.length": "Event ID must be 24 characters",
    "any.required": "Event ID is required",
  }),
  createdBy: Joi.string().hex().length(24).required().messages({
    "string.hex": "Creator ID must be a valid MongoDB ObjectId",
    "string.length": "Creator ID must be 24 characters",
    "any.required": "Creator ID is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<CalendarEntryIdParam>} */
const deleteCalendarEntrySchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "any.required": "id is required",
    "string.length": "id must be a 24-character hex string",
    "string.hex": "id must be a valid hexadecimal string",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<CalendarEntryIdParam>} */
const getCalendarEntryByIdSchema = Joi.object({
  id: Joi.string().length(24).hex().required().messages({
    "any.required": "id is required",
    "string.length": "id must be a 24-character hex string",
    "string.hex": "id must be a valid hexadecimal string",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export { createCalendarEntrySchema, getCalendarEntriesSchema, updateCalendarEntrySchema, deleteCalendarEntrySchema, getCalendarEntryByIdSchema };
