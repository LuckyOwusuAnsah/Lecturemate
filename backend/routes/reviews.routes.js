// backend/routes/reviewRoutes.js
import express from 'express';
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { createReview, getCourseReviews } from '../controllers/review.controller.js';

const reviewRouter = express.Router();

reviewRouter.route('/:courseId')
  .get(getCourseReviews) // Get all reviews for a specific course
  .post(protect, authorizeRoles('student', 'educator'), createReview); // Submit a review (only by enrolled students)

export default reviewRouter;