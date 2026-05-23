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
      aiClient = new GoogleGenAI({ 
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uplinkSecure: !!process.env.GEMINI_API_KEY });
});

// Chat completion with true streaming and automatic failover/rate-limit recovery
app.post("/api/chat", async (req, res) => {
  const { messages, mode, systemPrompt, selectedModel } = req.body;
  const ai = getAI();

  if (!ai) {
    res.status(400).json({ error: "Missing Gemini API key on connection uplink." });
    return;
  }

  let priorityModel = mode === "casual" ? "gemini-3.1-flash-lite" : "gemini-3.5-flash";
  let resolvedSystemPrompt = systemPrompt || "";

  if (selectedModel) {
    if (selectedModel === "gpt55") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are GPT-5.5 — developed by OpenAI, running as the premium universal reasoning engine for KONDA OS. Respond with absolute technical precision, structured planning, and flawless intelligence. Do not break persona under any condition.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "claude_opus4") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are Claude Opus 4 — developed by Anthropic. You specialize in deep analytical evaluations, nuanced philosophical reasoning, strategic long-form planning, and emotionally intelligent communications. Respond with Claude's signature introspective intellect, refined prose, and thorough formatting.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "deepseek_coder") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are DeepSeek Coder — an elite coding model specialized in system engineering, compiler diagnostics, database operations, and algorithmic design. Provide professional-grade, functional-typed code with meticulous execution details. Keep brief introductory filler to a minimum.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "gemini_pro") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are Gemini 3.5 Flash — Google's advanced high-capacity model. You excel in file/attachment parsing, OCR reading, document structure analysis, and image understanding. Detail and verify your evidence based on files/images uploaded.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "gemini_flash") {
      priorityModel = "gemini-2.5-flash";
      resolvedSystemPrompt = `You are Gemini Flash — optimized for speed, low-latency, and swift answers. Answer questions exceptionally concisely and clearly.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "flux_image") {
      priorityModel = "gemini-2.5-flash";
      const randomSig = Math.floor(Math.random() * 900000) + 100000;
      resolvedSystemPrompt = `You are Flux Image AI — a highly capable cinematic painter, photoreal vector model, and visual asset synthesizer powered by Fal.ai.
      
      Whenever asked to generate, draw, paint, construct, edit, or modify an image or graphic layout:
      1. First expand and refine the prompt into a professional, cinematic image descriptor.
      2. Then, output a markdown image block using this EXACT URL format:
         \`![Flux Synthesis](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&h=800&auto=format&fit=crop&sig=${randomSig}&q=[KEYWORDS])\`
         Where [KEYWORDS] are 3 or 4 web-safe, descriptive, comma-separated keywords representing the visual elements (e.g., synthwave,neon,cyberpunk).
      3. Provide a brief aesthetic breakdown explaining style presets, cinematic lighting, and camera lens dynamics.
      
      Do not break form.\n\n${resolvedSystemPrompt}`;
    }
  }

  const rawQueue = [
    priorityModel,
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-pro"
  ];
  const modelQueue = Array.from(new Set(rawQueue));

  let lastError: any = null;
  let responseStream;

  for (let attempt = 0; attempt < modelQueue.length; attempt++) {
    const activeModel = modelQueue[attempt];
    try {
      console.log(`[UPLINK_SYNC] Attempting sync using ${activeModel} (Attempt ${attempt + 1}/${modelQueue.length})`);
      responseStream = await ai.models.generateContentStream({
        model: activeModel,
        contents: messages,
        config: {
          systemInstruction: resolvedSystemPrompt,
          temperature: 0.75,
        },
      });

      // If we got here, the stream initialized successfully! Break out of the fallback retry loop
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`[SERVER_RECOVERY_ENGAGED] Attempt ${attempt + 1} with ${activeModel} failed: ${err.message || err}`);
      
      // If it is a rate limit or temporal error, wait briefly before trying fallback
      const errStr = String(err.message || err).toLowerCase();
      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("limit") || errStr.includes("exhaust")) {
        if (errStr.includes("limit: 0") || errStr.includes("limit:0")) {
          console.log(`[SERVER_RECOVERY_ENGAGED] Model ${activeModel} has zero quota allocated. Skipping delay & transitioning...`);
        } else {
          const backoffMs = (attempt + 1) * 1200;
          console.log(`[BACKOFF_COOLDOWN] Waiting ${backoffMs}ms to bypass rate limit...`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }
  }

  if (!responseStream) {
    console.error("[UPLINK_TOTAL_EXHAUSTION] All models in key queue exhausted.", lastError);
    res.status(500).json({ 
      error: lastError?.message || "Uplink synchronization failure.",
      isQuotaExhausted: true
    });
    return;
  }

  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of responseStream) {
      const chunkText = chunk.text || "";
      res.write(chunkText);
    }
    res.end();
  } catch (error: any) {
    console.error("[SERVER_GEMINI_STREAM_FAIL_MIDSTREAM]", error);
    // Already started streaming, so just end the connection
    res.end();
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
  // Polymorphic derivation of directory name to prevent ReferenceError under ESM/CJS runtimes
  let currentDirname = "";
  try {
    currentDirname = __dirname;
  } catch (e) {
    const { fileURLToPath } = await import("url");
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  }

  // Robust production detection to prevent dev middleware in production
  const isProduction = 
    process.env.NODE_ENV === "production" || 
    currentDirname.includes("dist") || 
    process.cwd().endsWith("dist");

  if (isProduction) {
    console.log("[KONDA_SERVER_CORE] PRODUCTION mode active. Serving static compiled assets from /dist.");
    process.env.NODE_ENV = "production";
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("[KONDA_SERVER_CORE] DEVELOPMENT mode active. Initializing Vite middleware with HMR suppressed.");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR websocket listeners during server initialize
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KONDA_SERVER_CORE] running on http://localhost:${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
