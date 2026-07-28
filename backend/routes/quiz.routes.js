import express from "express";
import {
  getQuizzesForCourse,
  getQuiz,
  submitQuizAttempt,
  getMyAttempt,
} from "../controllers/quizController.js";
import { protect } from "../middleware/authMiddleware.js";

const quizRouter = express.Router();

// All quiz routes require a logged-in user; answer-key sanitization inside
// the controller (not role gating) is what keeps students from seeing answers.
quizRouter.use(protect);

// @route   GET /api/quizzes/course/:courseId
quizRouter.get("/course/:courseId", getQuizzesForCourse);

// @route   GET /api/quizzes/:quizId
quizRouter.get("/:quizId", getQuiz);

// @route   POST /api/quizzes/:quizId/attempts
quizRouter.post("/:quizId/attempts", submitQuizAttempt);

// @route   GET /api/quizzes/:quizId/my-attempt
quizRouter.get("/:quizId/my-attempt", getMyAttempt);

export default quizRouter;
