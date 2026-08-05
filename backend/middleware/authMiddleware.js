import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User from '../models/UserModel.js'
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.jwt;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});


const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user?.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Access Denied - Admins only");
  }
});


const authorizeRoles = (allowedRoles) => asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, user information missing.");
  }

  // Check if the authenticated user's role is included in the allowedRoles array
  if (allowedRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403); // Forbidden
    throw new Error(`Access Denied - Role (${req.user.role}) is not authorized to access this resource.`);
  }
});

// Blocks an educator from real educator actions (creating/publishing courses,
// grading, analytics, student wellness) until an admin has approved their
// account. Must run after authorizeRoles(['educator']).
const requireApprovedEducator = asyncHandler(async (req, res, next) => {
  if (req.user?.status !== "approved") {
    res.status(403);
    throw new Error(
      req.user?.status === "rejected"
        ? "Your educator application was not approved. Please contact support."
        : "Your educator account is still pending admin approval."
    );
  }
  next();
});

export {
  protect,
  adminOnly,
  authorizeRoles,
  requireApprovedEducator,
};
