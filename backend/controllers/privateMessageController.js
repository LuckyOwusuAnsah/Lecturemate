import asyncHandler from "express-async-handler";
import PrivateMessage from "../models/PrivateMessageModel.js";
import Course from "../models/CourseModel.js";
import Enrollment from "../models/EnrollmentModel.js";
import User from "../models/UserModel.js";

// Finds a course that links a given educator and student via an enrollment,
// so an educator can only message students actually enrolled in one of
// their own courses, and a student can only reply to educators who
// actually teach a course they're enrolled in.
const findSharedCourse = async (educatorId, studentId) => {
  const educatorCourses = await Course.find({ educator: educatorId }).select("_id");
  const courseIds = educatorCourses.map((c) => c._id);
  if (courseIds.length === 0) return null;

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: { $in: courseIds },
  }).select("course");

  return enrollment ? enrollment.course : null;
};

// @desc    Educator sends a private message to a student enrolled in one of
//          their courses
// @route   POST /api/educator/students/:studentId/messages
// @access  Private (Educator only, approved)
export const sendMessageToStudent = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const { studentId } = req.params;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("Message cannot be empty.");
  }

  const student = await User.findOne({ _id: studentId, role: "student" });
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  const sharedCourseId = await findSharedCourse(req.user._id, studentId);
  if (!sharedCourseId) {
    res.status(403);
    throw new Error("You can only message students enrolled in one of your own courses.");
  }

  const privateMessage = await PrivateMessage.create({
    sender: req.user._id,
    recipient: studentId,
    course: sharedCourseId,
    message: message.trim(),
  });

  res.status(201).json(privateMessage);
});

// @desc    Educator views the full private message thread with one student
// @route   GET /api/educator/students/:studentId/messages
// @access  Private (Educator only, approved)
export const getConversationWithStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const sharedCourseId = await findSharedCourse(req.user._id, studentId);
  if (!sharedCourseId) {
    res.status(403);
    throw new Error("You can only view conversations with students enrolled in one of your own courses.");
  }

  const messages = await PrivateMessage.find({
    $or: [
      { sender: req.user._id, recipient: studentId },
      { sender: studentId, recipient: req.user._id },
    ],
  }).sort({ createdAt: 1 });

  res.status(200).json(messages);
});

// @desc    Student lists their conversations, one entry per educator, with
//          the most recent message and an unread count
// @route   GET /api/student/messages
// @access  Private (Student only)
export const getMyConversations = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const messages = await PrivateMessage.find({
    $or: [{ sender: studentId }, { recipient: studentId }],
  })
    .sort({ createdAt: -1 })
    .populate("sender", "name email")
    .populate("recipient", "name email");

  const conversationByEducator = new Map();

  for (const msg of messages) {
    const isFromStudent = msg.sender._id.toString() === studentId.toString();
    const educator = isFromStudent ? msg.recipient : msg.sender;
    const key = educator._id.toString();

    if (!conversationByEducator.has(key)) {
      conversationByEducator.set(key, {
        educator: { _id: educator._id, name: educator.name, email: educator.email },
        lastMessage: msg.message,
        lastMessageAt: msg.createdAt,
        fromMe: isFromStudent,
        unreadCount: 0,
      });
    }

    if (!isFromStudent && !msg.readAt) {
      conversationByEducator.get(key).unreadCount += 1;
    }
  }

  res.status(200).json([...conversationByEducator.values()]);
});

// @desc    Student views the full thread with one educator and marks the
//          educator's messages as read
// @route   GET /api/student/messages/:educatorId
// @access  Private (Student only)
export const getConversationWithEducator = asyncHandler(async (req, res) => {
  const { educatorId } = req.params;
  const studentId = req.user._id;

  const messages = await PrivateMessage.find({
    $or: [
      { sender: studentId, recipient: educatorId },
      { sender: educatorId, recipient: studentId },
    ],
  }).sort({ createdAt: 1 });

  await PrivateMessage.updateMany(
    { sender: educatorId, recipient: studentId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } }
  );

  res.status(200).json(messages);
});

// @desc    Student replies to an educator who teaches a course they're
//          enrolled in
// @route   POST /api/student/messages/:educatorId
// @access  Private (Student only)
export const replyToEducator = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const { educatorId } = req.params;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("Message cannot be empty.");
  }

  const educator = await User.findOne({ _id: educatorId, role: "educator" });
  if (!educator) {
    res.status(404);
    throw new Error("Educator not found.");
  }

  const sharedCourseId = await findSharedCourse(educatorId, req.user._id);
  if (!sharedCourseId) {
    res.status(403);
    throw new Error("You can only message educators who teach a course you're enrolled in.");
  }

  const privateMessage = await PrivateMessage.create({
    sender: req.user._id,
    recipient: educatorId,
    course: sharedCourseId,
    message: message.trim(),
  });

  res.status(201).json(privateMessage);
});
