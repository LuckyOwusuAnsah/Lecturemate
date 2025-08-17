// backend/controllers/wellnessAiController.js
import asyncHandler from 'express-async-handler';
import { getChatCompletion, generateImageWithImagen } from '../services/aiService.js';
import MoodEntry from '../models/MoodEntryModel.js';

// Helper function to calculate weekly average mood score on the backend
const calculateWeeklyAverageMoodScore = (entries) => {
  if (!entries || entries.length === 0) return 0;

  const moodScores = {
      'very_sad': 1,
      'sad': 2,
      'neutral': 3,
      'happy': 4,
      'very_happy': 5
  };

  const now = new Date();
  const oneWeekAgo = new Date(now.setDate(now.getDate() - 7)); // Date 7 days ago

  const recentMoods = entries.filter(entry => new Date(entry.date) >= oneWeekAgo);

  if (recentMoods.length === 0) return 0;

  const totalScore = recentMoods.reduce((sum, entry) => sum + (moodScores[entry.mood] || 0), 0);
  return (totalScore / recentMoods.length).toFixed(1);
};

// @desc    Get AI-generated wellness insights
// @route   POST /api/ai/insights
// @access  Private (requires authentication)
export const getWellnessInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const allMoodEntries = await MoodEntry.find({ user: userId }).sort({ date: -1 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysMood = allMoodEntries.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });

  const weeklyAverage = calculateWeeklyAverageMoodScore(allMoodEntries);

  const recentMoodEntriesForPrompt = allMoodEntries.slice(0, 10);

  const systemPromptContent = `You are an empathetic and insightful AI assistant specializing in mental wellness.
  Analyze the following mood data for user ID ${userId}:
  Today's Mood: ${todaysMood ? `${todaysMood.mood} (Notes: ${todaysMood.notes || 'N/A'})` : 'Not set'}
  Weekly Average Mood Score: ${weeklyAverage}
  Recent Mood History (${recentMoodEntriesForPrompt.length} entries):
  ${recentMoodEntriesForPrompt.map(entry => `- Date: ${new Date(entry.date).toLocaleDateString()}, Mood: ${entry.mood}, Notes: ${entry.notes || 'N/A'}`).join('\n')}

  Provide a concise, empathetic wellness insight or observation based on this data. Highlight any notable trends and offer a general, encouraging message. Keep it under 200 words.`;

  const messages = [
    { role: "system", content: systemPromptContent },
  ];

  const insight = await getChatCompletion(messages, 0.7);

  res.json({ success: true, insight });
});


// Helper function to sanitize user messages
const sanitizeUserMessage = (message) => {
  let sanitizedMessage = message.toLowerCase();

  // Replace "kill boredom" with "overcome boredom"
  sanitizedMessage = sanitizedMessage.replace(/\bkill boredom\b/g, 'overcome boredom');
  // Add more sanitization rules as needed
  // sanitizedMessage = sanitizedMessage.replace(/\bstrong_word\b/g, 'safer_word');

  return sanitizedMessage;
};


