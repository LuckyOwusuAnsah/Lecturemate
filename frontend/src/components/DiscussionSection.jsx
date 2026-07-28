import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea is available
import { Loader2, MessageCircle, PlusCircle, User as UserIcon } from 'lucide-react';
import { fetchDiscussionsForCourse, createDiscussionAPI, addCommentToDiscussionAPI } from '../api/description';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';

export default function DiscussionSection({ courseId }) {
    const { user, isAuthenticated } = useAuth();
    const [discussions, setDiscussions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
    const [newDiscussionContent, setNewDiscussionContent] = useState('');
    const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
    const [activeCommentBox, setActiveCommentBox] = useState(null); // Tracks which discussion has an active comment box
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);

    const loadDiscussions = async () => {
        try {
            setIsLoading(true);
            const data = await fetchDiscussionsForCourse(courseId);
            setDiscussions(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))); // Sort by most recent
        } catch (err) {
            console.error("Failed to load discussions:", err);
            setError("Failed to load discussions for this course.");
            toast.error("Failed to load discussions.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            loadDiscussions();
        }
    }, [courseId]);

    const handleCreateDiscussion = async (e) => {
        e.preventDefault();
        if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) {
            toast.error("Title and content cannot be empty.");
            return;
        }
        if (!isAuthenticated) {
            toast.error("You must be logged in to create a discussion.");
            return;
        }

        setIsCreatingDiscussion(true);
        try {
            const newDiscussion = await createDiscussionAPI({
                title: newDiscussionTitle,
                content: newDiscussionContent,
                courseId, // Link to the current course
            });
            setDiscussions(prev => [newDiscussion, ...prev]); // Add new discussion to top
            setNewDiscussionTitle('');
            setNewDiscussionContent('');
            setShowCreateForm(false);
            toast.success("Discussion topic created!");
        } catch (err) {
            console.error("Error creating discussion:", err);
            toast.error(err.response?.data?.message || "Failed to create discussion.");
        } finally {
            setIsCreatingDiscussion(false);
        }
    };

    const handleAddComment = async (discussionId) => {
        if (!commentText.trim()) {
            toast.error("Comment cannot be empty.");
            return;
        }
        if (!isAuthenticated) {
            toast.error("You must be logged in to add a comment.");
            return;
        }

        setIsPostingComment(true);
        try {
            const updatedDiscussion = await addCommentToDiscussionAPI(discussionId, commentText);
            // Update the specific discussion in the state with the new comments
            setDiscussions(prev => prev.map(disc =>
                disc._id === discussionId ? updatedDiscussion : disc
            ));
            setCommentText(''); // Clear comment input
            setActiveCommentBox(null); // Hide the comment box
            toast.success("Comment added!");
        } catch (err) {
            console.error("Error adding comment:", err);
            toast.error(err.response?.data?.message || "Failed to add comment.");
        } finally {
            setIsPostingComment(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading discussions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <Card className="mb-8 border-0">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Course Discussions</CardTitle>
                {isAuthenticated && (
                    <Button
                        onClick={() => setShowCreateForm(prev => !prev)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {showCreateForm ? 'Cancel' : 'New Discussion'}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {showCreateForm && isAuthenticated && (
                    <form onSubmit={handleCreateDiscussion} className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg mb-6 shadow-inner space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Start a New Discussion</h3>
                        <div>
                            <label htmlFor="discussionTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <Input
                                id="discussionTitle"
                                value={newDiscussionTitle}
                                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                                placeholder="E.g., Question about Chapter 3"
                                className="dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="discussionContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                            <Textarea
                                id="discussionContent"
                                value={newDiscussionContent}
                                onChange={(e) => setNewDiscussionContent(e.target.value)}
                                placeholder="Explain your question or idea..."
                                rows={4}
                                className="dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isCreatingDiscussion} className="bg-green-600 hover:bg-green-700 text-white">
                            {isCreatingDiscussion ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isCreatingDiscussion ? 'Creating...' : 'Post Discussion'}
                        </Button>
                    </form>
                )}

                <div className="space-y-6">
                    {discussions.length === 0 ? (
                        <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                            No discussion topics yet for this course. Be the first to start one!
                        </p>
                    ) : (
                        discussions.map(discussion => (
                            <Card key={discussion._id} className="dark:bg-gray-800 shadow-md">
                                <CardHeader className="border-b border-gray-700 pb-4">
                                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {discussion.title}
                                    </CardTitle>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Started by {discussion.user?.name || discussion.user?.email || 'Anonymous'} on {new Date(discussion.createdAt).toLocaleDateString()}
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">
                                        {discussion.content}
                                    </p>
                                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4">
                                        <MessageCircle className="w-4 h-4 mr-1" /> {discussion.comments?.length || 0} Comments
                                    </div>

                                    {/* Comments list */}
                                    <div className="space-y-4 border-t border-gray-700 pt-4">
                                        {discussion.comments && discussion.comments.length > 0 ? (
                                            discussion.comments.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(comment => (
                                                <div key={comment._id} className="flex items-start space-x-3 bg-gray-700 p-3 rounded-lg">
                                                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <p className="font-semibold text-white text-sm">
                                                                {comment.user?.name || comment.user?.email || 'Anonymous'}
                                                            </p>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(comment.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-300 text-sm leading-snug whitespace-pre-wrap">
                                                            {comment.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 text-sm">No comments yet. Be the first to reply!</p>
                                        )}
                                    </div>

                                    {/* Add Comment Form */}
                                    {isAuthenticated && (
                                        <div className="mt-4 border-t border-gray-700 pt-4">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setActiveCommentBox(activeCommentBox === discussion._id ? null : discussion._id)}
                                                className="text-blue-400 hover:bg-gray-700"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                {activeCommentBox === discussion._id ? 'Cancel' : 'Add Comment'}
                                            </Button>

                                            {activeCommentBox === discussion._id && (
                                                <form onSubmit={(e) => { e.preventDefault(); handleAddComment(discussion._id); }} className="mt-4 space-y-3">
                                                    <Textarea
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder="Write your comment here..."
                                                        rows={2}
                                                        className="dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                                        required
                                                    />
                                                    <Button type="submit" disabled={isPostingComment} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        {isPostingComment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                        {isPostingComment ? 'Posting...' : 'Post Comment'}
                                                    </Button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
