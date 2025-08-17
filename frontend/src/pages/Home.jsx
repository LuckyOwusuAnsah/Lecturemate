import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Star, Loader2 } from "lucide-react";

import CourseCard from "../components/CourseCard";
import HeroSection from "../components/HeroSection";
import StatsSection from "../components/StatsSection";

import { useFetchCourses } from '../hooks/useFetchCourses';
import { useFetchRecommendedCourses } from '../hooks/useFetchRecommendedCourses'; // This hook will useAuth internally
import { useAuth } from '@/context/AuthContext'; // Import useAuth directly

export default function Home() {
    const navigate = useNavigate();
    // Get user, isAuthenticated, and AuthContext's initial loading state
    const { user, isAuthenticated, loading: authContextLoading } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // All courses fetch (public, not directly dependent on authenticated user for initial load)
    const {
        courses,
        isLoading: allCoursesLoading,
        error: allCoursesError,
        pagination: allCoursesPagination,
        setParams: setAllCoursesParams
    } = useFetchCourses({
        category: selectedCategory,
        search: searchQuery,
        page: 1,
        limit: 6
    });

    // CRITICAL: Call useFetchRecommendedCourses. It will internally manage its fetch based on AuthContext's state.
    const {
        recommendedCourses,
        isLoading: recommendedCoursesLoading,
        error: recommendedCoursesError
    } = useFetchRecommendedCourses(selectedCategory, 3); // Pass category and limit; auth logic is inside the hook

    const categories = [
        { id: "all", name: "All Courses" },
        { id: "programming", name: "Programming" },
        { id: "design", name: "Design" },
        { id: "business", name: "Business" },
        { id: "marketing", name: "Marketing" },
        { id: "data-science", name: "Data Science" },
        { id: "photography", name: "Photography" },
        { id: "music", name: "Music" },
        { id: "language", name: "Language" },
        { id: "health", name: "Health & Fitness" },
        { id: "other", name: "Other" }
    ];

    useEffect(() => {
        setAllCoursesParams({ category: selectedCategory, search: searchQuery, page: 1 });
    }, [selectedCategory, searchQuery, setAllCoursesParams]);

    const handleLoginRedirect = () => {
        navigate(createPageUrl("Login"));
    };

    // Overall loading state for the entire page
    // This will show a loader until AuthContext is done loading AND recommended courses are fetched.
    const overallLoading = authContextLoading || recommendedCoursesLoading || allCoursesLoading;
    const overallError = allCoursesError || recommendedCoursesError;

    if (overallLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (overallError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Error Loading Homepage Data</h2>
                    <p>Something went wrong while fetching course data.</p>
                    <p className="text-sm mt-2">{overallError.message || 'Please try again later.'}</p>
                </div>
            </div>
        );
    }

    // Determine if the user is a student (or unauthenticated for general browsing)
    // This now correctly relies on `isAuthenticated` from AuthContext
    const canViewCourseDetails = !isAuthenticated || user?.role === 'student';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            {/* Hero Section */}
            <HeroSection user={user} onAuthAction={handleLoginRedirect} />

            {/* Stats Section */}
            <StatsSection />

            {/* Search and Filter Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Discover Your Next Learning Adventure
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Explore thousands of courses taught by industry experts
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-8">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Search courses, instructors, or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {categories.map((category) => (
                        <Button
                            key={category.id}
                            variant={
                                selectedCategory === category.id ? "default" : "outline"
                            }
                            onClick={() => setSelectedCategory(category.id)}
                            className="rounded-full px-6 py-2 text-sm font-medium transition-all hover:scale-105"
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>

                {/* Recommended Courses Section */}
                {recommendedCourses.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-teal-500 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Recommended for You
                            </h3>
                            <Link to={createPageUrl("Courses")} className="ml-auto text-blue-600 dark:text-blue-400 hover:underline text-sm">
                                View All
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recommendedCourses.map((course) => (
                                canViewCourseDetails ? (
                                    <Link key={course._id} to={createPageUrl("CourseDetail", { id: course._id })}>
                                        <CourseCard course={course} />
                                    </Link>
                                ) : (
                                    <CourseCard key={course._id} course={course} />
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* All Courses Section - Now with a CTA to the dedicated CoursesPage */}
                <div className="text-center py-12">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Explore Our Full Catalog
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                        Find exactly what you're looking for across all categories and subjects.
                    </p>
                    <Link to={createPageUrl("Courses")}>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                            <BookOpen className="w-5 h-5 mr-2" />
                            Browse All Courses
                        </Button>
                    </Link>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Start Teaching?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of educators sharing their knowledge on LectureMate
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="bg-white text-blue-600 hover:bg-gray-100"
                            onClick={() => navigate(createPageUrl("Login"))}
                        >
                            Become an Educator
                        </Button>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="bg-white border-white text-blue-600 hover:bg-gray-100"
                            onClick={() => navigate(createPageUrl("AboutEducator"))}
                        >
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
