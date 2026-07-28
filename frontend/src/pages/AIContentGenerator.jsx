// frontend/src/pages/AIContentGenerator.jsx
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

// Import UI components (assuming they are from a UI library like shadcn/ui)
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Sparkles,
  FileText,
  Image, // Used for thumbnail icon
  Video, // Used for quiz icon
  BookOpen, // Used for course outline icon
  Wand2,
  Download, // Potentially for image download
  Copy,
  RefreshCw
} from "lucide-react";

// Import custom hooks for AI features
import {
  useCourseOutlineGenerator,
  useCourseDescriptionWriter,
  useCourseThumbnailIdeaCreator, // This hook now provides a thumbnailImage
  useQuizAssessmentBuilder
}  from "@/hooks/useAi"; // Assuming this path is correct after previous fixes

// Import AuthContext to get user role
import { useAuth } from "../context/AuthContext";

export default function AIContentGenerator() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate(); // Initialize navigate hook
  const [selectedTool, setSelectedTool] = useState("course-outline");

  // Initialize all AI feature hooks
  const outlineHook = useCourseOutlineGenerator();
  const descriptionHook = useCourseDescriptionWriter();
  const thumbnailHook = useCourseThumbnailIdeaCreator(); // This hook now returns thumbnailImage
  const quizHook = useQuizAssessmentBuilder();

  // Determine which hook is active based on selectedTool
  const activeHook = (() => {
    switch (selectedTool) {
      case "course-outline": return outlineHook;
      case "course-description": return descriptionHook;
      case "thumbnail-generator": return thumbnailHook;
      case "quiz-generator": return quizHook;
      default: return {}; // Fallback
    }
  })();

  const { isLoading, error } = activeHook; // Get isLoading and error from the active hook

  const tools = [
    {
      id: "course-outline",
      name: "Course Outline Generator",
      description: "Generate a comprehensive course structure with chapters and lessons",
      icon: BookOpen
    },
    {
      id: "course-description",
      name: "Course Description Writer",
      description: "Create compelling course descriptions that attract students",
      icon: FileText
    },
    {
      id: "thumbnail-generator",
      name: "Course Thumbnail Generator",
      description: "Generate eye-catching AI image thumbnails for your courses",
      icon: Image
    },
    {
      id: "quiz-generator",
      name: "Quiz & Assessment Builder",
      description: "Create quizzes and assessments to test student knowledge",
      icon: Video
    }
  ];

  const handleGenerate = async () => {
    // Validate topic based on the active hook's topic state
    // Each hook has its own topic state and validation
    if (!activeHook.topic || !activeHook.topic.trim()) {
        // The individual hooks already handle this validation and set their own error state.
        // This outer check might be redundant if hooks are robust, but can act as a quick UI feedback.
        return;
    }

    // Call the appropriate generation function from the active hook
    switch (selectedTool) {
      case "course-outline":
        await outlineHook.generateOutline();
        break;
      case "course-description":
        await descriptionHook.writeDescription();
        break;
      case "thumbnail-generator":
        // Call the function that generates the image
        await thumbnailHook.createThumbnailIdea(); 
        break;
      case "quiz-generator":
        await quizHook.buildQuiz();
        break;
      default:
        // This case should ideally not be reached if selectedTool is always one of the defined IDs
        console.error("Unknown tool selected:", selectedTool);
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      // Using document.execCommand('copy') for broader compatibility in iframes
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert('Content copied to clipboard!');
    }
  };

  // New function to handle navigating to course creation with pre-filled data
  const handleCreateCourseFromOutline = () => {
    if (!outlineHook.outline) {
      alert("Please generate a course outline first.");
      return;
    }

    // Prepare data to pass to the course creation page
    // Map AI outline structure to your Course form structure
    const prefillData = {
      // Basic Info fields
      title: outlineHook.outline.title || outlineHook.topic, // Use AI's title if available, else topic
      description: outlineHook.outline.description || '', // AI might not provide this at top level
      level: outlineHook.difficulty, // From AI generation inputs

      // Curriculum fields
      chapters: outlineHook.outline.map(chapter => ({
        title: chapter.title,
        lectures: chapter.lessons.map(lessonTitle => ({
          title: lessonTitle,
          video_url: '', // Needs manual input
          duration: 0, // Needs manual input or AI to provide
          is_preview_free: false // Needs manual input
        }))
      }))
    };

    // Navigate to your course creation page, passing state
    navigate('/CreateCourse', { state: { prefillCourseData: prefillData } });
  };


  // Authentication and Role Check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Loading user data...
          </h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'educator') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You must be logged in as an Educator to access AI content generation tools.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Determine the content to display in the input form based on selectedTool
  const renderInputForm = () => {
    switch (selectedTool) {
      case "course-outline":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic/Subject *
              </label>
              <Input
                value={outlineHook.topic}
                onChange={(e) => outlineHook.setTopic(e.target.value)}
                placeholder="e.g., React Development, Digital Marketing"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <Select value={outlineHook.difficulty} onValueChange={outlineHook.setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Duration (hours)
              </label>
              <Input
                type="number"
                value={outlineHook.duration}
                onChange={(e) => outlineHook.setDuration(e.target.value)}
                placeholder="4"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Audience
              </label>
              <Input
                value={outlineHook.audience}
                onChange={(e) => outlineHook.setAudience(e.target.value)}
                placeholder="e.g., web developers, marketing professionals"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Style/Tone
              </label>
              <Select value={outlineHook.styleTone} onValueChange={outlineHook.setStyleTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="informative">Informative</SelectItem>
                  <SelectItem value="engaging">Engaging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Context
              </label>
              <Textarea
                value={outlineHook.additionalContext}
                onChange={(e) => outlineHook.setAdditionalContext(e.target.value)}
                placeholder="Any specific requirements, focus areas, or constraints..."
                rows={3}
              />
            </div>
          </>
        );
      case "course-description":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic/Subject *
              </label>
              <Input
                value={descriptionHook.topic}
                onChange={(e) => descriptionHook.setTopic(e.target.value)}
                placeholder="e.g., React Development, Digital Marketing"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <Select value={descriptionHook.difficulty} onValueChange={descriptionHook.setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Duration (hours)
              </label>
              <Input
                type="number"
                value={descriptionHook.duration}
                onChange={(e) => descriptionHook.setDuration(e.target.value)}
                placeholder="4"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Audience
              </label>
              <Input
                value={descriptionHook.audience}
                onChange={(e) => descriptionHook.setAudience(e.target.value)}
                placeholder="e.g., web developers, marketing professionals"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Style/Tone
              </label>
              <Select value={descriptionHook.styleTone} onValueChange={descriptionHook.setStyleTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="informative">Informative</SelectItem>
                  <SelectItem value="engaging">Engaging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Context
              </label>
              <Textarea
                value={descriptionHook.additionalContext}
                onChange={(e) => descriptionHook.setAdditionalContext(e.target.value)}
                placeholder="Any specific details to highlight, keywords, etc."
                rows={3}
              />
            </div>
          </>
        );
      case "thumbnail-generator":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Topic *
              </label>
              <Input
                value={thumbnailHook.topic}
                onChange={(e) => thumbnailHook.setTopic(e.target.value)}
                placeholder="e.g., Data Science, Yoga for Beginners"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Style/Tone
              </label>
              <Select value={thumbnailHook.styleTone} onValueChange={thumbnailHook.setStyleTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Minimalist">Minimalist</SelectItem>
                  <SelectItem value="Vibrant">Vibrant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Context
              </label>
              <Textarea
                value={thumbnailHook.additionalContext}
                onChange={(e) => thumbnailHook.setAdditionalContext(e.target.value)}
                placeholder="Key elements to include, color preferences, mood, etc."
                rows={3}
              />
            </div>
          </>
        );
      case "quiz-generator":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic *
              </label>
              <Input
                value={quizHook.topic}
                onChange={(e) => quizHook.setTopic(e.target.value)}
                placeholder="e.g., JavaScript Fundamentals, World War II"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <Select value={quizHook.difficulty} onValueChange={quizHook.setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Questions *
              </label>
              <Input
                type="number"
                value={quizHook.numQuestions}
                onChange={(e) => quizHook.setNumQuestions(e.target.value)}
                placeholder="10"
                min="1"
                max="50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Types
              </label>
              <div className="flex flex-wrap gap-4">
                {['multiple-choice', 'true-false', 'short-answer'].map(type => (
                  <label key={type} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-purple-600 rounded"
                      checked={quizHook.questionTypes.includes(type)}
                      onChange={() => quizHook.handleQuestionTypeChange(type)}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">{type.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Context
              </label>
              <Textarea
                value={quizHook.additionalContext}
                onChange={(e) => quizHook.setAdditionalContext(e.target.value)}
                placeholder="Specific concepts to cover, format requirements, etc."
                rows={3}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // Determine the content to display in the generated content section
  const renderGeneratedContent = () => {
    switch (selectedTool) {
      case "course-outline":
        const { outline } = outlineHook;
        if (!outline) return null;
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Generated Course Outline
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(outline, null, 2))}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy JSON
                </Button>
                {/* New "Create Course" button */}
                <Button size="sm" onClick={handleCreateCourseFromOutline}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <div>
                <h4 className="font-semibold mb-4">Course Curriculum:</h4>
                {outline.length > 0 ? (
                  <ol className="list-decimal pl-5 space-y-4">
                    {outline.map((chapter, chapterIndex) => (
                      <li key={chapterIndex} className="mb-4 border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">Chapter {chapterIndex + 1}: {chapter.title}</h5>
                        </div>
                        <div className="ml-4 space-y-2">
                          {chapter.lessons && chapter.lessons.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {chapter.lessons.map((lesson, lessonIndex) => (
                                <li key={lessonIndex} className="text-gray-600 text-sm">{lesson}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-600 text-sm">No lessons found for this chapter.</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-600">No chapters generated. Try adjusting your parameters.</p>
                )}
              </div>
            </div>
          </div>
        );

      case "course-description":
        const { description } = descriptionHook;
        if (!description) return null;
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Course Description</h3>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(description)}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="space-y-6">
              <div className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded whitespace-pre-wrap">
                {description}
              </div>
            </div>
          </div>
        );

      case "thumbnail-generator":
        // Access thumbnailImage from the hook
        const { thumbnailImage } = thumbnailHook; 
        if (!thumbnailImage) return null; // If no image, don't render

        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generated Thumbnail Image</h3>
              {/* Optional: Add a download button if you want users to download the image */}
              {/* <Button variant="outline" size="sm" onClick={() => {
                const link = document.createElement('a');
                link.href = thumbnailImage;
                link.download = 'generated_thumbnail.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}>
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button> */}
            </div>
            <div className="text-center">
              {/* Display the image using the base64 URL */}
              <img 
                src={thumbnailImage} 
                alt="Generated Course Thumbnail" 
                className="max-w-full h-auto rounded-lg shadow-md mx-auto" 
                style={{ maxWidth: '400px', maxHeight: '250px', objectFit: 'contain' }} // Adjust size as needed
              />
              <p className="text-sm text-gray-500 mt-4">
                This image was generated by AI based on your input.
              </p>
            </div>
          </div>
        );

      case "quiz-generator":
        const { quiz } = quizHook;
        if (!quiz) return null;
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generated Quiz</h3>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(quiz, null, 2))}>
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
            </div>
            <div className="space-y-6">
              {/* Multiple Choice */}
              {quiz.multiple_choice && quiz.multiple_choice.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Multiple Choice Questions:</h4>
                  {quiz.multiple_choice.map((q, index) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg">
                      <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                      <div className="space-y-1 ml-4">
                        {q.options?.map((option, optIndex) => (
                          <div key={optIndex} className={`text-sm ${optIndex === q.correct_answer ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* True/False */}
              {quiz.true_false && quiz.true_false.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">True/False Questions:</h4>
                  {quiz.true_false.map((q, index) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg">
                      <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                      <p className="text-sm text-green-600">
                        <strong>Answer:</strong> {q.correct_answer ? 'True' : 'False'}
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {quiz.short_answer && quiz.short_answer.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Short Answer Questions:</h4>
                  {quiz.short_answer.map((q, index) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg">
                      <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Sample Answer:</strong> {q.sample_answer}
                      </p>
                      <div className="text-sm text-blue-600">
                        <strong>Grading Criteria:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {q.grading_criteria?.map((criteria, cIndex) => (
                            <li key={cIndex}>{criteria}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Content Generator
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Leverage AI to create engaging course content, descriptions, and materials in minutes
          </p>
        </div>

        {/* Tool Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tools.map((tool) => (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedTool === tool.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
              onClick={() => setSelectedTool(tool.id)}
            >
              <CardContent className="p-4 text-center">
                <tool.icon className={`w-8 h-8 mx-auto mb-2 ${
                  selectedTool === tool.id ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-500" />
                  Content Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderInputForm()} {/* Render the dynamic input form */}

                <Button
                  onClick={handleGenerate}
                  // Disable based on active hook's loading state and topic validation
                  disabled={isLoading || !activeHook.topic || !activeHook.topic.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Content */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Generated Content</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && ( // Show loading spinner if any tool is loading
                    <div className="text-center py-12">
                        <RefreshCw className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Generating Content...
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Please wait while AI creates your content.
                        </p>
                    </div>
                )}

                {!isLoading && error && ( // Show error if there's an error
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-4">Error generating content</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {error}
                    </p>
                  </div>
                )}

                {!isLoading && !error && (
                  (outlineHook.outline || descriptionHook.description || thumbnailHook.thumbnailImage || quizHook.quiz) ? (
                    <div className="space-y-6">
                      {renderGeneratedContent()} {/* Render the dynamic generated content */}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Generate
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Fill in the parameters and click generate to create AI-powered content
                      </p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
