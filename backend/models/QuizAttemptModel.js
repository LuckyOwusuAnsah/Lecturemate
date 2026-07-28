import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    questionType: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer"],
      required: true,
    },
    answer: { type: mongoose.Schema.Types.Mixed }, // number | boolean | string
    isCorrect: { type: Boolean, default: null }, // null = ungraded (short_answer pending)
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    answers: { type: [answerSchema], default: [] },
    autoGradedCorrect: { type: Number, default: 0 },
    autoGradedTotal: { type: Number, default: 0 },
    manualGradingPending: { type: Boolean, default: false },
    finalScorePercent: { type: Number, default: null }, // null while manual grading pending
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Enforces one attempt per student per quiz
quizAttemptSchema.index({ quiz: 1, student: 1 }, { unique: true });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
