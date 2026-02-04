const Joi = require("joi");

const askSchema = Joi.object({
  level: Joi.string()
    .valid("easy", "medium", "hard")
    .default("medium"),

  count: Joi.number()
    .integer()
    .min(5)
    .max(80)
    .default(40),

  seed: Joi.string().optional()
});

module.exports = askSchema;
