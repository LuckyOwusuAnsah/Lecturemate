// backend/controllers/reviewController.js
import asyncHandler from 'express-async-handler';
import Review from '../models/ReviewModel.js';
import Course from '../models/CourseModel.js';
import Enrollment from '../models/EnrollmentModel.js'; // To check if student is enrolled

// @desc    Get all reviews for a course
// @route   GET /api/reviews/:courseId
// @access  Public
export const getCourseReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ course: req.params.courseId }).populate('user', 'name email'); // Populate student info
  res.json(reviews);
});

// @desc    Create a new review
// @route   POST /api/reviews/:courseId
// @access  Private (Student)
export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { courseId } = req.params;

  // Check if user is logged in and is a student
  if (!req.user || req.user.role !== 'student' || req.user.role !== 'educator') {
    res.status(401);
    throw new Error('Not authorized as a student to review.');
  }

  // Check if the student is enrolled in the course
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    isCompleted: true // Only allow reviews for completed courses
  });

  if (!enrollment) {
    res.status(400);
    throw new Error('You must be enrolled in and have completed this course to leave a review.');
  }

  // Check if student has already reviewed this course
  const alreadyReviewed = await Review.findOne({
    course: courseId,
    user: req.user._id,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('You have already reviewed this course.');
  }

  const review = await Review.create({
    course: courseId,
    user: req.user._id,
    rating,
    comment,
  });

  res.status(201).json(review);
});