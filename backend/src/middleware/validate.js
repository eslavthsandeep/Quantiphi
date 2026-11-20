'use strict';

/**
 * Zod-based request body validation middleware factory.
 * @param {import('zod').ZodTypeAny} schema - The Zod schema to validate against.
 * @returns {import('express').RequestHandler}
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }

    const firstError = result.error.errors[0];
    const message = firstError
      ? `${firstError.path.join('.') || 'body'}: ${firstError.message}`
      : 'Validation failed';

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    });
  };
}

module.exports = { validateBody };
