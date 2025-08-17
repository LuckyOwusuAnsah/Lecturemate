import asyncHandler from "express-async-handler";
import EducatorProfile from "../models/EducatorProfileModel.js";
import Course from "../models/CourseModel.js";
import Enrollment from "../models/EnrollmentModel.js"; 
import Review from "../models/ReviewModel.js";
import cloudinary from "../config/cloudinary.js";
// @desc    Get educator profile
// @route   GET /api/educators/profile
export const getEducatorProfile = asyncHandler(async (req, res) => {
  const profile = await EducatorProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error("Educator profile not found");
  }
  res.json(profile);
});

// @desc    Update educator profile
// @route   PUT /api/educators/profile
export const updateEducatorProfile = asyncHandler(async (req, res) => {
  const updated = await EducatorProfile.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!updated) {
    res.status(404);
    throw new Error("Educator profile not found");
  }
  res.json(updated);
});

// @desc    Complete educator onboarding
// @route   POST /api/educators/onboarding
export const completeEducatorOnboarding = asyncHandler(async (req, res) => {
  const exists = await EducatorProfile.findOne({ user: req.user._id });
  if (exists) {
    res.status(400);
    throw new Error("Onboarding already completed");
  }
  const profile = await EducatorProfile.create({ user: req.user._id, ...req.body });
  res.status(201).json(profile);
});

// @desc    Upload sample content link
// @route   POST /api/educators/upload-sample
export const uploadSampleContent = asyncHandler(async (req, res) => {
  const { sampleLink } = req.body;

  const profile = await EducatorProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error("Educator profile not found");
  }

  profile.sampleLink = sampleLink;
  await profile.save();

  res.json({ message: "Sample content uploaded successfully" });
});

// @desc    Get educator teaching tools (Zoom, LMS, etc.)
// @route   GET /api/educators/tools
export const getTeachingTools = asyncHandler(async (req, res) => {
  const profile = await EducatorProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error("Educator profile not found");
  }

  res.json({
    platforms: profile.platforms || [],
    hasDigitalExperience: profile.hasDigitalExperience || false,
  });
});

// @desc    Create a course
// @route   POST /api/educators/courses
export const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subject,
    level,
    price,
    chapters, 
    tags,      
    contentLinks, 
    educator,
    duration,
    status,
  } = req.body;

  let thumbnailUrl = '';

  // Check if a file was uploaded (handled by multer middleware)
  if (req.file) {
    try {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'course_thumbnails', 
        resource_type: 'image',
      });
      thumbnailUrl = result.secure_url; 
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      res.status(500);
      throw new Error("Failed to upload thumbnail to Cloudinary.");
    }
  }

  // Parse JSON strings back to arrays/objects
  const parsedChapters = chapters ? JSON.parse(chapters) : [];
  const parsedTags = tags ? JSON.parse(tags) : [];
  const parsedContentLinks = contentLinks ? JSON.parse(contentLinks) : [];


  const course = await Course.create({
    educator: req.user._id || educator, 
    title,
    description,
    category,
    subject,
    level,
    price,
    thumbnail: thumbnailUrl, 
    chapters: parsedChapters,
    tags: parsedTags,
    contentLinks: parsedContentLinks,
    duration,
    status,
  });

  res.status(201).json(course);
});

// @desc    Update a course
// @route   PUT /api/educators/courses/:courseId
export const updateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // IMPORTANT: When using FormData with Multer, req.body will contain the text fields.
    // Ensure Multer is correctly configured for this route in your router.
    // For example: router.put('/:courseId', protect, upload.single('thumbnail'), updateCourse);

    // Destructure properties safely, providing defaults for robustness
    const {
        title = '', // Provide empty string default
        description = '',
        category = '',
        subject = '',
        level = 'Beginner', // Default to Beginner
        price, // Price can be 0, so check for undefined
        chapters, // These will be JSON strings
        tags,
        contentLinks,
        duration,
        status = 'Draft', // Default status for update
    } = req.body;

    // Find the course by ID and ensure it belongs to the authenticated educator
    let course = await Course.findOne({ _id: courseId, educator: req.user._id });

    if (!course) {
        res.status(404);
        throw new Error("Course not found or not authorized to update");
    }

    // Handle thumbnail update if a new file is provided via req.file (from Multer)
    if (req.file) {
        try {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'course_thumbnails',
                resource_type: 'image',
            });
            course.thumbnail = result.secure_url; // Update thumbnail URL
        } catch (uploadError) {
            console.error("Cloudinary thumbnail update error:", uploadError);
            res.status(500);
            throw new Error("Failed to upload new thumbnail.");
        }
    } 
    // If req.file is null/undefined, the existing course.thumbnail will persist.
    // If you need to allow clearing the thumbnail, you'd send a specific flag
    // from frontend or a null/empty string value for 'thumbnail' that isn't a file.

    // Update course fields with values from req.body
    course.title = title;
    course.description = description;
    course.category = category;
    course.subject = subject;
    course.level = level;
    // Only update price if it's explicitly provided (can be 0)
    course.price = price !== undefined ? parseFloat(price) : course.price; // Parse price from string to number
    course.duration = duration !== undefined ? parseFloat(duration) : course.duration; // Parse duration
    course.status = status;

    // Parse and update array fields (chapters, tags, contentLinks) from JSON strings
    course.chapters = chapters ? JSON.parse(chapters) : course.chapters;
    course.tags = tags ? JSON.parse(tags) : course.tags;
    course.contentLinks = contentLinks ? JSON.parse(contentLinks) : course.contentLinks;

    // Save the updated course
    const updatedCourse = await course.save();

    res.json(updatedCourse);
});

