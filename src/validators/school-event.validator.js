// @ts-check
import Joi from "joi";

/** @typedef {{ title: string, objective?: string, allDay?: boolean, startDate: string, endDate: string, startTime?: string, endTime?: string, venue: string, organizedBy: "admin" | "department" }} CreateSchoolEventBody */
/** @typedef {{ id: string }} EventIdParams */
/** @typedef {{ startDate: string | Date, endDate: string | Date }} FilterEventsQuery */
/** @typedef {{ page?: number, limit?: number, title?: string, venue?: string, organizedBy?: "admin" | "department", startDate?: string, type?: "all" | "upcoming" | "past", sortBy?: "startDate" | "createdAt" | "title", order?: "asc" | "desc", paginate?: boolean }} GetAllSchoolEventsQuery */
/** @typedef {{ year?: number | undefined }} GetMonthlyStatsQuery */
/** @typedef {{ limit?: number }} GetRecentEventsQuery */
/** @typedef {{ title?: string, objective?: string, allDay?: boolean, startDate?: string, endDate?: string, startTime?: string, endTime?: string, venue?: string, organizedBy?: "admin" | "department" }} UpdateSchoolEventBody */

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** @type {Joi.ObjectSchema<CreateSchoolEventBody>} */
const createSchoolEventSchema = Joi.object({
  title: Joi.string().max(100).required(),
  objective: Joi.string().max(2000).optional(),
  allDay: Joi.boolean().default(false),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
  startTime: Joi.string().pattern(timeRegex).when("allDay", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  endTime: Joi.string().pattern(timeRegex).when("allDay", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  venue: Joi.string().max(150).required(),
  organizedBy: Joi.string().valid("admin", "department").required(),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetAllSchoolEventsQuery>} */
const getAllSchoolEventsSchema = Joi.object({
  paginate: Joi.boolean().truthy("true").falsy("false").default(true),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  title: Joi.string().trim().allow(""),
  venue: Joi.string().trim().allow(""),
  organizedBy: Joi.string().valid("admin", "department").allow(""),
  startDate: Joi.date().iso().allow(null),
  type: Joi.string().valid("all", "upcoming", "past").default("all"),
  sortBy: Joi.string().valid("startDate", "createdAt", "title").default("startDate"),
  order: Joi.string().valid("asc", "desc").default("asc"),
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
  startDate: Joi.date().required(),
  endDate: Joi.date().required().min(Joi.ref("startDate")),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetMonthlyStatsQuery>} */
const getMonthlyStatsSchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).default(new Date().getFullYear()),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetRecentEventsQuery>} */
const getRecentlyCreatedEventsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(5),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<UpdateSchoolEventBody>} */
const updateEventSchema = Joi.object({
  title: Joi.string().max(100).trim(),
  objective: Joi.string().max(2000).allow("").trim(),
  allDay: Joi.boolean(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref("startDate")),
  startTime: Joi.string().pattern(timeRegex),
  endTime: Joi.string().pattern(timeRegex),
  venue: Joi.string().max(150).trim(),
  organizedBy: Joi.string().valid("admin", "department").trim(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

/** @type {Joi.ObjectSchema<UpdateSchoolEventBody>} */
const filteredUpdateSchema = updateEventSchema;

/** @type {Joi.ObjectSchema<EventIdParams>} */
const deleteSchoolEventSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

export { createSchoolEventSchema, getAllSchoolEventsSchema, getSchoolEventByIdSchema, filterEventsSchema, getMonthlyStatsSchema, getRecentlyCreatedEventsSchema, filteredUpdateSchema, updateEventSchema, deleteSchoolEventSchema };
