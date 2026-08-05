import express from "express";
import {
  getEducatorProfile,
  updateEducatorProfile,
  completeEducatorOnboarding,
  uploadSampleContent,
  getTeachingTools,
  createCourse,
  updateCourse,
  getMyCourses,
  requestApproval,
  getEducatorAnalytics,
  getEducatorDashboardStats,
  getStudentsWellness,
  getMyCourseById,
} from "../controllers/educator.controller.js";
import {
  createQuiz,
  getAttemptsForQuiz,
  gradeShortAnswers,
} from "../controllers/quizController.js";
import {
  sendMessageToStudent,
  getConversationWithStudent,
} from "../controllers/privateMessageController.js";
import { protect, authorizeRoles, requireApprovedEducator } from "../middleware/authMiddleware.js";
const educatorRouter = express.Router();
import upload from "../middleware/uploadMiddleware.js";
// All educator routes are protected and must have role = 'educator'
educatorRouter.use(protect, authorizeRoles(["educator"]));

// Educator profile — available regardless of approval status
educatorRouter.get("/profile", getEducatorProfile);
educatorRouter.put("/profile", updateEducatorProfile);

// Onboarding — must remain open pre-approval, this is how approval is requested
educatorRouter.post("/onboarding", upload.none(), completeEducatorOnboarding);

// Sample content upload
educatorRouter.post("/upload-sample", uploadSampleContent);

// Teaching tools
educatorRouter.get("/tools", getTeachingTools);

// Approval request (optional)
educatorRouter.post("/request-approval", requestApproval);

educatorRouter.get("/my-courses", getMyCourses);
// Scoped single-course lookup — only ever returns a course owned by the
// requesting educator, unlike the public /api/courses/:id endpoint.
educatorRouter.get("/courses/:courseId", getMyCourseById);

// --- Everything below requires an admin-approved educator account ---

// Courses
educatorRouter.post("/courses", requireApprovedEducator, upload.single('thumbnail'), createCourse);
educatorRouter.put("/courses/:courseId", requireApprovedEducator, upload.single('thumbnail'), updateCourse);
educatorRouter.get('/dashboard-stats', requireApprovedEducator, getEducatorDashboardStats);

// Quizzes
educatorRouter.post("/courses/:courseId/quizzes", requireApprovedEducator, createQuiz);
educatorRouter.get("/quizzes/:quizId/attempts", requireApprovedEducator, getAttemptsForQuiz);
educatorRouter.put("/attempts/:attemptId/grade", requireApprovedEducator, gradeShortAnswers);

educatorRouter.get('/analytics', requireApprovedEducator, getEducatorAnalytics);

// Student wellness overview (mood trends for students enrolled in this educator's courses)
educatorRouter.get('/students/wellness', requireApprovedEducator, getStudentsWellness);

// Private messages to a specific student (e.g. checking in on a flagged student)
educatorRouter.post('/students/:studentId/messages', requireApprovedEducator, sendMessageToStudent);
educatorRouter.get('/students/:studentId/messages', requireApprovedEducator, getConversationWithStudent);

export default educatorRouter;
