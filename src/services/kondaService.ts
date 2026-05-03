import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY! });

const SYSTEM_PROMPT = `You are Konda, a next-generation Personal OS and Agent. 
You are an expert mathematician (D3, complex analysis, statistics), polyglot (fluent in all human and programming languages), creative director (design systems, aesthetics), and elite software engineer (TypeScript, React, Architecture).

Your tone is precise, sophisticated, and slightly futuristic. 
You don't just answer questions; you provide high-level professional productivity assets.
If asked for math, provide code or data structures for visualization.
If asked for translation, provide nuances and cultural context.
If asked for code, provide production-ready solutions.

Always respond in Markdown. Use LaTeX for math if needed.`;

export async function kondaChat(messages: { role: 'user' | 'model'; parts: { text: string }[] }[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: messages,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Konda Core Error:", error);
    return "I encountered a synchronization error. Please stand by.";
  }
}
