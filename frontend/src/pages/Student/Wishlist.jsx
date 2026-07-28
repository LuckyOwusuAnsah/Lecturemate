import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, BookOpen, Loader2, X } from "lucide-react";

import CourseCard from "@/components/CourseCard";
import { getWishlist, removeFromWishlist } from "@/api/student";

export default function Wishlist() {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingId, setRemovingId] = useState(null);

    const fetchWishlist = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getWishlist();
            setCourses(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load your wishlist.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const handleRemove = async (courseId) => {
        setRemovingId(courseId);
        try {
            await removeFromWishlist(courseId);
            setCourses((prev) => prev.filter((c) => c._id !== courseId));
            toast.success("Removed from wishlist");
        } catch (err) {
            toast.error(err.response?.data?.message || "Couldn't remove course. Please try again.");
        } finally {
            setRemovingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">Loading your wishlist...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <Heart className="w-8 h-8 text-red-500 fill-current" />
                        My Wishlist
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Courses you've saved to check out later
                    </p>
                </div>

                {error ? (
                    <Card className="p-12 text-center border-0">
                        <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                        <Button onClick={fetchWishlist} variant="outline">Try Again</Button>
                    </Card>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div key={course._id} className="relative">
                                <button
                                    onClick={() => handleRemove(course._id)}
                                    disabled={removingId === course._id}
                                    title="Remove from wishlist"
                                    className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 shadow flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                >
                                    {removingId === course._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                                    ) : (
                                        <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    )}
                                </button>
                                <CourseCard course={course} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center border-0">
                        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Your wishlist is empty
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Browse courses and tap "Add to Wishlist" to save them for later
                        </p>
                        <Link to={createPageUrl("Courses")}>
                            <Button>
                                <BookOpen className="w-4 h-4 mr-2" />
                                Browse Courses
                            </Button>
                        </Link>
                    </Card>
                )}
            </div>
        </div>
    );
}
