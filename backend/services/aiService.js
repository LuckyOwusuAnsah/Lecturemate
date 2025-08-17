// backend/services/aiService.js
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// --- AI Service Configuration ---
const GITHUB_AI_TOKEN =process.env.GITHUB_OPENAI_API_KEY;
const GITHUB_AI_ENDPOINT = "https://models.github.ai/inference";
const GITHUB_AI_MODEL = "openai/gpt-4.1";

// Initialize the AI client once
const aiClient = ModelClient(
  GITHUB_AI_ENDPOINT,
  new AzureKeyCredential(GITHUB_AI_TOKEN),
);

export const getChatCompletion = async (
  messages,
  temperature = 0.7,
  top_p = 1,
  model = GITHUB_AI_MODEL,
  // New parameter: responseFormat for requesting structured output
  responseFormat = undefined // Can be { type: "json_object" }
) => {
  if (!GITHUB_AI_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is not set. Cannot connect to AI service.");
  }

  const requestBody = {
    messages: messages,
    temperature: temperature,
    top_p: top_p,
    model: model,
  };

  // Conditionally add response_format if provided
  if (responseFormat) {
    requestBody.response_format = responseFormat;
  }

  const response = await aiClient.path("/chat/completions").post({
    body: requestBody,
  });

  if (isUnexpected(response)) {
    console.error("GitHub AI API Error Response:", response.body.error);
    throw new Error(`AI API Error: ${response.body.error.message || 'Unknown error occurred while calling AI service.'}`);
  }

  // Ensure response structure is as expected before accessing content
  if (!response.body || !response.body.choices || response.body.choices.length === 0 || !response.body.choices[0].message) {
    console.error("Unexpected AI API Response Structure:", response.body);
    throw new Error("AI API returned an unexpected response structure.");
  }

  return response.body.choices[0].message.content;
};



// SERVICE FOR GENERATING IMAGES

const API_KEY = process.env.GEMINI_API_KEY; 

// Helper function to handle exponential backoff for API calls.
const callApiWithBackoff = async (url, options, retries = 5, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // If it's a 429 (Too Many Requests) or a server error, retry
                if ((response.status === 429 || response.status >= 500) && i < retries - 1) {
                    console.warn(`Attempt ${i + 1} failed with status ${response.status}, retrying in ${delay / 1000}s...`);
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; // Exponential backoff
                    continue;
                }
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (i === retries - 1) throw error; 
            console.warn(`Attempt ${i + 1} failed, retrying in ${delay / 1000}s: ${error.message}`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; 
        }
    }
    throw new Error("Max retries exceeded for API call.");
};


export const generateImageWithImagen = async (prompt) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`;

    const payload = {
        instances: {
            prompt: prompt
        },
        parameters: {
            sampleCount: 1 // Request one image
        }
    };

    try {
        const result = await callApiWithBackoff(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
            const base64Data = result.predictions[0].bytesBase64Encoded;
            return `data:image/png;base64,${base64Data}`; // Return as a data URL
        } else {
            console.error('Imagen 4.0 API returned no image data:', result);
            throw new Error('No image data returned from Imagen 4.0 API.');
        }
    } catch (error) {
        console.error('Error calling Imagen 4.0 API:', error);
        throw new Error(`Failed to generate image: ${error.message}`);
    }
};

