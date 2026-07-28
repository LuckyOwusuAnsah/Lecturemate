import mongoose from "mongoose";

const mcQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correct_answer: { type: Number, required: true }, // index into options
  explanation: { type: String },
});

const tfQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  correct_answer: { type: Boolean, required: true },
  explanation: { type: String },
});

const shortAnswerQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  sample_answer: { type: String },
  grading_criteria: { type: [String], default: [] },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    multiple_choice: { type: [mcQuestionSchema], default: [] },
    true_false: { type: [tfQuestionSchema], default: [] },
    short_answer: { type: [shortAnswerQuestionSchema], default: [] },
  },
  { timestamps: true }
);

quizSchema.index({ course: 1, createdAt: -1 });

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
