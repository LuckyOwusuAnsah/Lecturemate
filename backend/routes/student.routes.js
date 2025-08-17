import express from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  completeStudentOnboarding,
  getStudentCourses,
  enrollInCourse,
  getLearningProgress,
  markLectureComplete,
} from "../controllers/student.controller.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const studentRouter = express.Router();

// All routes are protected and require student role
studentRouter.use(protect);
studentRouter.use(authorizeRoles(["student", "educator"]));

// @route   GET /api/students/profile
studentRouter.get("/profile", getStudentProfile);

// @route   PUT /api/students/profile
studentRouter.put("/profile", updateStudentProfile);

// @route   POST /api/students/onboarding
studentRouter.post("/onboarding", completeStudentOnboarding);

// @route   GET /api/students/courses
studentRouter.get("/courses", getStudentCourses);

// @route   POST /api/students/enroll
studentRouter.post("/enroll", enrollInCourse);

// @route   GET /api/students/progress/:courseId
studentRouter.get("/progress/:courseId", getLearningProgress);

// @route   PUT /api/students/enrollments/:enrollmentId/complete-lecture
studentRouter.route("/enrollments/:enrollmentId/complete-lecture").put(protect, markLectureComplete);


export default studentRouter;
