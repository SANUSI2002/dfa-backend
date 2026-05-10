/**
 * Wrapper function for async route handlers
 * Catches any errors thrown and passes them to the error handling middleware
 * @param {Function} fn - The async controller function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
