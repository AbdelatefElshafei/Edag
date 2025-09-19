const Joi = require('joi');

/**
 * Recursively builds a Joi validation schema from a configuration object.
 * This allows defining validation rules in a simple JSON/YAML format.
 *
 * @param {object} validationRules - An object where keys are field names and values
 *   are objects describing the validation rules for that field.
 * @returns {Joi.ObjectSchema} - The constructed Joi schema.
 *
 * @example
 * const rules = {
 *   name: { type: 'string', required: true },
 *   address: {
 *     type: 'object',
 *     properties: {
 *       street: { type: 'string', required: true },
 *       city: { type: 'string', required: true }
 *     }
 *   }
 * };
 * const schema = buildJoiSchema(rules);
 */
function buildJoiSchema(validationRules) {
  const schema = {};

  for (const field in validationRules) {
    const rules = validationRules[field];
    let validator;

    switch (rules.type) {
      case 'string':
        validator = Joi.string();
        if (rules.email) validator = validator.email();
        if (rules.min) validator = validator.min(rules.min);
        if (rules.max) validator = validator.max(rules.max);
        break;
      case 'number':
        validator = Joi.number();
        if (rules.integer) validator = validator.integer();
        if (rules.min) validator = validator.min(rules.min);
        if (rules.max) validator = validator.max(rules.max);
        break;
      case 'boolean':
        validator = Joi.boolean();
        break;
      case 'array':
        // Note: For simplicity, this assumes an array of simple types.
        // This could be extended to support arrays of complex objects.
        validator = Joi.array();
        if (rules.items && rules.items.type) {
            let itemValidator;
            switch(rules.items.type) {
                case 'string': itemValidator = Joi.string(); break;
                case 'number': itemValidator = Joi.number(); break;
                case 'object': itemValidator = Joi.object(buildJoiSchema(rules.items.properties)); break;
            }
            if (itemValidator) validator = validator.items(itemValidator);
        }
        break;
      case 'object':
        // Recursively build schema for nested objects
        validator = Joi.object(buildJoiSchema(rules.properties));
        break;
      default:
        // Fallback for any other type
        validator = Joi.any();
    }

    if (rules.required) {
      validator = validator.required();
    } else {
      validator = validator.optional();
    }

    schema[field] = validator;
  }
  return schema;
}

/**
 * Creates an Express middleware for request validation.
 * It validates request body, query parameters, and URL parameters based on
 * rules defined in the route configuration.
 *
 * @param {object} validations - The validation configuration for a specific route.
 *   Should contain keys like 'body', 'query', or 'params'.
 * @returns {function} An Express middleware function.
 */
function validationMiddleware(validations) {
  return (req, res, next) => {
    try {
      const validationTargets = [
        { key: 'body', data: req.body },
        { key: 'params', data: req.params },
        { key: 'query', data: req.query },
      ];

      for (const target of validationTargets) {
        if (validations[target.key]) {
          const schema = Joi.object(buildJoiSchema(validations[target.key]));

          const { error, value } = schema.validate(target.data, {
            abortEarly: false, // Report all errors
            stripUnknown: true, // Remove unknown properties
          });

          if (error) {
            const errorMessage = error.details.map(d => d.message).join(', ');
            // Send a standardized error response and stop execution
            return res.status(400).json({
              status: 'error',
              message: `Validation failed: ${errorMessage}`,
              data: null,
            });
          }

          // Replace the original request data with the validated (and possibly sanitized) data
          req[target.key] = value;
        }
      }

      // If all validations pass, proceed to the next middleware or handler
      next();
    } catch (err) {
      // Pass any unexpected errors to the centralized error handler
      next(err);
    }
  };
}

module.exports = { validationMiddleware };