// @desc    Get AI counselor response
// @route   POST /api/ai/counselor
// @access  Private (should be)
export const getAICounselorResponse = asyncHandler(async (req, res) => {
  const { chatHistory } = req.body;
  const userName = req.user ? req.user.name : 'the student on this app';
  const userId = req.user._id; // Get the user ID from the authenticated request

  // --- NEW: Fetch recent mood entries for the user ---
  const userMoodEntries = await MoodEntry.find({ user: userId })
    .sort({ date: -1 }) // Sort by most recent first
    .limit(7); // Get the last 7 mood entries for context (adjust as needed)

  // Format mood data for the AI prompt
  let moodContext = "No recent mood data available.";
  if (userMoodEntries && userMoodEntries.length > 0) {
    const latestMood = userMoodEntries[0];
    const weeklyAverageMoodScore = calculateWeeklyAverageMoodScore(userMoodEntries);
    
    moodContext = `The user's latest recorded mood is "${latestMood.mood}" on ${new Date(latestMood.date).toLocaleDateString()}. `;
    if (latestMood.notes) {
      moodContext += `Their notes for this mood were: "${latestMood.notes}". `;
    }
    moodContext += `Their average mood over the last week is approximately ${weeklyAverageMoodScore}. `;
    moodContext += `Recent mood history: ${userMoodEntries.map(entry => `${entry.mood} (${new Date(entry.date).toLocaleDateString()})`).join(', ')}.`;
  }
  // --- END NEW ---

  // Define the core system instruction content, now including personalization and mood data
  const SYSTEM_INSTRUCTION_CONTENT = `You are a supportive, empathetic, and non-judgmental AI wellness counselor, specifically tailored to assist students.
  Treat the user you are conversing with as a student seeking support for their mental wellness.
  Your purpose is to listen, offer gentle guidance, encourage self-reflection, and provide general coping strategies.
  You should never diagnose, prescribe, or give medical advice.
  Keep responses concise and focused on well-being.
  Acknowledge the user's last message before responding.
  Always address the user by their name, which is "${userName}", at appropriate points in the conversation. If the name is unavailable (i.e., "${userName}" is "the student on this app"), use generic supportive language.
  When providing lists, please use simple bullet points (e.g., "- Item one") or hyphenated lists, or ensure that numbered lists are formatted strictly as "1. Item one" (without bolding numbers or other complex Markdown) to ensure readability in a plain text display.
  You should always use positive and constructive language. Avoid any phrasing that could be interpreted as harmful or violent. Focus on empowering the user to manage their feelings and situations.

  Here is the user's recent mood data for additional context: ${moodContext}
  Use this information to better understand the user's emotional state and tailor your responses accordingly. For example, if they've logged "very sad" recently, respond with extra empathy and focus on mood-lifting suggestions, or if they're "very happy", acknowledge it and maintain a positive tone.`;


  // Start building messages for the AI. The system instruction always comes first.
  const messagesForAI = [{ role: "system", content: SYSTEM_INSTRUCTION_CONTENT }];

  // Iterate through the chat history from the frontend and format for OpenAI-compatible API
  for (const msg of chatHistory) {
    let content = '';

    // Robustly extract content: check 'content' property first, then 'parts[0].text'
    if (msg.content && typeof msg.content === 'string') {
      content = msg.content;
    } else if (msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0 && typeof msg.parts[0].text === 'string') {
      content = msg.parts[0].text;
    }

    // Skip messages if content is empty after extraction
    if (!content.trim()) {
      console.warn(`Skipping invalid or empty chat history entry during content extraction: ${JSON.stringify(msg)}`);
      continue;
    }

    // Sanitize user messages before adding to messagesForAI
    let processedContent = content;
    if (msg.role === 'user') {
      processedContent = sanitizeUserMessage(content);
    }

    // Map 'assistant' role from frontend to 'assistant' for OpenAI-compatible API
    // 'user' role remains 'user'
    const aiApiRole = msg.role === 'assistant' ? 'assistant' : 'user';
    
    messagesForAI.push({ role: aiApiRole, content: processedContent });
  }


  // If there are no valid user messages after processing, return an error
  // This prevents sending empty 'contents' to the AI API.
  // Check if messagesForAI only contains the system instruction and no actual chat turns
  if (messagesForAI.length <= 1) { // If only system instruction or no valid chat messages
      console.error('No valid user messages found in chatHistory to send to GitHub AI API.');
      return res.status(400).json({ success: false, error: 'No valid message to process.' });
  }

  // Debug log to see final messages array before sending
  console.log('Final messages sent to GitHub AI API (with Mood Context):', JSON.stringify(messagesForAI));

  // Call the AI service to get the completion
  const aiResponse = await getChatCompletion(messagesForAI, 0.8);

  res.json({ success: true, response: aiResponse });
});

// ... (rest of your aiController.js file with other functions like generateCourseOutline, etc.)

export const generateCourseOutline = asyncHandler(async (req, res) => {
    const { topic, difficulty, duration, audience, styleTone, additionalContext } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic/Subject is required.' });
    }

    let prompt = `Generate a comprehensive course outline.`;
    prompt += `\nTopic/Subject: ${topic}.`;
    if (difficulty) prompt += `\nDifficulty Level: ${difficulty}.`;
    if (duration) prompt += `\nCourse Duration: ${duration} hours.`;
    if (audience) prompt += `\nTarget Audience: ${audience}.`;
    if (styleTone) prompt += `\nStyle/Tone: ${styleTone}.`;
    if (additionalContext) prompt += `\nAdditional Context: ${additionalContext}.`;
    prompt += `\n\nProvide the outline as a JSON array of chapters, where each chapter is an object with a "title" and an array of "lessons". Ensure the output is valid JSON. Example: [{"title": "Introduction", "lessons": ["Welcome", "Course Goals"]}]`;

    const messages = [{ role: "user", content: prompt }];

    try {
        const jsonStringOutline = await getChatCompletion(messages, 0.7);

        const parsedOutline = JSON.parse(jsonStringOutline);
        res.json({ success: true, outline: parsedOutline });
    } catch (error) {
        console.error('Error generating course outline or parsing JSON:', error);
        res.status(500).json({ error: 'Failed to generate course outline. The AI might have returned an invalid JSON format. Please try again.' });
    }
});

