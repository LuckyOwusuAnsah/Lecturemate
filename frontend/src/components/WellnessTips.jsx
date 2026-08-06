import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2, RefreshCw } from "lucide-react";

// Import the necessary hooks
import { useAuth } from '@/context/AuthContext';
import { useWellnessInsights } from "../hooks/useAi";

export default function WellnessTips() {
  const { user, loading: authLoading } = useAuth(); // Get user for fetching insights
  const [triggerInsightsFetch, setTriggerInsightsFetch] = useState(false);

  // Memoized so this object keeps the same reference across re-renders unless
  // the user actually changes — otherwise fetchInsight (below) gets a new
  // identity on every render, which re-fires its effect and re-fetches in an
  // infinite loop, hammering the AI endpoint until it gets rate-limited.
  const moodDataForInsights = useMemo(() => ({ userId: user?._id }), [user?._id]);

  // Use the useWellnessInsights hook directly in WellnessTips
  const {
    insight,
    isLoading: isInsightLoading,
    error: insightError,
    refetchInsights
  } = useWellnessInsights(moodDataForInsights, triggerInsightsFetch);

  // Effect to trigger insights fetch once user is available and not loading
  useEffect(() => {
    if (user && !authLoading && !triggerInsightsFetch) {
      setTriggerInsightsFetch(true);
    }
  }, [user, authLoading, triggerInsightsFetch]);


  // Handle loading states
  if (authLoading || (triggerInsightsFetch && isInsightLoading)) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Wellness Insight
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin mr-2" /> Generating insights...
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (insightError) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Wellness Insight
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-red-500 mb-3">{insightError}</p>
          <Button variant="outline" size="sm" onClick={refetchInsights}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Display the insight
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          AI Wellness Insight
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insight ? (
          <p className="text-gray-700 dark:text-gray-300">
            {insight}
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            AI insights will appear here once your mood data is analyzed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}