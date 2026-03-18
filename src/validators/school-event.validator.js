// @ts-check
import Joi from "joi";

/** @typedef {{ title: string, description?: string | undefined, date: string, venue: string, organizedBy: "admin" | "department" }} CreateSchoolEventBody */
/** @typedef {{ id: string }} EventIdParams */
/** @typedef {{ startDate: string | Date, endDate: string | Date }} FilterEventsQuery */
/** @typedef {{ page?: number, limit?: number, title?: string, venue?: string, organizedBy?: "admin" | "department", date?: string, type?: "all" | "upcoming" | "past", sortBy?: "date" | "createdAt" | "title", order?: "asc" | "desc", paginate?: boolean }} GetAllSchoolEventsQuery */
/** @typedef {{ year?: number | undefined }} GetMonthlyStatsQuery */
/** @typedef {{ limit?: number }} GetRecentEventsQuery */
/** @typedef {{ title?: string | undefined, description?: string | undefined, date?: string | undefined,  venue?: string | undefined, organizedBy?: "admin" | "department" | undefined }} UpdateSchoolEventBody */

/** @type {Joi.ObjectSchema<CreateSchoolEventBody>} */
const createSchoolEventSchema = Joi.object({
  title: Joi.string().max(100).required().messages({
    "string.empty": "The event title cannot be empty.",
    "string.max": "Keep the title under 100 characters, please.",
    "any.required": "A title is required for this event.",
  }),

  description: Joi.string().max(2000).optional().messages({
    "string.max": "Description is a bit too long (max 2000 chars).",
  }),

  date: Joi.date().iso().required().messages({
    "date.format": "Please use a valid ISO date format (YYYY-MM-DD).",
    "any.required": "We need a date for the event.",
  }),

  venue: Joi.string().max(150).required().messages({
    "any.required": "Don't forget to tell us where it's happening.",
  }),

  organizedBy: Joi.string().valid("admin", "department").required().messages({
    "any.only": 'Organizer must be either "admin" or "department".',
    "any.required": "Please specify who is organizing this.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<UpdateSchoolEventBody>} */
const filteredUpdateSchema = Joi.object({
  title: Joi.string().max(100).trim().messages({
    "string.max": "Title cannot exceed 100 characters",
  }),
  description: Joi.string().max(2000).allow("").messages({
    "string.max": "Description cannot exceed 2000 characters",
  }),
  date: Joi.date().messages({
    "date.base": "Event date must be a valid date",
  }),
  venue: Joi.string().max(150).trim().messages({
    "string.max": "Venue cannot exceed 150 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

/** @type {Joi.ObjectSchema<GetAllSchoolEventsQuery>} */
const getAllSchoolEventsSchema = Joi.object({
  paginate: Joi.boolean().truthy("true").falsy("false").default(true),

  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number.",
    "number.integer": "Page must be an integer.",
    "number.min": "Page must be at least 1.",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number.",
    "number.integer": "Limit must be an integer.",
    "number.min": "Limit must be at least 1.",
    "number.max": "Limit cannot exceed 100.",
  }),
  title: Joi.string().trim().allow("").messages({
    "string.base": "Title must be a string.",
  }),
  venue: Joi.string().trim().allow("").messages({
    "string.base": "Venue must be a string.",
  }),
  organizedBy: Joi.string().valid("admin", "department").allow("").messages({
    "any.only": "OrganizedBy must be either 'admin' or 'department'.",
    "string.base": "OrganizedBy must be a string.",
  }),
  date: Joi.date().iso().allow(null).messages({
    "date.base": "Date must be a valid date.",
    "date.format": "Date must be in ISO format (YYYY-MM-DD).",
  }),
  type: Joi.string().valid("all", "upcoming", "past").default("all").messages({
    "any.only": "Type must be one of 'all', 'upcoming', or 'past'.",
  }),
  sortBy: Joi.string().valid("date", "createdAt", "title").default("date").messages({
    "any.only": "SortBy must be 'date', 'createdAt', or 'title'.",
  }),
  order: Joi.string().valid("asc", "desc").default("asc").messages({
    "any.only": "Order must be either 'asc' or 'desc'.",
  }),
})
  .unknown(false)
  .options({ stripUnknown: true, abortEarly: false });

/** @type {Joi.ObjectSchema<EventIdParams>} */
const getSchoolEventByIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.base": "Event ID must be a string",
    "string.hex": "Event ID must be a valid hexadecimal value",
    "string.length": "Event ID must be exactly 24 characters long",
    "any.required": "Event ID is required",
    "string.empty": "Event ID cannot be empty",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<FilterEventsQuery>} */
const filterEventsSchema = Joi.object({
  startDate: Joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),
  endDate: Joi.date().required().min(Joi.ref("startDate")).messages({
    "date.base": "End date must be a valid date",
    "any.required": "End date is required",
    "date.min": "End date cannot be earlier than start date",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetMonthlyStatsQuery>} */
const getMonthlyStatsSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).default(new Date().getFullYear()).messages({
    "number.base": "Year must be a number.",
    "number.integer": "Year must be a whole number.",
    "number.min": "Year cannot be earlier than 2000.",
    "number.max": "Year cannot be later than 2100.",
    "any.required": "Year is a required field.",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetRecentEventsQuery>} */
const getRecentlyCreatedEventsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(5).messages({
    "number.base": '"limit" must be a number',
    "number.integer": '"limit" must be an integer',
    "number.min": '"limit" must be at least {#limit}',
    "number.max": '"limit" must be less than or equal to {#limit}',
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<UpdateSchoolEventBody>} */
const updateEventSchema = Joi.object({
  title: Joi.string().max(100).trim().messages({
    "string.max": "Title cannot exceed 100 characters",
  }),
  description: Joi.string().max(2000).allow("").messages({
    "string.max": "Description cannot exceed 2000 characters",
  }),
  date: Joi.date().messages({
    "date.base": "Event date must be a valid date",
  }),
  venue: Joi.string().max(150).trim().messages({
    "string.max": "Venue cannot exceed 150 characters",
  }),
  organizedBy: Joi.string().valid("admin", "department").trim().messages({
    "any.only": "Organizer must be either 'admin' or 'department'",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

/** @type {Joi.ObjectSchema<EventIdParams>} */
const deleteSchoolEventSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.base": "Event ID must be a string",
    "string.hex": "Event ID must be a valid hexadecimal value",
    "string.length": "Event ID must be exactly 24 characters long",
    "any.required": "Event ID is required",
    "string.empty": "Event ID cannot be empty",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export { createSchoolEventSchema, getAllSchoolEventsSchema, getSchoolEventByIdSchema, filterEventsSchema, getMonthlyStatsSchema, getRecentlyCreatedEventsSchema, filteredUpdateSchema, updateEventSchema, deleteSchoolEventSchema };
