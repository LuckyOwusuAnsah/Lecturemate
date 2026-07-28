import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Lucide React Icons
import {
    Play,
    Clock,
    Users,
    Star,
    Award,
    BookOpen,
    ChevronRight,
    CheckCircle,
    ArrowLeft,
    Heart,
    Share2,
    Loader2,
    AlertCircle,
    Lock
} from "lucide-react";

// Components
import VideoPlayer from "../../components/VideoPlayer";
import ReviewSection from "../../components/ReviewSection"; 
import DiscussionSection from "../../components/DiscussionSection";
import QuizSection from "../../components/QuizSection";
import CertificateModal from "../../components/CertificateModal";

// Custom Hooks
import { useAuth } from '@/context/AuthContext';
import { useFetchCourseDetail } from '@/hooks/useFetchCourseDetail';
import { useCourseProgress } from '@/hooks/useCourseProgress'; // This hook will be implicitly updated by backend change
import { toast } from 'react-toastify';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/api/student';

export default function CourseDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const courseId = params.get("id");

    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const {
        course,
        isLoading: courseLoading,
        error: courseError,
        refetchCourse
    } = useFetchCourseDetail(courseId);

    const {
        enrollment, // This will be null if not enrolled due to backend change
        completedLectures,
        progressPercentage,
        isCourseCompleted,
        isLoadingProgress,
        enroll,
        markLectureAsComplete,
        isLectureCompleted
    } = useCourseProgress(courseId, user?._id, course?.chapters);

    const [videoToPlayInModal, setVideoToPlayInModal] = useState(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [activeTab, setActiveTab] = useState('curriculum');
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);

    useEffect(() => {
        if (!courseId) {
            return;
        }
        refetchCourse();
    }, [courseId, refetchCourse]);

    useEffect(() => {
        if (!courseId || !isAuthenticated) {
            setIsWishlisted(false);
            return;
        }
        let isCancelled = false;
        getWishlist()
            .then((wishlist) => {
                if (isCancelled) return;
                setIsWishlisted(wishlist.some((c) => c._id === courseId));
            })
            .catch(() => {
                // Silently ignore - wishlist state just stays unknown/false
            });
        return () => {
            isCancelled = true;
        };
    }, [courseId, isAuthenticated]);

    const handleToggleWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            toast.info("Please log in to use your wishlist.");
            navigate(createPageUrl("Login"));
            return;
        }

        setIsWishlistLoading(true);
        try {
            if (isWishlisted) {
                await removeFromWishlist(courseId);
                setIsWishlisted(false);
                toast.success("Removed from wishlist");
            } else {
                await addToWishlist(courseId);
                setIsWishlisted(true);
                toast.success("Added to wishlist");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Couldn't update your wishlist. Please try again.");
        } finally {
            setIsWishlistLoading(false);
        }
    }, [isAuthenticated, isWishlisted, courseId, navigate]);

    const allLectures = course?.chapters?.flatMap(chapter => chapter.lectures) || [];

    const handleEnroll = useCallback(async () => {
        // Ensure user is authenticated before attempting to enroll
        if (!isAuthenticated) {
            toast.info("Please log in to enroll in courses.");
            navigate(createPageUrl("Login")); // Redirect to login if not authenticated
            return;
        }

        // The 'enroll' function from useCourseProgress should handle its own loading/errors/toasts
        const success = await enroll(courseId, course?.price || 0);
        if (success && course.price > 0) {
            // Only navigate to payment if enrollment was successful AND price > 0
            navigate(createPageUrl("PaymentPage", { courseId: courseId }));
        } else if (success && course.price === 0) {
            // For free courses, directly open the first lecture if successful
            const firstLecture = allLectures[0];
            if (firstLecture) {
                setVideoToPlayInModal(firstLecture);
            } else {
                toast.info("Course enrolled! No lectures found to play immediately.");
            }
        }
    }, [enroll, courseId, course?.price, navigate, allLectures, isAuthenticated]);


    const handleLectureClick = useCallback((lecture) => {
        // Lecture is accessible if enrolled OR if it's a free preview
        const isAccessible = enrollment || lecture.is_preview_free;
        if (isAccessible) {
            setVideoToPlayInModal(lecture);
        } else {
            // No error toast for "not enrolled", just informational
            toast.info("Please enroll in the course to access this lecture or watch a free preview.");
        }
    }, [enrollment]);

    const handleVideoComplete = useCallback(async () => {
        if (videoToPlayInModal) {
            const success = await markLectureAsComplete(videoToPlayInModal._id, course?.chapters);
            if (success) {
                toast.success(`${videoToPlayInModal.title} marked as complete!`);
                // Check if the course is completed immediately after marking the lecture
                // The useCourseProgress hook should update isCourseCompleted based on new progress
                if (isCourseCompleted) { // This state is from the useCourseProgress hook
                    setShowCertificate(true);
                }
            } else {
                toast.error("Failed to mark lecture as complete.");
            }
        }
    }, [markLectureAsComplete, isCourseCompleted, videoToPlayInModal, course?.chapters]);

    const handleNextLecture = useCallback(() => {
        if (!videoToPlayInModal) return;
        const currentIndex = allLectures.findIndex(lec => lec._id === videoToPlayInModal._id);
        if (currentIndex !== -1 && currentIndex < allLectures.length - 1) {
            const nextLecture = allLectures[currentIndex + 1];
            const isAccessible = enrollment || nextLecture.is_preview_free;
            if (isAccessible) {
                setVideoToPlayInModal(nextLecture);
            } else {
                toast.info("Enroll in the course to access the next lecture!");
                setVideoToPlayInModal(null); // Stop playing if next is not accessible
            }
        } else {
            toast.info("You've reached the end of the course lectures.");
            setVideoToPlayInModal(null);
        }
    }, [videoToPlayInModal, allLectures, enrollment]);

    const handlePreviousLecture = useCallback(() => {
        if (!videoToPlayInModal) return;
        const currentIndex = allLectures.findIndex(lec => lec._id === videoToPlayInModal._id);
        if (currentIndex > 0) {
            const previousLecture = allLectures[currentIndex - 1];
            setVideoToPlayInModal(previousLecture);
        } else {
            toast.info("This is the first lecture.");
        }
    }, [videoToPlayInModal, allLectures]);

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    if (!courseId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Course ID is missing from URL.
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please ensure you navigate to this page with a valid course ID in the URL (e.g., `/CourseDetail?id=YOUR_COURSE_ID`).
                    </p>
                    <Button onClick={() => navigate(createPageUrl("Home"))}>
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    if (authLoading || courseLoading || isLoadingProgress) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">Loading course details...</p>
            </div>
        );
    }

    if (courseError || !course) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Course not found or an error occurred.
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {courseError?.message || "The course you are looking for does not exist or could not be loaded."}
                    </p>
                    <Button onClick={() => navigate(createPageUrl("Home"))}>
                        Back to Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Course Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline">
                                    {(course.category || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <Badge variant="outline">{course.level}</Badge>
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                {course.title}
                            </h1>

                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                                {course.description}
                            </p>

                            <div className="flex items-center gap-6 mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {course.instructor_name?.[0]?.toUpperCase() || course.educator?.name?.[0]?.toUpperCase() || course.educator?.email?.[0]?.toUpperCase() || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {course.instructor_name || course.educator?.name || course.educator?.email || 'Unknown Instructor'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Instructor
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatDuration(course.duration || 0)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {course.total_enrollments || 0} students
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        {course.average_rating || course.ratingsAverage || 0} rating
                                    </div>
                                </div>
                            </div>

                            {/* Only show progress if enrolled */}
                            {enrollment && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                            Your Progress
                                        </span>
                                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                            {Math.round(progressPercentage)}%
                                        </span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-2" />
                                    {isCourseCompleted && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Award className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">
                                                Course completed!
                                            </span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() => setShowCertificate(true)}
                                                className="text-green-600 p-0 h-auto"
                                            >
                                                View Certificate
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Enrollment Card */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4 border-0 shadow-lg">
                                <CardHeader className="p-0">
                                    {/* Display Course Thumbnail */}
                                    <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center rounded-t-lg overflow-hidden">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover rounded-t-lg"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/640x360/cccccc/333333?text=Course+Thumbnail'; }}
                                            />
                                        ) : (
                                            // Fallback if no thumbnail
                                            <Play className="w-12 h-12 text-white opacity-70" />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="text-center mb-6">
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                            {course.price === 0 ? "Free" : `$${course.price}`}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Lifetime access
                                        </p>
                                    </div>

                                    {/* Conditional rendering for Enroll Button or Course Content */}
                                    {enrollment ? (
                                        <div className="space-y-3">
                                            <Button
                                                className="w-full"
                                                onClick={() => {
                                                    const firstLecture = allLectures[0];
                                                    if (firstLecture) {
                                                        setVideoToPlayInModal(firstLecture);
                                                    } else {
                                                        toast.info("No lectures found for this course.");
                                                    }
                                                }}
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Continue Learning
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handleToggleWishlist}
                                                disabled={isWishlistLoading}
                                            >
                                                <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                                                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <Button
                                                className="w-full"
                                                onClick={handleEnroll}
                                                disabled={isLoadingProgress || !isAuthenticated} // Disable if loading or not authenticated
                                            >
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                {isLoadingProgress ? 'Loading status...' : !isAuthenticated ? 'Login to Enroll' : 'Enroll Now'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handleToggleWishlist}
                                                disabled={isWishlistLoading}
                                            >
                                                <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                                                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                            </Button>
                                            <Button variant="outline" className="w-full">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Share Course
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs for Curriculum, Reviews, Discussions */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                        className={`px-4 py-2 text-lg font-medium ${activeTab === 'curriculum' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        onClick={() => setActiveTab('curriculum')}
                    >
                        Curriculum
                    </button>
                    <button
                        className={`ml-4 px-4 py-2 text-lg font-medium ${activeTab === 'reviews' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Reviews
                    </button>
                    <button
                        className={`ml-4 px-4 py-2 text-lg font-medium ${activeTab === 'discussions' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        onClick={() => setActiveTab('discussions')}
                    >
                        Discussions
                    </button>
                    <button
                        className={`ml-4 px-4 py-2 text-lg font-medium ${activeTab === 'quizzes' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        onClick={() => setActiveTab('quizzes')}
                    >
                        Quizzes
                    </button>
                </div>
            </div>


            {/* Content based on active tab */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {activeTab === 'curriculum' && (
                            <Card className="mb-8 border-0">
                                <CardHeader>
                                    <CardTitle>Course Curriculum</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {course.chapters?.length > 0 ? (
                                            course.chapters.map((chapter, chapterIndex) => (
                                                <div key={chapter._id || chapterIndex} className="border rounded-lg overflow-hidden">
                                                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {chapter.title}
                                                        </h3>
                                                    </div>
                                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                        {chapter.lectures?.map((lecture) => {
                                                            const isAccessible = enrollment || lecture.is_preview_free;
                                                            const isCompleted = isLectureCompleted(lecture._id);

                                                            return (
                                                                <div
                                                                    key={lecture._id}
                                                                    className={`px-4 py-3 flex items-center justify-between ${
                                                                        isAccessible ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer' : 'cursor-not-allowed opacity-60'
                                                                    }`}
                                                                    onClick={() => handleLectureClick(lecture)}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {isCompleted ? (
                                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                                        ) : isAccessible ? (
                                                                            <Play className="w-5 h-5 text-gray-400" />
                                                                        ) : (
                                                                            <Lock className="w-5 h-5 text-gray-400" />
                                                                        )}
                                                                        <div>
                                                                            <p className="font-medium text-gray-900 dark:text-white">
                                                                                {lecture.title}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                                <Clock className="w-3 h-3" />
                                                                                {formatDuration(lecture.duration || 0)}
                                                                                {lecture.is_preview_free && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        Preview
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No curriculum available for this course yet.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'reviews' && (
                            <ReviewSection
                                courseId={course._id}
                                userEnrollment={enrollment}
                            />
                        )}

                        {activeTab === 'discussions' && (
                            <DiscussionSection courseId={course._id} />
                        )}

                        {activeTab === 'quizzes' && (
                            <QuizSection courseId={course._id} />
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="mb-6 border-0">
                            <CardHeader>
                                <CardTitle>Course Includes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatDuration(course.duration || 0)} on-demand video
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {course.chapters?.length || 0} chapters
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Certificate of completion
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Access to community
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Video Player Modal */}
            {videoToPlayInModal && (
                <VideoPlayer
                    video={videoToPlayInModal}
                    allLectures={allLectures}
                    onClose={() => setVideoToPlayInModal(null)}
                    onComplete={handleVideoComplete}
                    isCompleted={isLectureCompleted(videoToPlayInModal._id)}
                    onNext={handleNextLecture}
                    onPrevious={handlePreviousLecture}
                />
            )}

            {/* Certificate Modal */}
            {showCertificate && isCourseCompleted && (
                <CertificateModal
                    course={course}
                    user={user}
                    onClose={() => setShowCertificate(false)}
                />
            )}
        </div>
    );
}
