import React, { useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Lucide React Icons
import {
    BookOpen,
    Clock,
    Award,
    TrendingUp,
    Play,
    Heart,
    GraduationCap,
    Loader2, 
    AlertCircle 
} from "lucide-react";

// Custom Hooks
import { useAuth } from '@/context/AuthContext';
import { useFetchStudentDashboard } from '@/hooks/useFetchStudentDashboard';

export default function StudentDashboard() {
    const navigate = useNavigate();

    // Fetch dashboard data using the custom hook
    const {
        student: studentUser, // This is the userProfile from useFetchStudentDashboard
        enrolledCourses,
        completedCoursesCount,
        totalLearningHours,
        averageOverallProgress,
        isLoading,
        error,
        refetchDashboard
    } = useFetchStudentDashboard();

    // Get authentication status and full user object from AuthContext
    const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();

    // Effect to handle redirection if user is not authenticated or not a student
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate(createPageUrl("Login"));
            } else if (authUser?.role !== "student") {
                navigate(createPageUrl("Home"));
            }
        }
    }, [isAuthenticated, authUser, authLoading, navigate]);

    // Overall loading state (auth check + data fetch)
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">Loading your dashboard...</p>
            </div>
        );
    }

    // Handle authentication/role check after loading
    if (!isAuthenticated || !authUser || authUser?.role !== "student") {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Access Denied
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You need to be logged in as a student to access this dashboard.
                    </p>
                    <Button onClick={() => navigate(createPageUrl("Login"))}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    // Handle errors during data fetching
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Error Loading Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                    {error.message || "Something went wrong while fetching your dashboard data. Please try again."}
                </p>
                <Button onClick={refetchDashboard} variant="outline" className="px-6 py-3">
                    <TrendingUp className="w-5 h-5 mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    // Main Dashboard Content
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {/* FIX 1: Display user's name (full_name or name) or fallback to email/Student */}
                        Welcome back, {studentUser?.full_name || studentUser?.name || studentUser?.email || 'Student'}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Continue your learning journey and track your progress
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Enrolled Courses</p>
                                    <p className="text-3xl font-bold">{enrolledCourses.length}</p>
                                </div>
                                <BookOpen className="w-8 h-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Completed</p>
                                    <p className="text-3xl font-bold">{completedCoursesCount}</p>
                                </div>
                                <Award className="w-8 h-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Learning Hours</p>
                            
                                    <p className="text-3xl font-bold">{totalLearningHours}</p>
                                </div>
                                <Clock className="w-8 h-8 text-purple-200" />
                            </div>
                        </CardContent>
                    </Card> */}

                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Avg Progress</p>
                                    <p className="text-3xl font-bold">{averageOverallProgress}%</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-orange-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Link to={createPageUrl("Courses")}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white dark:bg-gray-800">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Browse Courses
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Discover new courses to expand your skills
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl("Wellness")}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white dark:bg-gray-800">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Wellness Center
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Track your mood and mental wellness
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link to={createPageUrl("Wishlist")}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white dark:bg-gray-800">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-6 h-6 text-red-500 fill-current" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    My Wishlist
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Courses you've saved to check out later
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    {authUser?.role === "educator" && (
                        <Link to={createPageUrl("EducatorDashboard")}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white dark:bg-gray-800">
                                <CardContent className="p-6 text-center">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Educator Dashboard
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                                        Manage your courses and students
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>

                {/* Enrolled Courses */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Your Courses
                        </h2>
                        <Link to={createPageUrl("Courses")}>
                            <Button variant="outline">
                                Browse More Courses
                            </Button>
                        </Link>
                    </div>

                    {enrolledCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledCourses.map((course) => (
                                <Card key={course._id} className="hover:shadow-lg transition-shadow border-0">
                                    <CardHeader className="p-0">
                                        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center rounded-t-lg overflow-hidden">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/64x64/cccccc/333333?text=No+Img'; }}
                                                />
                                            ) : (
                                                <Play className="w-12 h-12 text-white opacity-70" />
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge variant="outline" className="text-xs">
                                                {(course.category || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Badge>
                                            {course.enrollment.isCompleted && (
                                                <Badge className="bg-green-500 text-white text-xs">
                                                    <Award className="w-3 h-3 mr-1" />
                                                    Completed
                                                </Badge>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {course.title}
                                        </h3>

                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                            by {course.instructor_name || 'N/A'}
                                        </p>

                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {Math.round(course.enrollment.progress)}%
                                                </span>
                                            </div>
                                            <Progress value={course.enrollment.progress} className="h-2" />
                                        </div>

                                        <Link to={createPageUrl("CourseDetail", { id: course._id })}>
                                            <Button className="w-full">
                                                {course.enrollment.isCompleted ? "Review Course" : "Continue Learning"}
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-12 text-center border-0">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No courses yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Start your learning journey by enrolling in a course
                            </p>
                            <Link to={createPageUrl("Courses")}>
                                <Button>
                                    Browse Courses
                                </Button>
                            </Link>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
