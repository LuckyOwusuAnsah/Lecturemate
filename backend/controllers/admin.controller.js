import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import Course from "../models/CourseModel.js";
import EducatorProfile from "../models/EducatorProfileModel.js";

// GET /api/admin/profile
export const getAdminProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/admin/profile
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);
  if (!admin) throw new Error("Admin not found");

  admin.name = req.body.name || admin.name;
  admin.email = req.body.email || admin.email;
  const updatedAdmin = await admin.save();
  res.json(updatedAdmin);
});

// GET /api/admin/dashboard-stats
export const getDashboardStats = asyncHandler(async (req, res) => {
const totalUsers = await User.countDocuments({ role: { $in: ["student", "educator"] } });
  const students = await User.countDocuments({ role: "student" });
  const educators = await User.countDocuments({ role: "educator" });
  const pendingEducators = await User.countDocuments({ role: "educator", status: "pending" });
  const courses = await Course.countDocuments();

  res.json({
    totalUsers,
    students,
    educators,
    pendingEducators,
    totalCourses: courses,
  });
});

// POST /api/admin/approve-educator/:id
export const approveEducator = asyncHandler(async (req, res) => {
  const educator = await User.findById(req.params.id);
  if (!educator || educator.role !== "educator") {
    res.status(404);
    throw new Error("Educator not found");
  }
  educator.status = "approved";
  await educator.save();
  res.json({ message: "Educator approved successfully" });
});

// POST /api/admin/reject-educator/:id
export const rejectEducator = asyncHandler(async (req, res) => {
  const educator = await User.findById(req.params.id);
  if (!educator || educator.role !== "educator") {
    res.status(404);
    throw new Error("Educator not found");
  }
  educator.status = "rejected";
  await educator.save();
  res.json({ message: "Educator rejected" });
});

// GET /api/admin/educators/pending
// Returns pending educator accounts together with the application data they
// submitted during onboarding, so an admin has something real to verify
// before approving or rejecting.
export const getPendingEducators = asyncHandler(async (req, res) => {
  const pendingEducators = await User.find({
    role: "educator",
    status: "pending",
  })
    .select("-password")
    .sort({ createdAt: 1 });

  const profiles = await EducatorProfile.find({
    user: { $in: pendingEducators.map((u) => u._id) },
  });
  const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

  const result = pendingEducators.map((user) => ({
    user,
    profile: profileByUserId.get(user._id.toString()) || null,
  }));

  res.status(200).json(result);
});

// GET /api/admin/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// GET /api/admin/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json(user);
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ message: "User deleted successfully" });
});

// GET /api/admin/courses
export const getAllCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({
        status: { $in: ['Pending Review', 'Published'] } 
    }).populate("educator", "name email"); 
    res.status(200).json(courses);
});

// @desc    Toggle course publish status
// @route   PUT /api/admin/courses/:id/status
// @access  Private/Admin
export const toggleCourseStatus = asyncHandler(async (req, res) => {
    const { id } = req.params; 
    const { status } = req.body; 
    
    // 1. Find the course by its ID
    const course = await Course.findById(id);

    // 2. Check if the course exists
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    // 3. Validate that 'status' is a valid string using lowercase comparison
    const allowedStatusesLowercase = ['published', 'draft', 'pending review'];
    if (typeof status !== 'string' || !allowedStatusesLowercase.includes(status.toLowerCase())) {
        res.status(400); // Bad Request
        console.log('Invalid status value received:', status); 
        throw new Error(`Invalid status value. Status must be one of: ${allowedStatusesLowercase.join(', ')}.`);
    }

    // 4. Determine the correct capitalized status string for the Mongoose enum
    let statusToSave;
    switch (status.toLowerCase()) {
        case 'published':
            statusToSave = 'Published';
            break;
        case 'draft':
            statusToSave = 'Draft';
            break;
        case 'pending review':
            statusToSave = 'Pending Review'; // Ensure 'Pending Review' is correctly capitalized
            break;
        default:
            // This case should ideally not be reached due to the validation above,
            // but it's good for robustness.
            statusToSave = capitalizeWords(status.toLowerCase()); 
    }

    // 5. Update the course's status with the correctly capitalized string
    course.status = statusToSave; 
    await course.save(); 

    // 6. Send a success response
    res.status(200).json({
        message: `Course status updated to ${course.status}.`,
        course: { 
            _id: course._id,
            title: course.title,
            status: course.status // Return the updated status (which is now capitalized)
        }
    });
});

// DELETE /api/admin/courses/:id
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }
  res.json({ message: "Course deleted successfully" });
});
