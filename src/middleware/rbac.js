import AppError from '../utils/AppError.js';

/**
 * Role-Based Access Control middleware
 * Restricts access to users with specific roles
 * @param  {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware function
 */
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated and has a role
    if (!req.user || !req.user.role) {
      return next(new AppError('User not authenticated or role not assigned', 401));
    }

    // Check if user's role is in allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `You do not have permission to perform this action. Required roles: ${allowedRoles.join(', ')}`,
          403
        )
      );
    }

    next();
  };
};

export default restrictTo;
