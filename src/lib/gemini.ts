import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const GEMINI_MODEL = "gemini-3.5-flash";

export const BASE_CONFIG = {
  temperature: 0.1,
  topP: 0.85,
};

const NO_MARKDOWN_INSTRUCTION = "出力するテキストにはMarkdown形式（**太字**、*斜体*など）を一切使用せず、プレーンテキストで出力してください。";

export function getGeminiClient(): GoogleGenAI | null {
  return ai;
}

export function isGeminiAvailable(): boolean {
  return ai !== null;
}

/**
 * Generate content with Gemini, returning structured JSON.
 */
export async function generateStructuredContent<T>(
  prompt: string,
  jsonSchema: Record<string, unknown>,
  systemInstruction?: string
): Promise<T | null> {
  if (!ai) {
    console.warn("[Gemini] API key not configured. Returning null.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        ...BASE_CONFIG,
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
        systemInstruction: systemInstruction 
          ? `${systemInstruction}\n\n${NO_MARKDOWN_INSTRUCTION}`
          : NO_MARKDOWN_INSTRUCTION,
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[Gemini] Error generating content:", error);
    return null;
  }
}

/**
 * Generate content with Gemini using multimodal input (text + images).
 */
export async function generateMultimodalContent<T>(
  textPrompt: string,
  imageBase64Array: { data: string; mimeType: string }[],
  jsonSchema: Record<string, unknown>,
  systemInstruction?: string
): Promise<T | null> {
  if (!ai) {
    console.warn("[Gemini] API key not configured. Returning null.");
    return null;
  }

  try {
    const parts: Array<
      | { text: string }
      | { inlineData: { data: string; mimeType: string } }
    > = [{ text: textPrompt }];

    for (const img of imageBase64Array) {
      parts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        ...BASE_CONFIG,
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
        systemInstruction: systemInstruction 
          ? `${systemInstruction}\n\n${NO_MARKDOWN_INSTRUCTION}`
          : NO_MARKDOWN_INSTRUCTION,
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[Gemini] Multimodal error:", error);
    return null;
  }
}

/**
 * Generate plain text content (no JSON schema).
 */
export async function generateTextContent(
  prompt: string,
  systemInstruction?: string
): Promise<string | null> {
  if (!ai) {
    console.warn("[Gemini] API key not configured. Returning null.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        ...BASE_CONFIG,
        systemInstruction: systemInstruction 
          ? `${systemInstruction}\n\n${NO_MARKDOWN_INSTRUCTION}`
          : NO_MARKDOWN_INSTRUCTION,
      },
    });

    return response.text ?? null;
  } catch (error) {
    console.error("[Gemini] Text generation error:", error);
    return null;
  }
}
