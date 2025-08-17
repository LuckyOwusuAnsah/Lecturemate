import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star, Play, BookOpen, ShoppingCart } from "lucide-react";
import { useAuth } from '@/context/AuthContext'; // Import useAuth hook

export default function CourseCard({ course, featured = false }) {
    // Access user and authentication status from AuthContext
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (course) {
            if (!course.thumbnail) {
                console.warn(`Course "${course.title}" has no thumbnail URL.`);
            }
        }
    }, [course]);

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatPrice = (price) => {
        return price === 0 ? "Free" : `$${price.toFixed(2)}`;
    };

    const handleEnrollClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // For both paid and free courses, just navigate to the CourseDetail page.
        // The CourseDetail page will handle the actual enrollment logic.
        window.location.href = createPageUrl(`CourseDetail?id=${course._id}`);
    };

    // Determine if the buttons should be visible (only for students or non-logged-in users)
    // Removed specific role check here as CourseDetail handles the enrollment state.
    // The CourseCard should generally allow navigation if the course is public.
    // We can keep the original `showActionButtons` if you want to explicitly hide for educators/admins on the card itself.
    const showActionButtons = !isAuthenticated || user?.role === 'student';


    return (
        <Card className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden ${
            featured ? "ring-2 ring-blue-500 ring-opacity-50" : ""
        }`}>
            <CardHeader className="p-0">
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {course.thumbnail ? (
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://placehold.co/300x200/cccccc/333333?text=Image+Error';
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <Play className="w-12 h-12 text-white opacity-70" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center z-10">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-gray-900 ml-1" />
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-4 left-4 z-20">
                        {featured && (
                            <Badge className="bg-yellow-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                            </Badge>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                        <Badge
                            variant={course.price === 0 ? "secondary" : "default"}
                            className={course.price === 0 ? "bg-green-500 text-white" : "bg-white text-gray-900"}
                        >
                            {formatPrice(course.price)}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                        {(course.category || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {course.level}
                    </Badge>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {course.description}
                </p>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(course.duration || 0)}
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.total_enrollments || 0}
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {course.average_rating || 0}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {course.instructor_name?.[0]?.toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {course.instructor_name}
                        </span>
                    </div>

                    {/* Conditional rendering of buttons based on user role */}
                    {showActionButtons ? (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = createPageUrl(`CourseDetail?id=${course._id}`);
                                }}
                                className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                View
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleEnrollClick} // Now consistently navigates to CourseDetail
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {course.price > 0 ? (
                                    <>
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        {formatPrice(course.price)}
                                    </>
                                ) : (
                                    <>
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Enroll Free
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        // Optional: Display a message or nothing if buttons are hidden
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
