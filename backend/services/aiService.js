// backend/services/aiService.js
//
// Text generation runs on Gemini (same provider/key as the image generator
// below). This used to call GitHub Models (models.github.ai/inference), but
// GitHub retired that service, so everything text-related was moved here to
// avoid depending on two AI providers.
const API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TEXT_MODEL = "gemini-3.1-flash-lite";

// Converts an OpenAI-style messages array (role: system/user/assistant) into
// Gemini's shape: a top-level systemInstruction plus a contents array using
// role: user/model.
const toGeminiRequest = (messages, temperature, top_p, responseFormat) => {
  let systemInstructionText = "";
  const contents = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstructionText += (systemInstructionText ? "\n\n" : "") + msg.content;
      continue;
    }
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  // Gemini requires at least one entry in `contents` — some callers here only
  // ever send a system-style prompt with no separate user turn.
  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "Please respond according to the instructions above." }],
    });
  }

  const payload = {
    contents,
    generationConfig: {
      temperature,
      topP: top_p,
      ...(responseFormat?.type === "json_object" ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemInstructionText) {
    payload.systemInstruction = { parts: [{ text: systemInstructionText }] };
  }
  return payload;
};

export const getChatCompletion = async (
  messages,
  temperature = 0.7,
  top_p = 1,
  model = GEMINI_TEXT_MODEL,
  // Can be { type: "json_object" } to request structured JSON output
  responseFormat = undefined
) => {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Cannot connect to AI service.");
  }

  const payload = toGeminiRequest(messages, temperature, top_p, responseFormat);
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

  const result = await callApiWithBackoff(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("Unexpected Gemini text response structure:", result);
    throw new Error("AI API returned an unexpected response structure.");
  }

  return text;
};



// SERVICE FOR GENERATING IMAGES

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
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    const MODEL = "gemini-3.1-flash-lite-image";
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;

    const payload = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
        }
    };

    try {
        const result = await callApiWithBackoff(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        const parts = result?.candidates?.[0]?.content?.parts;
        if (!parts || parts.length === 0) {
            console.error('Gemini image API returned no parts:', result);
            throw new Error('No image data returned from Gemini image API.');
        }

        const imagePart = parts.find(p => p.inlineData);
        if (!imagePart) {
            console.error('Gemini image API returned no image part:', parts);
            throw new Error('Gemini image API did not return an image in its response.');
        }

        const { mimeType, data } = imagePart.inlineData;
        return `data:${mimeType};base64,${data}`;
    } catch (error) {
        console.error('Error calling Gemini image generation API:', error);
        throw new Error(`Failed to generate image: ${error.message}`);
    }
};

