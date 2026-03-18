// @ts-check
import Joi from "joi";

/** @typedef {Object} CreateOrganizationBody @property {string} orgName @property {string} [description] @property {string} adviserId */
/** @typedef {Object} GetOrganizationsQuery @property {number} [page=1] @property {number} [limit=10] @property {string} [sort="-createdAt"] @property {string} [fields] @property {string} [orgName] @property {string} [adviserId] */
/** @typedef {Object} OrganizationIdParam @property {string} orgId */
/** @typedef {Object} UpdateOrganizationBody @property {string} [orgName] @property {string} [description] @property {string} [adviserId] */

/** @type {Joi.ObjectSchema<CreateOrganizationBody>} */
const createOrganizationSchema = Joi.object({
  orgName: Joi.string().max(100).required().trim().messages({
    "string.base": "Organization name must be a string",
    "string.empty": "Organization name cannot be empty",
    "string.max": "Organization name cannot exceed 100 characters",
    "any.required": "Organization name is required",
  }),
  description: Joi.string().max(2000).trim().empty("").default("This organization has no description yet.").messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 2000 characters",
  }),
  adviserId: Joi.string().hex().length(24).required().messages({
    "string.base": "Adviser ID must be a string",
    "string.hex": "Adviser ID must be a valid hexadecimal value",
    "string.length": "Adviser ID must be exactly 24 characters long",
    "any.required": "Adviser ID is required",
    "string.empty": "Adviser ID cannot be empty",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<GetOrganizationsQuery>} */
const getOrganizationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.min": "Limit cannot be less than 1",
    "number.max": "Limit cannot exceed 100",
  }),
  sort: Joi.string().default("-createdAt"),
  fields: Joi.string(),
  orgName: Joi.string().messages({
    "string.base": "Organization name must be text",
  }),
  adviserId: Joi.string().hex().length(24).messages({
    "string.hex": "Adviser ID must be a valid hexadecimal string",
    "string.length": "Adviser ID must be exactly 24 characters long",
  }),
}).options({
  abortEarly: false,
  stripUnknown: true,
});

/** @type {Joi.ObjectSchema<OrganizationIdParam>} */
const orgIdSchema = Joi.object({
  orgId: Joi.string().hex().length(24).required().messages({
    "string.base": "Organization ID must be a string",
    "string.hex": "Organization ID must be a valid hexadecimal value",
    "string.length": "Organization ID must be exactly 24 characters long",
    "any.required": "Organization ID is required",
    "string.empty": "Organization ID cannot be empty",
  }),
});

/** @type {Joi.ObjectSchema<UpdateOrganizationBody>} */
const updateOrganizationSchema = Joi.object({
  orgName: Joi.string().max(100).trim().messages({
    "string.base": "Organization name must be a string",
    "string.max": "Organization name cannot be more than 100 characters",
    "string.empty": "Organization name cannot be empty",
  }),

  description: Joi.string().max(2000).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot be more than 2000 characters",
  }),

  adviserId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid Adviser ID format. It should be a 24-character hexadecimal string",
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

export { createOrganizationSchema, getOrganizationsSchema, updateOrganizationSchema, orgIdSchema };
