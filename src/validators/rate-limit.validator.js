// @ts-check
import Joi from "joi";

/** @typedef {{ limit: number, windowMs: number, keyGenerator?: (() => string) | undefined }} RateLimiterConfig */

/** @type {Joi.ObjectSchema<RateLimiterConfig>} */
const rateLimiterSchema = Joi.object({
  limit: Joi.number().integer().positive().required().messages({
    "number.base": `"limit" must be a number`,
    "number.integer": `"limit" must be an integer`,
    "number.positive": `"limit" must be greater than 0`,
    "any.required": `"limit" is required`,
  }),

  windowMs: Joi.number().integer().positive().required().messages({
    "number.base": `"windowMs" must be a number (milliseconds)`,
    "number.integer": `"windowMs" must be an integer`,
    "number.positive": `"windowMs" must be greater than 0`,
    "any.required": `"windowMs" is required`,
  }),

  keyGenerator: Joi.function().optional().messages({
    "function.base": `"keyGenerator" must be a function`,
  }),
})
  .required()
  .messages({
    "object.base": "Rate limiter configuration must be an object",
    "any.required": "Rate limiter configuration is required",
  })
  .options({
    abortEarly: false,
    stripUnknown: true,
  });

export { rateLimiterSchema };
