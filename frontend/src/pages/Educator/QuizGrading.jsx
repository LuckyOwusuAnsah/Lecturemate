import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { getQuizzesForCourse, getAttemptsForQuiz, gradeShortAnswers } from "@/api/quiz";

function AttemptGrader({ quiz, attempt, onGraded }) {
    const shortAnswerById = new Map((quiz.short_answer || []).map((q) => [q._id, q]));
    const [pendingGrades, setPendingGrades] = useState(() => {
        const initial = {};
        attempt.answers
            .filter((a) => a.questionType === "short_answer")
            .forEach((a) => {
                initial[a.questionId] = a.isCorrect ?? null;
            });
        return initial;
    });
    const [isSaving, setIsSaving] = useState(false);

    const shortAnswers = attempt.answers.filter((a) => a.questionType === "short_answer");

    const handleSave = async () => {
        const grades = Object.entries(pendingGrades)
            .filter(([, isCorrect]) => isCorrect !== null)
            .map(([questionId, isCorrect]) => ({ questionId, isCorrect }));

        if (grades.length === 0) {
            toast.error("Mark at least one answer before saving.");
            return;
        }

        setIsSaving(true);
        try {
            const updatedAttempt = await gradeShortAnswers(attempt._id, grades);
            toast.success("Grades saved.");
            onGraded(updatedAttempt);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save grades.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="mb-4 border">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                        {attempt.student?.name || attempt.student?.email || "Unknown student"}
                    </CardTitle>
                    {attempt.manualGradingPending ? (
                        <Badge className="bg-amber-500 text-white">Pending grading</Badge>
                    ) : (
                        <Badge className="bg-green-500 text-white">
                            Final score: {attempt.finalScorePercent}%
                        </Badge>
                    )}
                </div>
                {attempt.autoGradedTotal > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Auto-graded: {attempt.autoGradedCorrect}/{attempt.autoGradedTotal} correct
                    </p>
                )}
            </CardHeader>
            {shortAnswers.length > 0 && (
                <CardContent className="space-y-4">
                    {shortAnswers.map((a) => {
                        const question = shortAnswerById.get(a.questionId);
                        return (
                            <div key={a.questionId} className="border rounded-lg p-3">
                                <p className="font-medium mb-1">{question?.question}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    <strong>Student's answer:</strong> {a.answer || <em>(no answer)</em>}
                                </p>
                                {question?.sample_answer && (
                                    <p className="text-sm text-blue-600 mb-2">
                                        <strong>Sample answer:</strong> {question.sample_answer}
                                    </p>
                                )}
                                {a.isCorrect === null ? (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={pendingGrades[a.questionId] === true ? "default" : "outline"}
                                            className={pendingGrades[a.questionId] === true ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                            onClick={() => setPendingGrades((prev) => ({ ...prev, [a.questionId]: true }))}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1" /> Correct
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={pendingGrades[a.questionId] === false ? "default" : "outline"}
                                            className={pendingGrades[a.questionId] === false ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                                            onClick={() => setPendingGrades((prev) => ({ ...prev, [a.questionId]: false }))}
                                        >
                                            <XCircle className="w-4 h-4 mr-1" /> Incorrect
                                        </Button>
                                    </div>
                                ) : (
                                    <Badge className={a.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                                        {a.isCorrect ? "Marked correct" : "Marked incorrect"}
                                    </Badge>
                                )}
                            </div>
                        );
                    })}
                    {attempt.manualGradingPending && (
                        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isSaving ? "Saving..." : "Save Grades"}
                        </Button>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

export default function QuizGrading() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const courseId = new URLSearchParams(location.search).get("courseId");

    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
    const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== "educator")) {
            navigate(createPageUrl("Login"));
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    useEffect(() => {
        if (!courseId) return;
        setIsLoadingQuizzes(true);
        getQuizzesForCourse(courseId)
            .then(setQuizzes)
            .catch(() => setError("Failed to load quizzes for this course."))
            .finally(() => setIsLoadingQuizzes(false));
    }, [courseId]);

    const handleSelectQuiz = async (quiz) => {
        setSelectedQuiz(quiz);
        setIsLoadingAttempts(true);
        try {
            const data = await getAttemptsForQuiz(quiz._id);
            setAttempts(data);
        } catch (err) {
            toast.error("Failed to load submissions for this quiz.");
        } finally {
            setIsLoadingAttempts(false);
        }
    };

    const handleGraded = (updatedAttempt) => {
        setAttempts((prev) =>
            prev.map((a) => (a._id === updatedAttempt._id ? updatedAttempt : a))
        );
    };

    if (authLoading || isLoadingQuizzes) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <Button variant="ghost" onClick={() => navigate(createPageUrl("EducatorDashboard"))} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Grade Quizzes</h1>

                {!selectedQuiz ? (
                    <Card className="border-0">
                        <CardHeader>
                            <CardTitle>Select a quiz</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {quizzes.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400">No quizzes published for this course yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {quizzes.map((quiz) => (
                                        <button
                                            key={quiz._id}
                                            onClick={() => handleSelectQuiz(quiz)}
                                            className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            {quiz.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedQuiz(null)} className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to quiz list
                        </Button>
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{selectedQuiz.title} — Submissions</h2>

                        {isLoadingAttempts ? (
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        ) : attempts.length === 0 ? (
                            <p className="text-gray-600 dark:text-gray-400">No students have submitted this quiz yet.</p>
                        ) : (
                            attempts.map((attempt) => (
                                <AttemptGrader
                                    key={attempt._id}
                                    quiz={selectedQuiz}
                                    attempt={attempt}
                                    onGraded={handleGraded}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
