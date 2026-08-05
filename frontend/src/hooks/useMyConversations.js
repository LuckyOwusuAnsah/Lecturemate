import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getMyConversations } from "@/api/student";

export const useMyConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyConversations();
      setConversations(res);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError(err);
      toast.error(err.response?.data?.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
};
