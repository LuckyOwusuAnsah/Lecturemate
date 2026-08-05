import express from "express";
import {
  getAdminProfile,
  updateAdminProfile,
  getDashboardStats,
  approveEducator,
  rejectEducator,
  getPendingEducators,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllCourses,
  deleteCourse,
  toggleCourseStatus,
} from "../controllers/admin.controller.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const adminRouter = express.Router();

// All routes are protected and admin only
adminRouter.use(protect, adminOnly);

// Admin profile
adminRouter.get("/profile", getAdminProfile);
adminRouter.put("/profile", updateAdminProfile);

// Dashboard stats
adminRouter.get("/dashboard-stats", getDashboardStats);

// Educator approval
adminRouter.get("/educators/pending", getPendingEducators);
adminRouter.post("/approve-educator/:id", approveEducator);
adminRouter.post("/reject-educator/:id", rejectEducator);

// Users
adminRouter.get("/users", getAllUsers);
adminRouter.get("/users/:id", getUserById);
adminRouter.delete("/users/:id", deleteUser);

// Courses
adminRouter.get("/courses", getAllCourses);
adminRouter.put("/courses/:id/status", toggleCourseStatus); 
adminRouter.delete("/courses/:id", deleteCourse);

export default adminRouter;
