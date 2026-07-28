import { useState, useEffect, useCallback } from 'react';
import { getWellnessInsights, getAICounselorResponse, generateCourseOutline, writeCourseDescription, buildQuizAssessment, createCourseThumbnailImage } from '../api/ai.js'; 

export const useWellnessInsights = (moodData, triggerFetch = false) => {
  const [insight, setInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsight = useCallback(async () => {
    if (!moodData || !moodData.userId) {
      console.warn("useWellnessInsights: userId missing for AI insights. Skipping fetch.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const aiInsight = await getWellnessInsights(moodData.userId); 
      setInsight(aiInsight);
    } catch (err) {
      console.error("Failed to fetch wellness insights:", err);
      setError("Failed to load wellness insights. Please try again later.");
      setInsight(null);
    } finally {
      setIsLoading(false);
    }
  }, [moodData]);

  useEffect(() => {
    if (triggerFetch) {
      fetchInsight();
    }
  }, [triggerFetch, fetchInsight]);

  return { insight, isLoading, error, refetchInsights: fetchInsight };
};


export const useAICounselorChat = () => {
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: "Hello! I'm here to listen and support you on your wellness journey. What's on your mind today?", timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    setError(null);
    const newUserMessage = { role: 'user', content: userMessage, timestamp: new Date() };

    setChatHistory((prevHistory) => [...prevHistory, newUserMessage]);
    setIsTyping(true);

    try {
      // --- FIX IS HERE: Changed 'model' to 'assistant' for AI responses ---
      const formattedChatHistory = [...chatHistory, newUserMessage].map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user', // Map 'assistant' to 'assistant'
          parts: [{ text: msg.content }] // Assuming backend expects 'parts' with 'text'
      }));

      const aiResponseContent = await getAICounselorResponse(formattedChatHistory);

      const newAssistantMessage = { role: 'assistant', content: aiResponseContent, timestamp: new Date() };

      setChatHistory((prevHistory) => [...prevHistory, newAssistantMessage]);

    } catch (err) {
      console.error("Error sending message to AI Counselor:", err);
      setError("Failed to get a response from the counselor. Please try again.");
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again.", timestamp: new Date() }
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [chatHistory]);

  const clearChat = useCallback(() => {
    setChatHistory([
      { role: 'assistant', content: "Hello! I'm here to listen and support you on your wellness journey. What's on your mind today?", timestamp: new Date() }
    ]);
    setError(null);
  }, []);

  return { chatHistory, isTyping, error, sendMessage, clearChat };
};

// ... (rest of your useAi.js file with other hooks)
export const useCourseOutlineGenerator = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [duration, setDuration] = useState('');
  const [audience, setAudience] = useState('');
  const [styleTone, setStyleTone] = useState('Informative');
  const [additionalContext, setAdditionalContext] = useState('');
  const [outline, setOutline] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateOutline = useCallback(async () => {
    if (!topic.trim()) {
      setError('Topic/Subject is required.');
      return;
    }

    setIsLoading(true);
    setError('');
    setOutline(null);

    try {
      const generatedOutline = await generateCourseOutline({
        topic,
        difficulty,
        duration: duration ? parseInt(duration) : undefined,
        audience,
        styleTone,
        additionalContext,
      });
      setOutline(generatedOutline);
    } catch (err) {
      console.error('Failed to generate course outline:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate course outline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, difficulty, duration, audience, styleTone, additionalContext]);

  return {
    topic, setTopic,
    difficulty, setDifficulty,
    duration, setDuration,
    audience, setAudience,
    styleTone, setStyleTone,
    additionalContext, setAdditionalContext,
    outline, isLoading, error, generateOutline
  };
};

export const useCourseDescriptionWriter = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [duration, setDuration] = useState('');
  const [audience, setAudience] = useState('');
  const [styleTone, setStyleTone] = useState('Informative');
  const [additionalContext, setAdditionalContext] = useState('');
  const [description, setDescription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const writeDescription = useCallback(async () => {
    if (!topic.trim()) {
      setError('Topic/Subject is required.');
      return;
    }

    setIsLoading(true);
    setError('');
    setDescription(null);

    try {
      const generatedDescription = await writeCourseDescription({
        topic,
        difficulty,
        duration: duration ? parseInt(duration) : undefined,
        audience,
        styleTone,
        additionalContext,
      });
      setDescription(generatedDescription);
    } catch (err) {
      console.error('Failed to write course description:', err);
      setError(err.response?.data?.message || err.message || 'Failed to write course description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, difficulty, duration, audience, styleTone, additionalContext]);

  return {
    topic, setTopic,
    difficulty, setDifficulty,
    duration, setDuration,
    audience, setAudience,
    styleTone, setStyleTone,
    additionalContext, setAdditionalContext,
    description, isLoading, error, writeDescription
  };
};

export const useCourseThumbnailIdeaCreator = () => {
  const [topic, setTopic] = useState('');
  const [styleTone, setStyleTone] = useState('Creative');
  const [additionalContext, setAdditionalContext] = useState('');
  const [thumbnailImage, setThumbnailImage] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const createThumbnailIdea = useCallback(async () => {
    if (!topic.trim()) {
      setError('Course Topic is required.');
      return;
    }

    setIsLoading(true);
    setError('');
    setThumbnailImage(null); // Clear previous image

    try {
      const generatedImage = await createCourseThumbnailImage({
        topic,
        styleTone,
        additionalContext,
      });
      setThumbnailImage(generatedImage); 
    } catch (err) {
      console.error('Failed to create thumbnail image:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create thumbnail image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, styleTone, additionalContext]);

  return {
    topic, setTopic,
    styleTone, setStyleTone,
    additionalContext, setAdditionalContext,
    thumbnailImage, isLoading, error, createThumbnailIdea
  };
};

export const useQuizAssessmentBuilder = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [numQuestions, setNumQuestions] = useState('');
  const [questionTypes, setQuestionTypes] = useState([]); 
  const [additionalContext, setAdditionalContext] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const buildQuiz = useCallback(async () => {
    if (!topic.trim() || !numQuestions) {
      setError('Topic/Subject and Number of Questions are required.');
      return;
    }

    setIsLoading(true);
    setError('');
    setQuiz(null);

    try {
      const generatedQuiz = await buildQuizAssessment({
        topic,
        difficulty,
        numQuestions: parseInt(numQuestions), 
        questionTypes,
        additionalContext,
      });
      setQuiz(generatedQuiz);
    } catch (err) {
      console.error('Failed to build quiz/assessment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to build quiz/assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, difficulty, numQuestions, questionTypes, additionalContext]);

  const handleQuestionTypeChange = useCallback((type) => {
    setQuestionTypes((prevTypes) =>
      prevTypes.includes(type)
        ? prevTypes.filter((t) => t !== type)
        : [...prevTypes, type]
    );
  }, []);

  return {
    topic, setTopic,
    difficulty, setDifficulty,
    numQuestions, setNumQuestions,
    questionTypes, handleQuestionTypeChange,
    additionalContext, setAdditionalContext,
    quiz, isLoading, error, buildQuiz
  };
};