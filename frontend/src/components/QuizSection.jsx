import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { getQuizzesForCourse, getMyAttempt, submitQuizAttempt } from '../api/quiz';
import { toast } from 'react-toastify';

function QuizAttemptForm({ quiz, onSubmitted }) {
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalQuestions =
        (quiz.multiple_choice?.length || 0) +
        (quiz.true_false?.length || 0) +
        (quiz.short_answer?.length || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Object.keys(answers).length < totalQuestions) {
            toast.error("Please answer every question before submitting.");
            return;
        }

        const payload = [
            ...(quiz.multiple_choice || []).map((q) => ({
                questionId: q._id,
                questionType: 'multiple_choice',
                answer: answers[q._id],
            })),
            ...(quiz.true_false || []).map((q) => ({
                questionId: q._id,
                questionType: 'true_false',
                answer: answers[q._id],
            })),
            ...(quiz.short_answer || []).map((q) => ({
                questionId: q._id,
                questionType: 'short_answer',
                answer: answers[q._id],
            })),
        ];

        setIsSubmitting(true);
        try {
            const attempt = await submitQuizAttempt(quiz._id, payload);
            toast.success("Quiz submitted!");
            onSubmitted(attempt);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit quiz.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {quiz.multiple_choice?.map((q, index) => (
                <div key={q._id}>
                    <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                    <div className="space-y-1 ml-2">
                        {q.options.map((option, optIndex) => (
                            <label key={optIndex} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name={`q-${q._id}`}
                                    checked={answers[q._id] === optIndex}
                                    onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: optIndex }))}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {quiz.true_false?.map((q, index) => (
                <div key={q._id}>
                    <p className="font-medium mb-2">
                        {(quiz.multiple_choice?.length || 0) + index + 1}. {q.question}
                    </p>
                    <div className="flex gap-4 ml-2">
                        {[true, false].map((val) => (
                            <label key={String(val)} className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name={`q-${q._id}`}
                                    checked={answers[q._id] === val}
                                    onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: val }))}
                                />
                                {val ? 'True' : 'False'}
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {quiz.short_answer?.map((q, index) => (
                <div key={q._id}>
                    <p className="font-medium mb-2">
                        {(quiz.multiple_choice?.length || 0) + (quiz.true_false?.length || 0) + index + 1}. {q.question}
                    </p>
                    <Textarea
                        rows={3}
                        value={answers[q._id] || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))}
                        placeholder="Your answer..."
                    />
                </div>
            ))}

            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
        </form>
    );
}

function QuizResult({ attempt }) {
    if (attempt.manualGradingPending) {
        return (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <Clock className="w-4 h-4" />
                {attempt.autoGradedTotal > 0 && (
                    <span>Auto-graded: {attempt.autoGradedCorrect}/{attempt.autoGradedTotal} correct. </span>
                )}
                Waiting on your instructor to grade the short-answer questions.
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Final score: {attempt.finalScorePercent}%
        </div>
    );
}

export default function QuizSection({ courseId }) {
    const [quizzes, setQuizzes] = useState([]);
    const [attempts, setAttempts] = useState({}); // quizId -> attempt | null
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!courseId) return;

        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const quizList = await getQuizzesForCourse(courseId);
                setQuizzes(quizList);

                const attemptEntries = await Promise.all(
                    quizList.map(async (quiz) => [quiz._id, await getMyAttempt(quiz._id)])
                );
                setAttempts(Object.fromEntries(attemptEntries));
            } catch (err) {
                console.error("Failed to load quizzes:", err);
                setError("Failed to load quizzes for this course.");
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [courseId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Loading quizzes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-6 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <Card className="mb-8 border-0">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Course Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {quizzes.length === 0 ? (
                    <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                        No quizzes have been published for this course yet.
                    </p>
                ) : (
                    quizzes.map((quiz) => {
                        const attempt = attempts[quiz._id];
                        return (
                            <Card key={quiz._id} className="dark:bg-gray-800 shadow-md">
                                <CardHeader className="border-b border-gray-700 pb-4 flex flex-row items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-blue-500" />
                                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {quiz.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {attempt ? (
                                        <QuizResult attempt={attempt} />
                                    ) : (
                                        <QuizAttemptForm
                                            quiz={quiz}
                                            onSubmitted={(newAttempt) =>
                                                setAttempts((prev) => ({ ...prev, [quiz._id]: newAttempt }))
                                            }
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
