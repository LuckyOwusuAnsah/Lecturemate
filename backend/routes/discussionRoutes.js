import express from "express";
import * as discussionController from '../controllers/discussionController.js';
import * as authMiddleware from '../middleware/authMiddleware.js';

const discoussionRoutes = express.Router();

// Discussions can be viewed by anyone, but posting/commenting requires authentication
discoussionRoutes.route('/')
    .get(discussionController.getAllDiscussions); // Get discussions (can filter by course)

// Protect routes for creating discussions or adding comments
discoussionRoutes.use(authMiddleware.protect);

discoussionRoutes.route('/')
    .post(discussionController.createDiscussion); // Create a new discussion topic

discoussionRoutes.route('/:id') // :id refers to the discussion ID
    .get(discussionController.getDiscussion) // Get a single discussion with its comments
    .patch(discussionController.updateDiscussion) // Update discussion (by owner/admin)
    .delete(discussionController.deleteDiscussion); // Delete discussion (by owner/admin)

// Route for adding comments to a specific discussion
discoussionRoutes.route('/:id/comments') // :id refers to the discussion ID
    .post(discussionController.addCommentToDiscussion); // Add a comment to a discussion

export default discoussionRoutes;