// @desc    Get courses created by educator
// @route   GET /api/educators/courses
export const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ educator: req.user._id });
  res.json(courses);
});

// @desc    Request approval
// @route   POST /api/educators/request-approval
export const requestApproval = asyncHandler(async (req, res) => {
  // Placeholder logic
  res.json({ message: "Your approval request has been submitted." });
});

// @desc    Get comprehensive analytics data for the authenticated educator
// @route   GET /api/educators/analytics
export const getEducatorAnalytics = asyncHandler(async (req, res) => {
    // Verify user is authenticated and is an educator
    if (!req.user || req.user.role !== 'educator') {
        res.status(403); // Forbidden
        throw new Error('Not authorized as an educator to access analytics');
    }

    const educatorId = req.user._id;

    // Fetch the EducatorProfile document and POPULATE the 'user' field
    const educatorProfile = await EducatorProfile.findOne({ user: educatorId })
        .populate('user', 'name email role'); // Populate with relevant User fields

    if (!educatorProfile) {
        res.status(404);
        throw new Error('Educator profile not found. Please ensure the educator has completed onboarding.');
    }

    // Fetch all courses created by this educator
    const courses = await Course.find({ educator: educatorId });

    // Calculate total course views by summing viewsCount from all courses
    const totalCourseViews = courses.reduce((sum, course) => sum + (course.viewsCount || 0), 0);

    const courseIds = courses.map(course => course._id);

    // Fetch all enrollments for these courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
        .populate('course', 'title price category')
        .populate('student', 'name email');

    // Fetch all reviews for these courses
    const reviews = await Review.find({ course: { $in: courseIds } })
        .populate('course', 'title')
        .populate('user', 'name email');

    // Send all collected data in a single response
    res.status(200).json({
        educatorProfile: {
            ...educatorProfile.toObject(), // Spread existing profile data
            totalCourseViews: totalCourseViews // Add the new dynamic field
        },
        courses,
        enrollments,
        reviews,
        message: 'Educator analytics data fetched successfully'
    });
});

// @desc    Get aggregated dashboard statistics for an educator
// @route   GET /api/educators/dashboard-stats
// @access  Private (Educator only)
export const getEducatorDashboardStats = asyncHandler(async (req, res) => {
    // req.user._id should be populated by your authentication middleware (e.g., protect)
    const educatorId = req.user._id;

    // 1. Fetch all courses created by this educator
    const courses = await Course.find({ educator: educatorId });

    let totalRevenue = 0;
    let sumRatings = 0;
    let totalCoursesWithRatings = 0;

    // Using a Set to collect all unique student IDs across all courses
    const allUniqueStudentIds = new Set();

    // Iterate through each course to gather stats
    for (const course of courses) {
        // Fetch enrollments for the current course, populate the 'student' field
        // --- FIX: Changed .populate('user') to .populate('student') ---
        const enrollments = await Enrollment.find({ course: course._id }).populate('student');
        
        // Accumulate unique students from this course
        enrollments.forEach(enrollment => {
            // --- FIX: Changed enrollment.user to enrollment.student ---
            if (enrollment.student && enrollment.student._id) {
                allUniqueStudentIds.add(enrollment.student._id.toString());
            } else {
                console.warn(`Enrollment ${enrollment._id} has no valid student reference. Skipping for student count.`);
            }
        });

        // Calculate revenue for this course
        if (typeof course.price === 'number' && !isNaN(course.price)) {
            totalRevenue += course.price * enrollments.length;
        } else {
            console.warn(`Course ${course._id} has invalid or missing price (${course.price}). Skipping revenue for this course.`);
        }

        // Calculate average rating contribution
        if (typeof course.average_rating === 'number' && !isNaN(course.average_rating)) {
            sumRatings += course.average_rating;
            totalCoursesWithRatings++;
        }
    }

    const finalTotalStudents = allUniqueStudentIds.size;
    const avgRating = totalCoursesWithRatings > 0 ? (sumRatings / totalCoursesWithRatings).toFixed(1) : 0;
    const formattedTotalRevenue = totalRevenue.toFixed(2);

    res.status(200).json({
        totalCourses: courses.length,
        totalStudents: finalTotalStudents,
        totalRevenue: formattedTotalRevenue,
        avgRating: parseFloat(avgRating)
    });
});
