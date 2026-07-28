import asyncHandler from 'express-async-handler';
import Discussion from '../models/DiscussionModel.js';
import Course from '../models/CourseModel.js';

// @desc    Get all discussions (can filter by course)
// @route   GET /api/discussions
// @access  Public
export const getAllDiscussions = asyncHandler(async (req, res) => {
    const { courseId } = req.query;
    const filter = courseId ? { course: courseId } : {};

    // user/course/comments.user are populated automatically by the
    // model's pre('find') hook.
    const discussions = await Discussion.find(filter).sort({ createdAt: -1 });

    res.json(discussions);
});

// @desc    Get a single discussion with its comments
// @route   GET /api/discussions/:id
// @access  Public
export const getDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (discussion) {
        res.json(discussion);
    } else {
        res.status(404);
        throw new Error('Discussion not found');
    }
});

// @desc    Create a new discussion topic
// @route   POST /api/discussions
// @access  Private
export const createDiscussion = asyncHandler(async (req, res) => {
    const { title, content, courseId } = req.body;

    if (!title || !content || !courseId) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    const discussion = await Discussion.create({
        title,
        content,
        course: courseId,
        user: req.user._id,
    });

    res.status(201).json(discussion);
});

// @desc    Add a comment to a discussion
// @route   POST /api/discussions/:id/comments
// @access  Private
export const addCommentToDiscussion = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const discussion = await Discussion.findById(req.params.id);

    if (discussion) {
        if (!text) {
            res.status(400);
            throw new Error('Comment text is required');
        }

        discussion.comments.push({
            text,
            user: req.user._id,
            createdAt: new Date(),
        });

        await discussion.save();

        // Re-fetch so comments.user is populated by the model's pre('find') hook
        const updatedDiscussion = await Discussion.findById(req.params.id);

        res.status(201).json(updatedDiscussion);
    } else {
        res.status(404);
        throw new Error('Discussion not found');
    }
});

// @desc    Update discussion
// @route   PATCH /api/discussions/:id
// @access  Private (Owner/Admin)
export const updateDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (discussion) {
        const ownerId = (discussion.user?._id ?? discussion.user).toString();

        // Check if user is owner or admin
        if (ownerId !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401);
            throw new Error('Not authorized to update this discussion');
        }

        discussion.title = req.body.title || discussion.title;
        discussion.content = req.body.content || discussion.content;

        const updatedDiscussion = await discussion.save();
        res.json(updatedDiscussion);
    } else {
        res.status(404);
        throw new Error('Discussion not found');
    }
});

// @desc    Delete discussion
// @route   DELETE /api/discussions/:id
// @access  Private (Owner/Admin)
export const deleteDiscussion = asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (discussion) {
        const ownerId = (discussion.user?._id ?? discussion.user).toString();

        // Check if user is owner or admin
        if (ownerId !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(401);
            throw new Error('Not authorized to delete this discussion');
        }

        await discussion.deleteOne();
        res.json({ message: 'Discussion removed' });
    } else {
        res.status(404);
        throw new Error('Discussion not found');
    }
});
