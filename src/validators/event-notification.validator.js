// @ts-check
import Joi from "joi";

/** @typedef {{ eventId: string; recipientId: string; message: string; status?: "sent" | "failed"; sentAt: Date; }} CreateEventNotificationBody */
/** @typedef {{ eventId: string; recipientIds: string[]; message: string; status?: "sent" | "read" | undefined; }} CreateBulkEventNotificationBody */
/** @typedef {{ eventId?: string; recipientId?: string; status?: "sent" | "read"; sortBy?: "sentAt" | "createdAt" | "updatedAt" | "status"; order?: "asc" | "desc"; fields?: string; limit?: number; page?: number; }} GetEventNotificationsQuery */
/** @typedef {{ eventId: string; }} EventIdParam */
/** @typedef {{ id: string; }} EventNotificationIdParam */
/** @typedef {{ message?: string; status?: "sent" | "failed"; }} UpdateEventNotificationBody */

/** @type {Joi.ObjectSchema<CreateEventNotificationBody>} */
const createEventNotificationSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Event ID must be a valid MongoDB ObjectId",
    "string.length": "Event ID must be 24 characters",
    "any.required": "Event ID is required",
  }),
  recipientId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Recipient ID must be a valid MongoDB ObjectId",
    "string.length": "Recipient ID must be 24 characters",
    "any.required": "Recipient ID is required",
  }),
  message: Joi.string().max(2000).required().messages({
    "string.max": "Message cannot exceed 2000 characters",
    "any.required": "Message is required",
  }),
  status: Joi.string().valid("sent", "failed").default("sent").messages({
    "any.only": "Status must be either 'sent' or 'failed'",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<CreateBulkEventNotificationBody>} */
const createBulkEventNotificationSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Event ID must be a valid MongoDB ObjectId",
    "string.length": "Event ID must be 24 characters",
    "any.required": "Event ID is required",
  }),
  recipientIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required().messages({
    "array.base": "Recipient IDs must be an array",
    "array.min": "At least one recipient ID is required",
    "any.required": "Recipient IDs are required",
    "string.hex": "Each recipient ID must be a valid MongoDB ObjectId",
    "string.length": "Each recipient ID must be 24 characters",
  }),
  message: Joi.string().max(2000).required().messages({
    "string.max": "Message cannot exceed 2000 characters",
    "any.required": "Message is required",
  }),
  status: Joi.string().valid("sent", "read").default("sent").messages({
    "any.only": "Status must be either 'sent' or 'read'",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetEventNotificationsQuery>} */
const getEventNotificationsSchema = Joi.object({
  eventId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "Event ID must be a valid hex string",
    "string.length": "Event ID must be 24 characters long",
  }),
  recipientId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "Recipient ID must be a valid hex string",
    "string.length": "Recipient ID must be 24 characters long",
  }),
  status: Joi.string().valid("sent", "read").optional().messages({
    "any.only": 'Status must be either "sent" or "read"',
  }),
  sortBy: Joi.string().valid("sentAt", "createdAt", "updatedAt", "status").optional().default("sentAt").messages({
    "any.only": "sortBy must be one of: sentAt, createdAt, updatedAt, status",
  }),
  order: Joi.string().valid("asc", "desc").optional().default("desc").messages({
    "any.only": 'order must be either "asc" or "desc"',
  }),
  fields: Joi.string().optional().messages({
    "string.base": "Fields must be a string",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<EventIdParam>} */
const eventIdSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Event ID must be a valid MongoDB ObjectId",
    "string.length": "Event ID must be 24 characters long",
    "any.required": "Event ID is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<EventNotificationIdParam>} */
const getEventNotificationByIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Notification ID must be a valid hex string",
    "string.length": "Notification ID must be 24 characters long",
    "any.required": "Notification ID is required",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<UpdateEventNotificationBody>} */
const updateEventNotificationSchema = Joi.object({
  message: Joi.string().max(2000).messages({
    "string.max": "Message cannot exceed 2000 characters",
  }),
  status: Joi.string().valid("sent", "failed", "read").messages({
    "any.only": "Status must be either 'sent' or 'read'",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<EventNotificationIdParam>} */
const eventNotificationIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid notification ID format",
      "any.required": "Notification ID is required",
    }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export { createEventNotificationSchema, eventIdSchema, updateEventNotificationSchema, createBulkEventNotificationSchema, eventNotificationIdSchema, getEventNotificationsSchema, getEventNotificationByIdSchema };
