import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Lucide React Icons
import {
    ArrowLeft,
    Plus,
    Trash2,
    Image,
    Play,
    Save,
    Eye,
    Loader2 // Added Loader2 for loading indicator
} from "lucide-react";

// Toast notifications
import { toast } from 'react-toastify';

// Custom Hooks and Context
import { useCreateCourse } from '@/hooks/useCreateCourse'; // Updated hook
import { useAuth } from '@/context/AuthContext';
import { getMyCourseById } from '@/api/educator'; // Fetch single course for edit mode, scoped to the logged-in educator

export default function CreateCourse() {
    const navigate = useNavigate();
    const location = useLocation();
    const { submitCourse, isCreating, error: submitError } = useCreateCourse(); // Renamed createCourse to submitCourse
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Determine if we are in edit mode by checking URL params
    const editingCourseId = new URLSearchParams(location.search).get('id');
    const isEditMode = !!editingCourseId;

    const [courseData, setCourseData] = useState({
        title: "",
        description: "",
        category: "",
        subject: "",
        level: "Beginner",
        price: 0,
        thumbnail: null, // Will hold File object for new upload, or URL string for existing
        chapters: [],
        tags: [],
        contentLinks: [],
        // No need for 'status' here, it's set on submission
    });

    const [tagsInput, setTagsInput] = useState("");
    const [contentLinksInput, setContentLinksInput] = useState("");
    const [currentStep, setCurrentStep] = useState(1);
    const [thumbnailPreview, setThumbnailPreview] = useState(null); // For displaying image preview (File URL or existing image URL)
    const [isLoadingCourseData, setIsLoadingCourseData] = useState(isEditMode); // New loading state for fetching course data in edit mode

    // --- EFFECT TO PRE-FILL DATA (from AI Generator or Edit Mode) ---
    useEffect(() => {
        const fetchAndPrefillCourse = async () => {
            if (isEditMode && editingCourseId) {
                // Case: Edit Mode - Fetch existing course data
                setIsLoadingCourseData(true);
                try {
                    const courseToEdit = await getMyCourseById(editingCourseId);
                    if (courseToEdit) {
                        setCourseData({
                            title: courseToEdit.title || "",
                            description: courseToEdit.description || "",
                            category: courseToEdit.category || "",
                            subject: courseToEdit.subject || "",
                            level: courseToEdit.level || "Beginner",
                            price: courseToEdit.price || 0,
                            thumbnail: courseToEdit.thumbnail || null, // Keep original URL
                            chapters: courseToEdit.chapters || [],
                            tags: courseToEdit.tags || [],
                            contentLinks: courseToEdit.contentLinks || [],
                        });
                        // Set thumbnail preview to existing URL for display
                        setThumbnailPreview(courseToEdit.thumbnail || null);
                        setTagsInput(courseToEdit.tags?.join(', ') || "");
                        setContentLinksInput(courseToEdit.contentLinks?.join('\n') || "");
                    } else {
                        toast.error("Course not found for editing.");
                        navigate(createPageUrl("EducatorDashboard"), { replace: true });
                    }
                } catch (error) {
                    console.error("Failed to fetch course for editing:", error);
                    toast.error("Failed to load course for editing. Please try again.");
                    navigate(createPageUrl("EducatorDashboard"), { replace: true });
                } finally {
                    setIsLoadingCourseData(false);
                }
            } else if (location.state?.prefillCourseData) {
                // Case: AI Generator prefill (only if not in edit mode)
                const { prefillCourseData } = location.state;
                setCourseData(prevData => {
                    const newChapters = prefillCourseData.chapters?.map(aiChapter => ({
                        title: aiChapter.title,
                        // FIX: Directly use aiChapter.lectures as they are already correctly formatted objects
                        lectures: aiChapter.lectures || []
                    })) || [];

                    return {
                        ...prevData,
                        title: prefillCourseData.title || prevData.title,
                        description: prefillCourseData.description || prevData.description,
                        level: prefillCourseData.level || prevData.level || "Beginner",
                        chapters: newChapters,
                    };
                });
                // Clear the state after use to prevent re-applying on refresh
                navigate(location.pathname, { replace: true, state: {} });
                setIsLoadingCourseData(false); // No async fetch needed here
            } else {
                // Case: Fresh "Create New Course" mode
                setIsLoadingCourseData(false);
            }
        };

        // Only attempt to fetch/prefill once auth status is known
        if (!authLoading) {
            fetchAndPrefillCourse();
        }
    }, [location.state, navigate, editingCourseId, isEditMode, authLoading]);


    const steps = [
        { id: 1, name: "Basic Info", description: "Course details and settings" },
        { id: 2, name: "Curriculum", description: "Add chapters and lectures" },
        { id: 3, name: "Review", description: "Review and publish" }
    ];

    const categories = [
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

    const levels = [
        { id: "Beginner", name: "Beginner" },
        { id: "Intermediate", name: "Intermediate" },
        { id: "Advanced", name: "Advanced" }
    ];

    // Handle changes for generic input fields (except tags/contentLinks)
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Handle changes for Select components
    const handleSelectChange = useCallback((name, value) => {
        setCourseData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Handle thumbnail file input change
    const handleThumbnailChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            setCourseData(prev => ({ ...prev, thumbnail: file })); // Set the File object
            setThumbnailPreview(URL.createObjectURL(file)); // Create URL for preview
        } else {
            // If file is cleared, reset thumbnail in state and preview
            setCourseData(prev => ({ ...prev, thumbnail: null }));
            setThumbnailPreview(null);
        }
    }, []);

    // Handle tags input change
    const handleTagsChange = useCallback((e) => {
        const value = e.target.value;
        setTagsInput(value);
        setCourseData(prev => ({
            ...prev,
            tags: value.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        }));
    }, []);

    // Handle content links input change
    const handleContentLinksChange = useCallback((e) => {
        const value = e.target.value;
        setContentLinksInput(value);

        const parsedLinks = value.split('\n')
                                .map(link => link.trim())
                                .filter(link => link !== '')
                                .map(link => {
                                    if (!/^https?:\/\//i.test(link) && !/^ftp:\/\//i.test(link)) {
                                        return 'https://' + link;
                                    }
                                    return link;
                                })
                                .filter(link => {
                                    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
                                    return urlRegex.test(link);
                                });

        setCourseData(prev => ({
            ...prev,
            contentLinks: parsedLinks
        }));
    }, []);


    // --- Chapter Management ---
    const addChapter = useCallback(() => {
        setCourseData(prev => ({
            ...prev,
            chapters: [...prev.chapters, { title: "", lectures: [] }]
        }));
    }, []);

    const updateChapter = useCallback((index, field, value) => {
        setCourseData(prev => ({
            ...prev,
            chapters: prev.chapters.map((chapter, i) =>
                i === index ? { ...chapter, [field]: value } : chapter
            )
        }));
    }, []);

    const removeChapter = useCallback((index) => {
        setCourseData(prev => ({
            ...prev,
            chapters: prev.chapters.filter((_, i) => i !== index)
        }));
    }, []);

    // --- Lecture Management ---
    const addLecture = useCallback((chapterIndex) => {
        setCourseData(prev => ({
            ...prev,
            chapters: prev.chapters.map((chapter, i) =>
                i === chapterIndex
                    ? {
                        ...chapter,
                        lectures: [...chapter.lectures, {
                            title: "",
                            video_url: "",
                            duration: 0,
                            is_preview_free: false
                        }]
                    }
                    : chapter
            )
        }));
    }, []);

    const updateLecture = useCallback((chapterIndex, lectureIndex, field, value) => {
        setCourseData(prev => ({
            ...prev,
            chapters: prev.chapters.map((chapter, i) =>
                i === chapterIndex
                    ? {
                        ...chapter,
                        lectures: chapter.lectures.map((lecture, j) =>
                            j === lectureIndex ? { ...lecture, [field]: value } : lecture
                        )
                    }
                    : chapter
            )
        }));
    }, []);

    const removeLecture = useCallback((chapterIndex, lectureIndex) => {
        setCourseData(prev => ({
            ...prev,
            chapters: prev.chapters.map((chapter, i) =>
                i === chapterIndex
                    ? {
                        ...chapter,
                        lectures: chapter.lectures.filter((_, j) => j !== lectureIndex)
                    }
                    : chapter
            )
        }));
    }, []);

    // Calculate total duration of all lectures in the course
    const calculateTotalDuration = useCallback(() => {
        return courseData.chapters.reduce((total, chapter) =>
            total + chapter.lectures.reduce((sum, lecture) => sum + (lecture.duration || 0), 0), 0
        );
    }, [courseData.chapters]);

    // Handle form submission (save draft or publish)
    const handleSubmit = useCallback(async (isDraft = false) => {
        // Client-side validation for Step 1
        if (currentStep === 1) {
            // If editing and thumbnail is still a URL string, allow it.
            // If it's a new File object, or null (meaning no new file selected), require it.
            const isThumbnailProvided = courseData.thumbnail instanceof File || typeof courseData.thumbnail === 'string';

            if (!courseData.title.trim() || !courseData.description.trim() || !courseData.category.trim() || !courseData.subject.trim() || courseData.price === null || isNaN(courseData.price) || courseData.price < 0 || !isThumbnailProvided) {
                toast.error('Please fill in all required basic course details correctly, including Subject, Category, Price, and upload/confirm a thumbnail.');
                return;
            }
        }

        // Client-side validation for Step 2
        if (currentStep === 2) {
            if (courseData.chapters.length === 0) {
                toast.error('Please add at least one chapter to your course.');
                return;
            }
            for (const chapter of courseData.chapters) {
                if (!chapter.title.trim()) {
                    toast.error(`All chapters must have a title. Check chapter ${courseData.chapters.indexOf(chapter) + 1}.`);
                    return;
                }
                if (chapter.lectures.length === 0) {
                    toast.error(`Chapter "${chapter.title}" must have at least one lecture.`);
                    return;
                }
                for (const lecture of chapter.lectures) {
                    if (!lecture.title.trim() || !lecture.video_url.trim() || lecture.duration === null || isNaN(lecture.duration) || lecture.duration <= 0) {
                        toast.error(`All lectures in chapter "${chapter.title}" must have a title, video URL, and a valid duration (greater than 0).`);
                        return;
                    }
                }
            }
        }

        if (authLoading || isLoadingCourseData || isCreating) { // Add isCreating to disable during submission
            toast.info("Please wait, loading data or processing request...");
            return;
        }

        if (!isAuthenticated || !user || !user._id) {
            toast.error("You must be logged in as a valid educator to create/edit a course.");
            navigate(createPageUrl("Login"));
            return;
        }

        try {
            const totalDuration = calculateTotalDuration();

            const formData = new FormData();
            // Append basic fields
            formData.append('title', courseData.title);
            formData.append('description', courseData.description);
            formData.append('category', courseData.category);
            formData.append('subject', courseData.subject);
            formData.append('level', courseData.level);
            formData.append('price', courseData.price);
            formData.append('duration', totalDuration);
            formData.append('status', isDraft ? 'Draft' : 'Pending Review'); // Status for new or updated course

            // Handle thumbnail: send File object if newly selected, otherwise it won't be appended.
            // If it's a URL (existing thumbnail), we do NOT append it to FormData unless your
            // backend expects a string for existing URLs, which is less common for image uploads.
            // The backend's `updateCourse` should implicitly keep the old thumbnail if no new file is uploaded.
            if (courseData.thumbnail instanceof File) {
                formData.append('thumbnail', courseData.thumbnail);
            }


            // Append JSON stringified arrays
            formData.append('chapters', JSON.stringify(courseData.chapters));
            formData.append('tags', JSON.stringify(courseData.tags));
            formData.append('contentLinks', JSON.stringify(courseData.contentLinks));

            // Educator ID is crucial for both create and update to verify ownership
            formData.append('educator', user._id);

            // Call the useCreateCourse hook's function to send data to backend
            // Pass editingCourseId if in edit mode
            const savedCourse = await submitCourse(formData, editingCourseId);

            if (savedCourse) {
                navigate(createPageUrl("EducatorDashboard"));
            }
        } catch (error) {
            console.error("Error during course submission in component:", error);
            // Error handling is mostly managed by useCreateCourse, but a fallback here
            if (!submitError) {
                toast.error(error.message || "Failed to save course. Please try again.");
            }
        }
    }, [
        courseData,
        calculateTotalDuration,
        submitCourse, // Now submitCourse from useCreateCourse
        navigate,
        currentStep,
        user,
        isAuthenticated,
        authLoading,
        isLoadingCourseData,
        submitError,
        isEditMode,
        editingCourseId
    ]);

    // Show loading for initial course data fetch in edit mode or auth loading
    if (authLoading || isLoadingCourseData || isCreating) { // isCreating added to show spinner during submission
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <p>
                    {isCreating ? "Saving course..." : "Loading course data, please wait..."}
                </p>
            </div>
        );
    }

    // Redirect if not authenticated AFTER loading is complete
    if (!isAuthenticated || !user || !user._id) {
        toast.error("You must be logged in to create or edit a course.");
        navigate(createPageUrl("Login"));
        return null; // Don't render the form while redirecting
    }

    // --- Main Component JSX ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(createPageUrl("EducatorDashboard"))}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {isEditMode ? "Edit Course" : "Create New Course"}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {isEditMode ? "Update your course details" : "Share your knowledge with the world"}
                        </p>
                    </div>
                </div>

                {/* Progress Steps Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    step.id === currentStep
                                        ? 'bg-blue-600 text-white'
                                        : step.id < currentStep
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {step.id}
                                </div>
                                <div className="ml-3">
                                    <p className="font-medium text-gray-900 dark:text-white">{step.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                                </div>
                                {step.id < steps.length && (
                                    <div className={`w-24 h-1 mx-4 ${
                                        step.id < currentStep ? 'bg-green-600' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Course Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Course Title
                                </label>
                                <Input
                                    name="title"
                                    value={courseData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Complete React Development Course"
                                    className="text-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <Textarea
                                    name="description"
                                    value={courseData.description}
                                    onChange={handleChange}
                                    placeholder="Describe what students will learn in this course..."
                                    rows={4}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subject
                                </label>
                                <Input
                                    name="subject"
                                    value={courseData.subject}
                                    onChange={handleChange}
                                    placeholder="e.g., Web Development, Data Science"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <Select value={courseData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                                        <SelectTrigger required>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Level
                                    </label>
                                    <Select value={courseData.level} onValueChange={(value) => handleSelectChange('level', value)}>
                                        <SelectTrigger required>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {levels.map((level) => (
                                                <SelectItem key={level.id} value={level.id}>
                                                    {level.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Price ($)
                                    </label>
                                    <Input
                                        name="price"
                                        type="number"
                                        min="0"
                                        value={courseData.price}
                                        onChange={(e) => setCourseData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0 for free"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Course Thumbnail - Now a File Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Course Thumbnail
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                                       {thumbnailPreview ? (
                                            <img
                                                src={thumbnailPreview}
                                                alt="Thumbnail Preview"
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <Image className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <Input
                                        name="thumbnail"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                        className="flex-grow"
                                        id="thumbnail-file-input"
                                    />
                                </div>
                                {isEditMode && typeof courseData.thumbnail === 'string' && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Current thumbnail: <a href={courseData.thumbnail} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate inline-block max-w-xs">{courseData.thumbnail}</a> (Upload new file to change)
                                    </p>
                                )}
                            </div>

                            {/* Tags Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tags (comma-separated)
                                </label>
                                <Input
                                    name="tags"
                                    value={tagsInput}
                                    onChange={handleTagsChange}
                                    placeholder="e.g., react, javascript, web development"
                                />
                                {courseData.tags.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Current tags: {courseData.tags.join(', ')}
                                    </p>
                                )}
                            </div>

                            {/* Content Links Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Additional Content Links (one URL per line)
                                </label>
                                <Textarea
                                    name="contentLinks"
                                    value={contentLinksInput}
                                    onChange={handleContentLinksChange}
                                    placeholder="e.g.,
https://example.com/resource1.pdf
https://github.com/your-repo
"
                                    rows={3}
                                />
                                {courseData.contentLinks.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        <p>Parsed links:</p>
                                        <ul className="list-disc list-inside">
                                            {courseData.contentLinks.map((link, idx) => (
                                                <li key={idx} className="truncate">{link}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>


                            <div className="flex justify-end">
                              <Button
                                    onClick={() => {
                                        // Re-run validation before proceeding to next step
                                        const isThumbnailProvided = courseData.thumbnail instanceof File || typeof courseData.thumbnail === 'string';

                                        if (!courseData.title.trim() || !courseData.description.trim() || !courseData.category.trim() || !courseData.subject.trim() || courseData.price === null || isNaN(courseData.price) || courseData.price < 0 || !isThumbnailProvided) {
                                            toast.error('Please fill in all required basic course details correctly, including Subject, Category, Price, and upload/confirm a thumbnail.');
                                        } else {
                                            setCurrentStep(2);
                                        }
                                    }}
                                    disabled={isCreating}
                                >
                                    Next: Add Curriculum
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Curriculum */}
                {currentStep === 2 && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Course Curriculum</CardTitle>
                                <Button onClick={addChapter} variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Chapter
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {courseData.chapters.length > 0 ? (
                                <div className="space-y-6">
                                    {courseData.chapters.map((chapter, chapterIndex) => (
                                        <div key={chapter._id || chapterIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <Input
                                                    value={chapter.title}
                                                    onChange={(e) => updateChapter(chapterIndex, 'title', e.target.value)}
                                                    placeholder="Chapter title"
                                                    className="flex-1 mr-4"
                                                    required
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeChapter(chapterIndex)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {chapter.lectures.map((lecture, lectureIndex) => (
                                                    // Use lecture._id as key if available, fallback to index
                                                    <div key={lecture._id || lectureIndex} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                            <Input
                                                                value={lecture.title}
                                                                onChange={(e) => updateLecture(chapterIndex, lectureIndex, 'title', e.target.value)}
                                                                placeholder="Lecture title"
                                                                required
                                                            />
                                                            <Input
                                                                value={lecture.video_url}
                                                                onChange={(e) => updateLecture(chapterIndex, lectureIndex, 'video_url', e.target.value)}
                                                                placeholder="Video URL"
                                                                type="url"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Input
                                                                type="number"
                                                                value={lecture.duration}
                                                                onChange={(e) => updateLecture(chapterIndex, lectureIndex, 'duration', parseInt(e.target.value) || 0)}
                                                                placeholder="Duration (minutes)"
                                                                className="w-32"
                                                                min="0"
                                                                required
                                                            />
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={lecture.is_preview_free}
                                                                    onChange={(e) => updateLecture(chapterIndex, lectureIndex, 'is_preview_free', e.target.checked)}
                                                                />
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                    Free preview
                                                                </span>
                                                            </label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeLecture(chapterIndex, lectureIndex)}
                                                                className="text-red-500 hover:text-red-700 ml-auto"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addLecture(chapterIndex)}
                                                    className="w-full"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Lecture
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        No chapters yet
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Add your first chapter to get started
                                    </p>
                                    <Button onClick={addChapter}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Chapter
                                    </Button>
                                </div>
                            )}

                            <div className="flex justify-between mt-8">
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => {
                                        // Re-run validation before proceeding to next step
                                        if (courseData.chapters.length === 0 || courseData.chapters.some(ch => !ch.title.trim() || ch.lectures.length === 0 || ch.lectures.some(lec => !lec.title.trim() || !lec.video_url.trim() || lec.duration <= 0))) {
                                            toast.error('Please ensure all chapters and lectures have valid titles, video URLs, and durations (greater than 0).');
                                        } else {
                                            setCurrentStep(3);
                                        }
                                    }}
                                    disabled={isCreating}
                                >
                                    Next: Review
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Review & Publish</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Course Summary */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Course Summary
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Title</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{courseData.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Subject</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{courseData.subject}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {courseData.price === 0 ? 'Free' : `$${courseData.price}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{courseData.level}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Chapters</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{courseData.chapters.length}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Duration</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {Math.floor(calculateTotalDuration() / 60)}h {calculateTotalDuration() % 60}m
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Tags</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {courseData.tags.length > 0 ? courseData.tags.join(', ') : 'No tags'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Content Links</p>
                                            <ul className="font-medium text-gray-900 dark:text-white list-disc list-inside">
                                                {courseData.contentLinks.length > 0 ? (
                                                    courseData.contentLinks.map((link, idx) => <li key={idx} className="truncate">{link}</li>)
                                                ) : (
                                                    'No links'
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Chapters Overview */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Curriculum Overview
                                    </h3>
                                    <div className="space-y-3">
                                        {courseData.chapters.map((chapter, index) => (
                                            <div key={chapter._id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                    Chapter {index + 1}: {chapter.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {chapter.lectures.length} lectures • {chapter.lectures.reduce((sum, l) => sum + (l.duration || 0), 0)} minutes
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between mt-8">
                                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                                        Previous
                                    </Button>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSubmit(true)} // Save as Draft
                                            disabled={isCreating}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {isCreating ? 'Saving...' : 'Save as Draft'}
                                        </Button>
                                        <Button
                                            onClick={() => handleSubmit(false)} // Publish Course
                                            disabled={isCreating}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            {isCreating ? 'Publishing...' : 'Publish Course'}
                                        </Button>
                                    </div>
                                </div>
                                {submitError && ( // Use submitError from the hook
                                    <div className="text-red-500 mt-4 text-center">
                                        Error: {submitError.message || 'Something went wrong while saving/publishing the course.'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
