/**
 * Async Handler Middleware
 *
 * Wraps async route handlers to automatically catch errors and forward them
 * to the Express error handler. This eliminates the need for try/catch blocks
 * in every async route handler.
 *
 * Usage:
 *   const { asyncHandler } = require('../middleware/asyncHandler');
 *   router.get('/path', asyncHandler(async (req, res) => {
 *     // async code that can throw
 *   }));
 */

/**
 * Wrap an async function to catch errors and pass to next()
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Wrap an async function with custom error transformation
 * @param {Function} fn - Async route handler function
 * @param {Function} errorTransformer - Optional function to transform errors
 * @returns {Function} Express middleware function
 */
const asyncHandlerWithTransform = (fn, errorTransformer) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    if (errorTransformer) {
      next(errorTransformer(error));
    } else {
      next(error);
    }
  });
};

module.exports = {
  asyncHandler,
  asyncHandlerWithTransform
};
