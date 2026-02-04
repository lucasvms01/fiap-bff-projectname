const Joi = require("joi");

const validateSchema = Joi.object({
  text: Joi.string()
    .min(2)
    .max(500)
    .required()
});

module.exports = validateSchema;
