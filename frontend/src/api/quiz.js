import API from "./axios";

// Publish a generated quiz to a course (educator)
export const createQuiz = async (courseId, quiz) => {
  const res = await API.post(`/educator/courses/${courseId}/quizzes`, quiz);
  return res.data;
};

// List quizzes for a course (answers stripped unless caller owns the course)
export const getQuizzesForCourse = async (courseId) => {
  const res = await API.get(`/quizzes/course/${courseId}`);
  return res.data;
};

// Get a single quiz
export const getQuiz = async (quizId) => {
  const res = await API.get(`/quizzes/${quizId}`);
  return res.data;
};

// Submit a student's answers for a quiz
export const submitQuizAttempt = async (quizId, answers) => {
  const res = await API.post(`/quizzes/${quizId}/attempts`, { answers });
  return res.data;
};

// Get the logged-in student's own attempt/result for a quiz
export const getMyAttempt = async (quizId) => {
  const res = await API.get(`/quizzes/${quizId}/my-attempt`);
  return res.data;
};

// List all student attempts for a quiz (educator, for grading)
export const getAttemptsForQuiz = async (quizId) => {
  const res = await API.get(`/educator/quizzes/${quizId}/attempts`);
  return res.data;
};

// Grade the short-answer questions of a student's attempt (educator)
export const gradeShortAnswers = async (attemptId, grades) => {
  const res = await API.put(`/educator/attempts/${attemptId}/grade`, { grades });
  return res.data;
};
