import { GoogleGenAI } from "@google/genai";

export const generateCertificateText = async (
  topic: string, 
  tone: string, 
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We use a lighter model for simple text generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a concise, professional certificate body text (max 2 sentences) for a certificate of: ${topic}. Tone: ${tone}. Do not include placeholders like [Name], just the message.`,
    });

    return response.text || "For your outstanding participation and effort.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate text using AI.");
  }
};

/**
 * NOTE: Nodemailer cannot be used in the browser (frontend).
 * To send real emails, you must:
 * 1. Set up a backend server (Node.js/Express).
 * 2. Use the 'nodemailer' code there.
 * 3. Configure the Admin Panel 'SMTP Endpoint' to point to your backend.
 * 
 * The code below is removed to prevent build errors.
 */
