import asyncHandler from "express-async-handler";
import StudentProfile from "../models/StudentProfileModel.js";
import Enrollment from "../models/EnrollmentModel.js";
import Course from "../models/CourseModel.js";
import User from "../models/UserModel.js";
import { logActivity } from "../utils/logActivity.js";

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private
export const getStudentProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id }).populate("user", "-password");
  if (!profile) {
    res.status(404);
    throw new Error("Student profile not found");
  }
  res.status(200).json(profile);
});

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private
export const updateStudentProfile = asyncHandler(async (req, res) => {
  const updates = req.body;
  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );
  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }
  res.status(200).json(profile);
});

// @desc    Complete onboarding
// @route   POST /api/students/onboarding
// @access  Private
export const completeStudentOnboarding = asyncHandler(async (req, res) => {
  const {
    university,
    major,
    semester,
    studyStyle,
    studyTime,
    learningStyles,
    goals,
    disciplines,
  } = req.body;

  const profile = await StudentProfile.create({
    user: req.user._id,
    university,
    major,
    semester,
    studyStyle,
    studyTime,
    learningStyles,
    goals,
    disciplines,
  });

  res.status(201).json(profile);
});

// @desc    Get all courses a student is enrolled in
// @route   GET /api/students/courses
// @access  Private
export const getStudentCourses = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).populate("course");
  res.status(200).json(enrollments);
});

// @desc    Enroll in a course
// @route   POST /api/students/enroll/:courseId
// @access  Private
export const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const alreadyEnrolled = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });

  if (alreadyEnrolled) {
    res.status(400);
    throw new Error("Already enrolled in this course");
  }

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: courseId,
    progress: 0,
  });

        // Log activity
  await logActivity(req.user._id, "Enroll", `Enrolled in ${course.title}`);

  res.status(201).json(enrollment);
});

// @desc    Get learning progress for a course
// @route   GET /api/students/progress/:courseId
// @access  Private
export const getLearningProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const enrollment = await Enrollment.findOne({
    student: req.user._id, // Assuming 'student' field in Enrollment model stores user._id
    course: courseId,
  }).select("progress completedLectures isCompleted");

  if (!enrollment) {
    // If enrollment is not found, return 200 OK with isEnrolled: false
    // This allows the frontend to distinguish between 'not enrolled' and a true server error.
    return res.status(200).json({ isEnrolled: false, message: "User is not enrolled in this course." });
  }

  // If enrolled, return isEnrolled: true and the enrollment details
  res.status(200).json({ isEnrolled: true, enrollment });
});

// @desc    Mark a lecture as complete and update course progress
// @route   PUT /api/students/enrollments/:enrollmentId/complete-lecture
// @access  Private
export const markLectureComplete = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { lectureId } = req.body; // The ID of the lecture to mark complete

  if (!lectureId) {
    res.status(400);
    throw new Error("Lecture ID is required to mark complete.");
  }

  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found.");
  }

  // Ensure the logged-in user owns this enrollment
  if (enrollment.student.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to update this enrollment.");
  }

  // Check if lecture is already completed
  if (enrollment.completedLectures.includes(lectureId)) {
    res.status(400);
    throw new Error("Lecture already marked complete.");
  }

  // Add lectureId to completedLectures array
  enrollment.completedLectures.push(lectureId);

  // --- Calculate new progress percentage ---
  // To do this accurately, we need the total number of lectures in the course.
  // This requires fetching the associated course.
  const course = await Course.findById(enrollment.course);

  if (!course) {
    res.status(404);
    throw new Error("Associated course not found for enrollment.");
  }

  let totalLectures = 0;
  course.chapters.forEach(chapter => {
    totalLectures += chapter.lectures.length;
  });

  if (totalLectures === 0) {
    enrollment.progress = 0; // Avoid division by zero
  } else {
    enrollment.progress = (enrollment.completedLectures.length / totalLectures) * 100;
  }

  // Mark course as completed if all lectures are done
  if (enrollment.completedLectures.length === totalLectures && totalLectures > 0) {
    enrollment.isCompleted = true;
  }

  await enrollment.save();

        // Log activity
      await logActivity(req.user._id, "Complete", `Completed ${course.title}`);

  res.status(200).json(enrollment); // Return the updated enrollment object
});

// @desc    Get the logged-in student's wishlisted courses
// @route   GET /api/student/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");
  res.status(200).json(user.wishlist);
});

// @desc    Add a course to the logged-in student's wishlist
// @route   POST /api/student/wishlist/:courseId
// @access  Private
export const addToWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishlist: courseId } },
    { new: true }
  ).populate("wishlist");

  res.status(200).json(user.wishlist);
});

// @desc    Remove a course from the logged-in student's wishlist
// @route   DELETE /api/student/wishlist/:courseId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishlist: courseId } },
    { new: true }
  ).populate("wishlist");

  res.status(200).json(user.wishlist);
});