export const writeCourseDescription = asyncHandler(async (req, res) => {
    const { topic, difficulty, duration, audience, styleTone, additionalContext } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic/Subject is required.' });
    }

    let prompt = `Write a compelling and informative course description.`;
    prompt += `\nTopic/Subject: ${topic}.`;
    if (difficulty) prompt += `\nDifficulty Level: ${difficulty}.`;
    if (duration) prompt += `\nCourse Duration: ${duration} hours.`;
    if (audience) prompt += `\nTarget Audience: ${audience}.`;
    if (styleTone) prompt += `\nStyle/Tone: ${styleTone}.`;
    if (additionalContext) prompt += `\nAdditional Context: ${additionalContext}.`;
    prompt += `\n\nKeep the description concise and engaging, suitable for a course catalog.`;

    const messages = [{ role: "user", content: prompt }];

    try {
        const description = await getChatCompletion(messages, 0.8);
        res.json({ success: true, description });
    } catch (error) {
        console.error('Error writing course description:', error);
        res.status(500).json({ error: 'Failed to write course description. Please try again.' });
    }
});

export const createCourseThumbnailImage = async (req, res) => {
    const { topic, styleTone, additionalContext } = req.body;

    if (!topic) {
        return res.status(400).json({ message: 'Course Topic is required to generate a thumbnail image.' });
    }

    let imagePrompt = `Generate a visually appealing course thumbnail for the topic: "${topic}".`;
    if (styleTone) {
        imagePrompt += ` The style/tone should be ${styleTone}.`;
    }
    if (additionalContext) {
        imagePrompt += ` Key elements to include: ${additionalContext}.`;
    }
    imagePrompt += ` Ensure it's suitable for a digital learning platform, with clear, concise visuals.`;

    try {
        const imageUrl = await generateImageWithImagen(imagePrompt);

        res.status(200).json({ thumbnailImage: imageUrl });

    } catch (error) {
        console.error('Error in createCourseThumbnailImage controller:', error);
        res.status(500).json({ message: 'Failed to generate thumbnail image.', error: error.message });
    }
};

export const buildQuizAssessment = asyncHandler(async (req, res) => {
    const { topic, difficulty, numQuestions, questionTypes, additionalContext } = req.body;

    if (!topic || !numQuestions) {
        return res.status(400).json({ error: 'Topic/Subject and Number of Questions are required.' });
    }

    let prompt = `Generate a quiz on the topic of "${topic}".\n`;
    prompt += `Difficulty: ${difficulty}.\n`;
    prompt += `Number of questions: ${numQuestions}.\n`;

    if (questionTypes && questionTypes.length > 0) {
        prompt += `Question types: ${questionTypes.join(', ').replace(/-/g, ' ')}.\n`;
    } else {
        prompt += `Question types: multiple-choice, true-false, short-answer (mix them if possible).\n`;
    }

    if (additionalContext) {
        prompt += `Additional context/specific concepts to cover: ${additionalContext}.\n`;
    }

    prompt += `\nProvide the quiz as a JSON object with the following structure. Ensure all top-level keys (multiple_choice, true_false, short_answer) are present, even if their arrays are empty. For multiple choice, 'correct_answer' should be the 0-indexed number of the correct option. For true/false, 'correct_answer' should be a boolean.
{
  "multiple_choice": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "number",
      "explanation": "string"
    }
  ],
  "true_false": [
    {
      "question": "string",
      "correct_answer": "boolean",
      "explanation": "string"
    }
  ],
  "short_answer": [
    {
      "question": "string",
      "sample_answer": "string",
      "grading_criteria": ["string", "string"]
    }
  ]
}`;

    try {
        const jsonStringQuiz = await getChatCompletion(
            [{ role: "user", content: prompt }],
            0.7, // temperature
            1,   // top_p
            undefined, // model (use default)
            { type: "json_object" } // Request JSON object output
        );

        const parsedQuiz = JSON.parse(jsonStringQuiz);
        res.json({ success: true, quiz: parsedQuiz });
    } catch (error) {
        console.error('Error building quiz/assessment or parsing JSON:', error);
        res.status(500).json({ error: 'Failed to build quiz/assessment. The AI might have returned an invalid JSON format or encountered an internal error. Please try again.' });
    }
});
