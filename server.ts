import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI securely on the server
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uplinkSecure: !!process.env.GEMINI_API_KEY });
});

// Chat completion with true streaming
app.post("/api/chat", async (req, res) => {
  const { messages, mode, systemPrompt } = req.body;
  const ai = getAI();

  if (!ai) {
    // If no key is defined, send back a header or error indicating fallback is needed
    res.status(400).json({ error: "Missing Gemini API key on connection uplink." });
    return;
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: mode === "casual" ? "gemini-3.5-flash" : "gemini-3.5-flash",
      contents: messages,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      },
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      res.write(chunkText);
    }
    res.end();
  } catch (error: any) {
    console.error("[SERVER_GEMINI_CHAT_ERROR]", error);
    res.status(500).json({ error: error.message || "Uplink synchronization failure." });
  }
});

// Image generation API proxy
app.post("/api/generate-image", async (req, res) => {
  const { prompt, aspectRatio = "1:1" } = req.body;
  const ai = getAI();

  if (!ai) {
    res.status(400).json({ error: "Missing Gemini API key for image synthesis." });
    return;
  }

  try {
    // We Map Aspect Ratios to Imagen standard formats if supported
    // For Imagen the call structure is:
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }]
      }
    });

    // Alternatively, if they have custom image model or response, let's extract the inlineData or return standard output
    const text = response.text || "";
    res.json({ output: text });
  } catch (error: any) {
    console.error("[SERVER_GEMINI_IMAGE_ERROR]", error);
    res.status(500).json({ error: error.message || "Failed to synthesize visual asset via uplink." });
  }
});

// Main Server Setup (Vite / Production assets)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KONDA_SERVER_CORE] running on http://localhost:${PORT}`);
  });
}

startServer();
