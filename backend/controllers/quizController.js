import asyncHandler from "express-async-handler";
import Quiz from "../models/QuizModel.js";
import QuizAttempt from "../models/QuizAttemptModel.js";
import Course from "../models/CourseModel.js";

// Strips answer-revealing fields before a quiz is sent to anyone other than
// the owning educator/an admin.
const toStudentSafeQuiz = (quiz) => {
  const obj = quiz.toObject ? quiz.toObject() : quiz;
  return {
    ...obj,
    multiple_choice: obj.multiple_choice.map(({ _id, question, options }) => ({
      _id,
      question,
      options,
    })),
    true_false: obj.true_false.map(({ _id, question }) => ({ _id, question })),
    short_answer: obj.short_answer.map(({ _id, question }) => ({ _id, question })),
  };
};

const isOwnerOrAdmin = (quiz, user) =>
  quiz.educator.toString() === user._id.toString() || user.role === "admin";

// @desc    Get quizzes for a course (answers stripped unless caller owns the course/is admin)
// @route   GET /api/quizzes/course/:courseId
// @access  Private
export const getQuizzesForCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const quizzes = await Quiz.find({ course: courseId }).sort({ createdAt: -1 });

  const safeQuizzes = quizzes.map((quiz) =>
    isOwnerOrAdmin(quiz, req.user) ? quiz : toStudentSafeQuiz(quiz)
  );

  res.json(safeQuizzes);
});

// @desc    Get a single quiz (answers stripped unless caller owns the course/is admin)
// @route   GET /api/quizzes/:quizId
// @access  Private
export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  res.json(isOwnerOrAdmin(quiz, req.user) ? quiz : toStudentSafeQuiz(quiz));
});

// @desc    Submit answers for a quiz (one attempt per student per quiz)
// @route   POST /api/quizzes/:quizId/attempts
// @access  Private
export const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length === 0) {
    res.status(400);
    throw new Error("Answers are required");
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  const existingAttempt = await QuizAttempt.findOne({
    quiz: quizId,
    student: req.user._id,
  });
  if (existingAttempt) {
    res.status(400);
    throw new Error("You have already submitted an attempt for this quiz");
  }

  // Grade server-side against the real quiz doc — never trust client-submitted correctness.
  const mcById = new Map(quiz.multiple_choice.map((q) => [q._id.toString(), q]));
  const tfById = new Map(quiz.true_false.map((q) => [q._id.toString(), q]));
  const saIds = new Set(quiz.short_answer.map((q) => q._id.toString()));

  let autoGradedCorrect = 0;
  let autoGradedTotal = 0;

  const gradedAnswers = answers.map(({ questionId, questionType, answer }) => {
    if (questionType === "multiple_choice") {
      const question = mcById.get(String(questionId));
      if (!question) {
        res.status(400);
        throw new Error("Invalid question reference in submitted answers");
      }
      const isCorrect = question.correct_answer === answer;
      autoGradedTotal += 1;
      if (isCorrect) autoGradedCorrect += 1;
      return { questionId, questionType, answer, isCorrect };
    }

    if (questionType === "true_false") {
      const question = tfById.get(String(questionId));
      if (!question) {
        res.status(400);
        throw new Error("Invalid question reference in submitted answers");
      }
      const isCorrect = question.correct_answer === answer;
      autoGradedTotal += 1;
      if (isCorrect) autoGradedCorrect += 1;
      return { questionId, questionType, answer, isCorrect };
    }

    if (questionType === "short_answer" && saIds.has(String(questionId))) {
      return { questionId, questionType, answer, isCorrect: null };
    }

    res.status(400);
    throw new Error("Invalid question reference in submitted answers");
  });

  const manualGradingPending = quiz.short_answer.length > 0;

  const attempt = await QuizAttempt.create({
    quiz: quizId,
    student: req.user._id,
    course: quiz.course,
    answers: gradedAnswers,
    autoGradedCorrect,
    autoGradedTotal,
    manualGradingPending,
    finalScorePercent: manualGradingPending
      ? null
      : autoGradedTotal > 0
      ? Math.round((autoGradedCorrect / autoGradedTotal) * 100)
      : 100,
  });

  res.status(201).json(attempt);
});

// @desc    Get the logged-in student's own attempt/result for a quiz
// @route   GET /api/quizzes/:quizId/my-attempt
// @access  Private
export const getMyAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findOne({
    quiz: req.params.quizId,
    student: req.user._id,
  });
  res.json(attempt || null);
});

// @desc    Publish a generated quiz to a course
// @route   POST /api/educator/courses/:courseId/quizzes
// @access  Private (Educator, must own the course)
export const createQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, multiple_choice = [], true_false = [], short_answer = [] } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("Quiz title is required");
  }

  const course = await Course.findOne({ _id: courseId, educator: req.user._id });
  if (!course) {
    res.status(404);
    throw new Error("Course not found or you do not have permission to add a quiz to it");
  }

  for (const q of multiple_choice) {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      res.status(400);
      throw new Error(`Multiple choice question "${q.question}" needs at least 2 options`);
    }
    if (
      !Number.isInteger(q.correct_answer) ||
      q.correct_answer < 0 ||
      q.correct_answer >= q.options.length
    ) {
      res.status(400);
      throw new Error(`Multiple choice question "${q.question}" has an invalid correct_answer index`);
    }
  }

  for (const q of true_false) {
    if (typeof q.correct_answer !== "boolean") {
      res.status(400);
      throw new Error(`True/false question "${q.question}" needs a boolean correct_answer`);
    }
  }

  const quiz = await Quiz.create({
    title,
    course: courseId,
    educator: req.user._id,
    multiple_choice,
    true_false,
    short_answer,
  });

  res.status(201).json(quiz);
});

// @desc    List all student attempts for a quiz (for grading)
// @route   GET /api/educator/quizzes/:quizId/attempts
// @access  Private (Educator, must own the quiz's course)
export const getAttemptsForQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findOne({ _id: quizId, educator: req.user._id });
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found or you do not have permission to view its attempts");
  }

  const attempts = await QuizAttempt.find({ quiz: quizId }).populate("student", "name email");
  res.json(attempts);
});

// @desc    Grade the short-answer questions of a student's attempt
// @route   PUT /api/educator/attempts/:attemptId/grade
// @access  Private (Educator, must own the quiz's course)
export const gradeShortAnswers = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { grades } = req.body;

  if (!Array.isArray(grades) || grades.length === 0) {
    res.status(400);
    throw new Error("Grades are required");
  }

  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) {
    res.status(404);
    throw new Error("Attempt not found");
  }

  const quiz = await Quiz.findOne({ _id: attempt.quiz, educator: req.user._id });
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found or you do not have permission to grade this attempt");
  }

  const gradeByQuestionId = new Map(grades.map((g) => [String(g.questionId), !!g.isCorrect]));

  attempt.answers.forEach((answer) => {
    if (answer.questionType === "short_answer" && gradeByQuestionId.has(String(answer.questionId))) {
      answer.isCorrect = gradeByQuestionId.get(String(answer.questionId));
    }
  });

  const stillPending = attempt.answers.some((a) => a.isCorrect === null);
  attempt.manualGradingPending = stillPending;

  if (!stillPending) {
    const totalCorrect = attempt.answers.filter((a) => a.isCorrect).length;
    attempt.finalScorePercent =
      attempt.answers.length > 0
        ? Math.round((totalCorrect / attempt.answers.length) * 100)
        : 100;
  }

  await attempt.save();
  await attempt.populate("student", "name email");
  res.json(attempt);
});
