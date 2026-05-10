import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin || !(await admin.correctPassword(password, admin.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const adminData = admin.toObject();
  delete adminData.password;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      admin: adminData,
    },
  });
});

export { login };
