// frontend/pages/Educator/EducatorDashboard.jsx

import React, { useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    Plus,
    BookOpen,
    Users,
    Star,
    DollarSign,
    TrendingUp,
    Edit,
    Eye,
    BarChart3,
    Loader2,
    AlertCircle,
    ClipboardCheck
} from "lucide-react";

import { useAuth } from '@/context/AuthContext';
import { useFetchEducatorCourses } from '@/hooks/useFetchEducatorCourses';
import { useFetchEducatorDashboardStats } from '@/hooks/useFetchEducatorDashboardStats'; // Import the new hook

export default function EducatorDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { courses, loading: coursesLoading, error: coursesError, refetchCourses } = useFetchEducatorCourses();
    // Use the new hook to fetch dashboard stats
    const { stats, loading: statsLoading, error: statsError, refetchStats } = useFetchEducatorDashboardStats();

    // These values will now come directly from the 'stats' object provided by the hook
    const totalStudents = stats.totalStudents;
    const totalRevenue = stats.totalRevenue;
    const avgRating = stats.avgRating;

    // This useCallback hook remains a placeholder for course-specific stats
    const getStatsForCourse = useCallback((courseId) => {
        // In a real application, you might filter the 'courses' array
        // or have another hook/API call to get detailed stats per course.
        // For now, it returns placeholders.
        return {
            totalEnrollments: 0,
            completedCount: 0,
            avgProgress: 0
        };
    }, []); 

    // Redirect unauthenticated users to the login page
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate(createPageUrl("Login"));
        }
    }, [isAuthenticated, authLoading, navigate]); 

    // Combine loading states from both hooks for a unified loading experience
    if (authLoading || coursesLoading || statsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">Loading dashboard...</p>
            </div>
        );
    }

    // If not authenticated after loading, return null (though useEffect should handle redirect)
    if (!isAuthenticated) {
        return null;
    }

    // Handle errors from either courses or stats fetching
    if (coursesError || statsError) {
        const errorMessage = coursesError?.message || statsError?.message || "Something went wrong while fetching dashboard data.";
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Error Loading Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                    {errorMessage}
                </p>
                <Button onClick={() => { refetchCourses(); refetchStats(); }} variant="outline" className="px-6 py-3">
                    <TrendingUp className="w-5 h-5 mr-2" /> Try Again
                </Button>
            </div>
        );
    }

    // Access Denied for non-educator roles
    if (user?.role !== "educator") {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Access Denied
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You need to be an educator to access this dashboard.
                    </p>
                    <Button onClick={() => navigate(createPageUrl("Home"))}>
                        Go to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Educator Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Welcome, {user?.name || user?.email || 'Educator'}! Manage your courses and content.
                        </p>
                    </div>
                    <Link to={createPageUrl("CreateCourse")}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Course
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards (Now Dynamic) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Courses</p>
                                    <p className="text-3xl font-bold">{stats.totalCourses}</p>
                                </div>
                                <BookOpen className="w-8 h-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Total Students</p>
                                    <p className="text-3xl font-bold">{totalStudents}</p> 
                                </div>
                                <Users className="w-8 h-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Total Revenue</p>
                                    <p className="text-3xl font-bold">${totalRevenue}</p> 
                                </div>
                                <DollarSign className="w-8 h-8 text-purple-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Avg Rating</p>
                                    <p className="text-3xl font-bold">{avgRating}</p> 
                                </div>
                                <Star className="w-8 h-8 text-orange-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Courses List */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Your Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {courses.length > 0 ? (
                            <div className="space-y-4">
                                {courses.map((course) => {
                                    const stats = getStatsForCourse(course._id); // This still returns placeholders
                                    return (
                                        <div key={course._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    {/* Course Thumbnail */}
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                        {course.thumbnail ? (
                                                            <img
                                                                src={course.thumbnail}
                                                                alt={course.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/64x64/cccccc/333333?text=No+Img'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                                <BookOpen className="w-8 h-8 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {course.title}
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-400">
                                                            {(course.category || course.subject || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={
                                                        course.status === 'Published' ? "bg-green-500 text-white" :
                                                        course.status === 'Pending Review' ? "bg-yellow-500 text-white" :
                                                        course.status === 'Draft' ? "bg-gray-500 text-white" :
                                                        "bg-gray-500 text-white"
                                                    }>
                                                        {course.status}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {course.price === 0 ? "Free" : `$${course.price}`}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Course-specific Stats (Placeholders, needs backend data for real values) */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {stats.totalEnrollments}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Students
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {stats.completedCount}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Completed
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {Math.round(stats.avgProgress)}%
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Avg Progress
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {course.average_rating !== undefined && course.average_rating !== null ? course.average_rating.toFixed(1) : 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Rating
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                               
                                                <Link to={createPageUrl("CreateCourse", { id: course._id })}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Link to={createPageUrl("Analytics")}>
                                                <Button variant="outline" size="sm">
                                                    <BarChart3 className="w-4 h-4 mr-2" />
                                                    Analytics
                                                </Button>
                                                </Link>
                                                <Link to={createPageUrl("QuizGrading", { courseId: course._id })}>
                                                <Button variant="outline" size="sm">
                                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                                    Grade Quizzes
                                                </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No courses yet
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Create your first course to start teaching
                                </p>
                                <Link to={createPageUrl("CreateCourse")}>
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Your First Course
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
