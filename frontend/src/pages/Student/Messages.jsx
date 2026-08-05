import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ArrowLeft, Send, Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useMyConversations } from "@/hooks/useMyConversations";
import { getConversationWithEducator, replyToEducator } from "@/api/student";

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading, refetch } = useMyConversations();

  const [selectedEducator, setSelectedEducator] = useState(null);
  const [thread, setThread] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(async (educatorId) => {
    setThreadLoading(true);
    try {
      const messages = await getConversationWithEducator(educatorId);
      setThread(messages);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load conversation.");
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEducator) {
      loadThread(selectedEducator._id).then(() => refetch());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEducator]);

  const handleReply = async () => {
    if (!replyDraft.trim() || !selectedEducator) return;
    setSending(true);
    try {
      await replyToEducator(selectedEducator._id, replyDraft.trim());
      setReplyDraft("");
      await loadThread(selectedEducator._id);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
        <p className="ml-4 text-xl text-gray-700 dark:text-gray-300">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>

        {!selectedEducator ? (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Conversations with your educators</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No messages yet. Your educators can reach out here if they'd
                    like to check in with you.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((c) => (
                    <button
                      key={c.educator._id}
                      onClick={() => setSelectedEducator(c.educator)}
                      className="w-full text-left flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {c.educator.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                          {c.fromMe ? "You: " : ""}
                          {c.lastMessage}
                        </p>
                      </div>
                      {c.unreadCount > 0 && (
                        <Badge className="bg-purple-600 text-white">{c.unreadCount} new</Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <Button variant="ghost" size="sm" onClick={() => setSelectedEducator(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle>{selectedEducator.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {threadLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {thread.map((m) => {
                    const isMine = m.sender === user?._id || m.sender?._id === user?._id;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-sm px-4 py-2 rounded-2xl text-sm ${
                            isMine
                              ? "bg-purple-600 text-white rounded-br-sm"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
                          }`}
                        >
                          {m.message}
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine ? "text-purple-200" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleReply} disabled={sending || !replyDraft.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
