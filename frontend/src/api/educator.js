import API from "./axios";

export const getEducatorProfile = async () => {
  const res = await API.get("/educator/profile");
  return res.data;
};

export const updateEducatorProfile = async (data) => {
  const res = await API.put("/educator/profile", data);
  return res.data;
};

export const completeEducatorOnboarding = async (data) => {
  const res = await API.post("/educator/onboarding", data);
  return res.data;
};

export const createCourse = async (data) => {
  const res = await API.post("/educator/courses", data);
  return res.data;
};

export const updateCourse = async (courseId, data) => {
  const res = await API.put(`/educator/courses/${courseId}`, data);
  return res.data;
};

export const getMyCourses = async () => {
  const res = await API.get("/educator/my-courses");
  return res.data;
};

// Scoped to courses owned by the logged-in educator — safe to use for the
// edit-course form, unlike the public getCourseById.
export const getMyCourseById = async (courseId) => {
  const res = await API.get(`/educator/courses/${courseId}`);
  return res.data;
};

export const getEducatorAnalytics = async () => {
    const res = await API.get("/educator/analytics");
    return res.data;
};

export const getEducatorDashboardStats = async () => {
  try {
    const res = await API.get("/educator/dashboard-stats");
    return res.data;
  } catch (error) {
    console.error('Frontend API Error - getEducatorDashboardStats:', error);
    throw error;
  }
};

export const getStudentsWellness = async () => {
  const res = await API.get("/educator/students/wellness");
  return res.data;
};

export const sendMessageToStudent = async (studentId, message) => {
  const res = await API.post(`/educator/students/${studentId}/messages`, { message });
  return res.data;
};

export const getConversationWithStudent = async (studentId) => {
  const res = await API.get(`/educator/students/${studentId}/messages`);
  return res.data;
};
