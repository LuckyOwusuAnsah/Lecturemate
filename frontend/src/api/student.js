// src/api/student.js
import API from "./axios";

export const getStudentProfile = async () => {
  const res = await API.get("/student/profile");
  return res.data;
};

export const updateStudentProfile = async (data) => {
  const res = await API.put("/student/profile", data);
  return res.data;
};

export const completeStudentOnboarding = async (data) => {
  const res = await API.post("/student/onboarding", data);
  return res.data;
};

export const enrollInCourse = async (courseId) => {
  const res = await API.post("/student/enroll", { courseId });
  return res.data;
};

export const fetchEnrolledCourses = async () => {
        const res = await API.get('/student/courses');
        return res.data;

};

export const getStudentCourses = async () => {
  const res = await API.get("/student/courses");
  return res.data;
};

export const getLearningProgress = async (courseId) => {
  const res = await API.get(`/student/progress/${courseId}`);
  return res.data;
};

export const markLectureComplete = async (enrollmentId, lectureId) => {
        const res = await API.put(`/student/enrollments/${enrollmentId}/complete-lecture`, { lectureId });
        return res.data;
};

export const getWishlist = async () => {
  const res = await API.get("/student/wishlist");
  return res.data;
};

export const addToWishlist = async (courseId) => {
  const res = await API.post(`/student/wishlist/${courseId}`);
  return res.data;
};

export const removeFromWishlist = async (courseId) => {
  const res = await API.delete(`/student/wishlist/${courseId}`);
  return res.data;
};
