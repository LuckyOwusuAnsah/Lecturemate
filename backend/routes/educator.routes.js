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
} from "../controllers/educator.controller.js";
import {
  createQuiz,
  getAttemptsForQuiz,
  gradeShortAnswers,
} from "../controllers/quizController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
const educatorRouter = express.Router();
import upload from "../middleware/uploadMiddleware.js"; 
// All educator routes are protected and must have role = 'educator'
educatorRouter.use(protect, authorizeRoles(["educator"]));

// Educator profile
educatorRouter.get("/profile", getEducatorProfile);
educatorRouter.put("/profile", updateEducatorProfile);

// Onboarding
educatorRouter.post("/onboarding", upload.none(), completeEducatorOnboarding);

// Sample content upload
educatorRouter.post("/upload-sample", uploadSampleContent);

// Teaching tools
educatorRouter.get("/tools", getTeachingTools);


// Courses
educatorRouter.post("/courses", upload.single('thumbnail'), createCourse);
educatorRouter.put("/courses/:courseId", upload.single('thumbnail'), updateCourse);
educatorRouter.get("/my-courses", getMyCourses);
educatorRouter.get('/dashboard-stats', getEducatorDashboardStats);

// Quizzes
educatorRouter.post("/courses/:courseId/quizzes", createQuiz);
educatorRouter.get("/quizzes/:quizId/attempts", getAttemptsForQuiz);
educatorRouter.put("/attempts/:attemptId/grade", gradeShortAnswers);

// Approval request (optional)
educatorRouter.post("/request-approval", requestApproval);

educatorRouter.get('/analytics', getEducatorAnalytics);

export default educatorRouter;
