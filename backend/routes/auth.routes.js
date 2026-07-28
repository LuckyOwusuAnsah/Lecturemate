import express from "express";
import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  completeOnboarding,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimiter.js";

const authRouter = express.Router();

// Max 5 requests per 15 minutes per IP for password-reset endpoints
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests. Please try again in 15 minutes.",
});

// @route   POST /api/auth/register
authRouter.post("/register", register);

// @route   POST /api/auth/login
authRouter.post("/login", login);

// @route   POST /api/auth/logout
authRouter.post("/logout", logout);

// @route   POST /api/auth/forgot-password
authRouter.post("/forgot-password", forgotPasswordLimiter, forgotPassword);

// @route   PUT /api/auth/reset-password/:resetToken
authRouter.put("/reset-password/:resetToken", forgotPasswordLimiter, resetPassword);
authRouter.put('/complete-onboarding', protect, completeOnboarding);

authRouter.get("/me", protect, (req, res) => {
  res.status(200).json(req.user); // this returns the logged-in user
});
export default authRouter;
