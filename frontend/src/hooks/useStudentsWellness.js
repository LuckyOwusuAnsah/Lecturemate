import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getStudentsWellness } from "@/api/educator";

export const useStudentsWellness = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentsWellness();
      setStudents(res);
    } catch (err) {
      console.error("Error fetching student wellness overview:", err);
      setError(err);
      toast.error(err.response?.data?.message || "Failed to load student wellness data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { students, loading, error, refetch: fetchData };
};
