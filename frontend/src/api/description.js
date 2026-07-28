import API from './axios'; // Your configured Axios instance

// Fetch discussion topics for a specific course
export const fetchDiscussionsForCourse = async (courseId) => {
    try {
        const response = await API.get(`/discussions?courseId=${courseId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching discussions for course ${courseId}:`, error);
        throw error;
    }
};

// Fetch a single discussion topic with its comments
export const fetchDiscussionById = async (discussionId) => {
    try {
        const response = await API.get(`/discussions/${discussionId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching discussion ${discussionId}:`, error);
        throw error;
    }
};

// Create a new discussion topic for a course
export const createDiscussionAPI = async (discussionData) => {
    try {
        const response = await API.post('/discussions', discussionData);
        return response.data;
    } catch (error) {
        console.error("Error creating discussion:", error);
        throw error;
    }
};

// Add a comment to a specific discussion topic
export const addCommentToDiscussionAPI = async (discussionId, commentText) => {
    try {
        const response = await API.post(`/discussions/${discussionId}/comments`, { text: commentText });
        return response.data; // Backend returns the updated discussion
    } catch (error) {
        console.error(`Error adding comment to discussion ${discussionId}:`, error);
        throw error;
    }
};

// You can add update/delete discussion/comment APIs if needed
