import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const requireAuth = catchAsync(async (req, res, next) => {
  // 1. Check if the token exists in the headers
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please provide a valid token.', 401));
  }

  // 2. Verify the token using your secret key
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Find the Admin in the database using the ID from the token
  // (Copilot usually saves the ID as either `id` or `_id` in the token payload)
  const currentUser = await Admin.findById(decoded.id || decoded._id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 4. Attach the full user object (which includes their role) to the request
  req.user = currentUser;
  
  // 5. Move to the next middleware (which is rbac.js)
  next();
});

export default requireAuth;