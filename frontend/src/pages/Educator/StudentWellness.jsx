import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Users,
  AlertTriangle,
  TrendingUp,
  Loader2,
  AlertCircle,
  MessageCircle,
  Send,
} from "lucide-react";

import { useStudentsWellness } from "@/hooks/useStudentsWellness";
import { sendMessageToStudent, getConversationWithStudent } from "@/api/educator";
import { useAuth } from "@/context/AuthContext";

const MOOD_ICON = {
  very_happy: "😊",
  happy: "🙂",
  neutral: "😐",
  sad: "😔",
  very_sad: "😢",
};

const MOOD_COLOR = {
  very_happy: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
  happy: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  sad: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  very_sad: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
};

export default function StudentWellness() {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const { students, loading, error, refetch } = useStudentsWellness();

  const [openComposerFor, setOpenComposerFor] = useState(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const toggleComposer = async (studentId) => {
    if (openComposerFor === studentId) {
      setOpenComposerFor(null);
      setMessageDraft("");
      return;
    }
    setOpenComposerFor(studentId);
    setMessageDraft("");
    setThread([]);
    setThreadLoading(true);
    try {
      const messages = await getConversationWithStudent(studentId);
      setThread(messages);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load conversation history.");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendMessage = async (studentId) => {
    if (!messageDraft.trim()) {
      toast.error("Message cannot be empty.");
      return;
    }
    setSending(true);
    try {
      const newMessage = await sendMessageToStudent(studentId, messageDraft.trim());
      setThread((prev) => [...prev, newMessage]);
      setMessageDraft("");
      toast.success("Message sent privately to the student.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const needsAttentionCount = useMemo(
    () => students.filter((s) => s.needsAttention).length,
    [students]
  );

  const classAverage = useMemo(() => {
    const withAverage = students.filter((s) => s.weeklyAverage !== null);
    if (withAverage.length === 0) return null;
    const sum = withAverage.reduce((total, s) => total + s.weeklyAverage, 0);
    return (sum / withAverage.length).toFixed(1);
  }, [students]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">
          Loading student wellness overview...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || authUser?.role !== "educator") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be an educator to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Error Loading Wellness Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
          {error.message || "Something went wrong. Please try again."}
        </p>
        <button
          onClick={refetch}
          className="px-6 py-3 border rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Student Wellness Overview
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Mood trends for students enrolled in your courses — a signal to check in,
            not a diagnosis. Personal notes stay private to each student.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Students Tracked</p>
                  <p className="text-3xl font-bold">{students.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Needs Attention</p>
                  <p className="text-3xl font-bold">{needsAttentionCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Class Weekly Average</p>
                  <p className="text-3xl font-bold">
                    {classAverage !== null ? classAverage : "—"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student list */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No students enrolled in your courses yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((s) => (
                  <div
                    key={s.student._id}
                    className={`p-4 rounded-lg border ${
                      s.needsAttention
                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                        : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {s.latestMood ? MOOD_ICON[s.latestMood] : "—"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {s.student.name}
                            </p>
                            {s.needsAttention && (
                              <Badge className="bg-red-600 text-white">
                                Needs Attention
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {s.student.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {s.courses.join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 sm:mt-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Weekly Average
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {s.weeklyAverage !== null ? `${s.weeklyAverage} / 5` : "No data"}
                          </p>
                        </div>
                        {s.latestMood && (
                          <Badge className={MOOD_COLOR[s.latestMood]}>
                            {s.latestMood.replace("_", " ")}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant={s.needsAttention ? "default" : "outline"}
                          className={s.needsAttention ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                          onClick={() => toggleComposer(s.student._id)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>

                    {openComposerFor === s.student._id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          This message is private between you and {s.student.name} — it
                          is not posted to the course discussion forum.
                        </p>

                        {threadLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                          </div>
                        ) : thread.length > 0 ? (
                          <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
                            {thread.map((m) => {
                              const isMine = (m.sender?._id || m.sender) === authUser?._id;
                              return (
                                <div
                                  key={m._id}
                                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-xs px-3 py-1.5 rounded-2xl text-sm ${
                                      isMine
                                        ? "bg-purple-600 text-white rounded-br-sm"
                                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                                    }`}
                                  >
                                    {m.message}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <Textarea
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          placeholder={
                            s.needsAttention
                              ? `Hi ${s.student.name.split(" ")[0]}, I noticed you might be having a tough time lately — is everything okay? I'm here if you want to talk.`
                              : `Write a private message to ${s.student.name}...`
                          }
                          rows={3}
                          className="mb-3"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComposer(s.student._id)}
                            disabled={sending}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSendMessage(s.student._id)}
                            disabled={sending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            {sending ? "Sending..." : "Send Privately"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
