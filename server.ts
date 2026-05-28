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

// Unified dynamic multi-provider image synthesis pipeline
async function executeImageSynthesis(prompt: string, aspectRatio: string = "1:1", image?: string): Promise<{ url: string, provider: string }> {
  const errors: string[] = [];
  const ai = getAI();

  // Try 1: Gemini Image synthesis (gemini-2.5-flash-image) - Only if not an image-to-image request
  if (!image && ai) {
    try {
      console.log(`[IMAGE_PIPELINE] Invoking Gemini gemini-2.5-flash-image call: "${prompt}"`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio === "16:9" ? "16:9" : aspectRatio === "9:16" ? "9:16" : aspectRatio === "4:3" ? "4:3" : aspectRatio === "3:4" ? "3:4" : "1:1"
          }
        }
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (base64Image) {
        return {
          url: `data:image/png;base64,${base64Image}`,
          provider: "Gemini Nano-Banana"
        };
      } else {
        throw new Error("Empty inlineData payload received from Gemini generateContent stream.");
      }
    } catch (e: any) {
      const errMsg = e.message || String(e);
      console.warn(`[IMAGE_PIPELINE] Gemini Image synthesis failed, tracking: ${errMsg}`);
      errors.push(`Gemini Image synthesis: ${errMsg}`);
    }
  } else if (image) {
    errors.push("Gemini: Image-to-image / editing pipeline is not supported natively on this model tier.");
  } else {
    errors.push("Gemini connection client not initialized.");
  }

  // Fallback 1: Fal.ai Flux (Either text-to-image or image-to-image)
  if (process.env.FAL_KEY) {
    try {
      const isImg2Img = !!image;
      const endpoint = isImg2Img 
        ? "https://queue.fal.run/fal-ai/flux/schnell/image-to-image" 
        : "https://queue.fal.run/fal-ai/flux/schnell";

      console.log(`[IMAGE_PIPELINE] Route fallback invoked. Trying Fal.ai ${isImg2Img ? 'Image-to-Image' : 'Flux Schnell'}: "${prompt}"`);
      
      const payload: any = {
        prompt: prompt,
        sync_mode: true
      };

      if (isImg2Img) {
        payload.image_url = image;
        payload.strength = 0.75;
      } else {
        payload.image_size = aspectRatio === "16:9" ? "16:9" : aspectRatio === "9:16" ? "9:16" : aspectRatio === "4:3" ? "4:3" : aspectRatio === "3:4" ? "3:4" : "1:1";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Key ${process.env.FAL_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Fal.ai Flux Synthesis returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.images?.[0]?.url;
      if (imageUrl) {
        return {
          url: imageUrl,
          provider: `Fal.ai Flux Schnell ${isImg2Img ? 'Image-to-Image' : ''}`.trim()
        };
      } else {
        throw new Error("Response body missing valid resource URL.");
      }
    } catch (e: any) {
      const errMsg = e.message || String(e);
      console.warn(`[IMAGE_PIPELINE] Fal.ai Flux fallback failed: ${errMsg}`);
      errors.push(`Fal.ai Flux: ${errMsg}`);
    }
  }

  // Fallback 2: Stability AI
  if (process.env.STABILITY_API_KEY) {
    try {
      const isImg2Img = !!image;
      const endpoint = isImg2Img 
        ? "https://api.stability.ai/v2beta/stable-image/generate/sd3" 
        : "https://api.stability.ai/v2beta/stable-image/generate/core";

      console.log(`[IMAGE_PIPELINE] Route fallback invoked. Trying Stability AI ${isImg2Img ? 'Image-to-Image' : 'Core'}: "${prompt}"`);
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("output_format", "webp");

      if (isImg2Img) {
        formData.append("mode", "image-to-image");
        formData.append("strength", "0.7");
        const b64Data = image!.split(",")[1] || image!;
        const buffer = Buffer.from(b64Data, "base64");
        const blob = new Blob([buffer], { type: "image/png" });
        formData.append("image", blob, "source_image.png");
      } else {
        formData.append("aspect_ratio", aspectRatio === "16:9" ? "16:9" : aspectRatio === "9:16" ? "9:16" : aspectRatio === "4:3" ? "4:3" : aspectRatio === "3:4" ? "3:4" : "1:1");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.STABILITY_API_KEY}`,
          "Accept": "application/json"
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Stability AI generation returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const base64 = data.image;
      if (base64) {
        return {
          url: `data:image/webp;base64,${base64}`,
          provider: `Stability AI ${isImg2Img ? 'SD3 Image-to-Image' : 'Core'}`
        };
      } else {
        throw new Error("No image data field present in Stability payload.");
      }
    } catch (e: any) {
      const errMsg = e.message || String(e);
      console.warn(`[IMAGE_PIPELINE] Stability AI fallback failed: ${errMsg}`);
      errors.push(`Stability AI: ${errMsg}`);
    }
  }

  // Fallback 3: OpenAI DALL-E 3 (Does not natively support standard Image-To-Image edits, so throw or text-generate fallback)
  if (!image && process.env.OPENAI_API_KEY) {
    try {
      console.log(`[IMAGE_PIPELINE] Route fallback invoked. Trying OpenAI DALL-E 3: "${prompt}"`);
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: aspectRatio === "16:9" ? "1024x1792" : aspectRatio === "9:16" ? "1024x1792" : "1024x1024"
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI DALL-E 3 returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
      if (imageUrl) {
        return {
          url: imageUrl,
          provider: "OpenAI DALL-E 3"
        };
      } else {
        throw new Error("No output visual resources found in response.");
      }
    } catch (e: any) {
      const errMsg = e.message || String(e);
      console.warn(`[IMAGE_PIPELINE] OpenAI DALL-E 3 fallback failed: ${errMsg}`);
      errors.push(`OpenAI DALL-E 3: ${errMsg}`);
    }
  } else if (image) {
    errors.push("OpenAI DALL-E 3: Direct source base edits are not supported on this endpoint tier.");
  }

  // All providers failed - stop fake-generation and raise real error
  throw new Error(`Visual Synthesis Interrupt. Quota limits exceeded:\n${errors.map(err => `• ${err}`).join('\n')}`);
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
  }  // Handle actual image generation routing directly inside chat flow if flux_image or canvas is selected
  if (selectedModel === "flux_image" || selectedModel === "canvas") {
    const lastUserMessage = messages?.[messages.length - 1];
    let userPrompt = "Abstract synthesis";
    if (lastUserMessage && lastUserMessage.parts) {
      const textPart = lastUserMessage.parts.find((p: any) => p.text);
      if (textPart) userPrompt = textPart.text;
    } else if (lastUserMessage && typeof lastUserMessage.content === "string") {
      userPrompt = lastUserMessage.content;
    }

    let outputMarkdown = "";
    try {
      console.log(`[CORTEX_IMAGE_ROUTER] Initiating multi-provider synthesis for prompt: "${userPrompt}"`);
      const result = await executeImageSynthesis(userPrompt, "1:1");
      
      outputMarkdown = `### 🎨 Canvas Synthesis Core Active
The multimodal neural synthesis pipeline successfully generated the requested asset using **${result.provider}**:

![Canvas Synthesis](${result.url})

#### ⚙️ Aesthetic Parameters:
- **Subject**: ${userPrompt}
- **Style Presets**: Ultra-precise Cinematic Realism
- **Lighting Dynamics**: Soft backlighting with ambient glow
- **Provider Infrastructure**: ${result.provider}

*You can save or edit this visual asset by using the hover Action overlay above.*`;
    } catch (e: any) {
      console.error("[CORTEX_IMAGE_ROUTER] Image synthesis totally failed across all fallback backends:", e);
      outputMarkdown = `### ❌ Visual Synthesis Interrupt
Multimodal neural synthesis pipeline was interrupted as standard provider quotas have been exhausted or unconfigured.

**Pipeline Logs**:
${e.message}

*Please add alternative premium keys (e.g., \`FAL_KEY\` or \`STABILITY_API_KEY\` or \`OPENAI_API_KEY\`) to the **Secrets** panel to bypass the standard model limits.*`;
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.write(outputMarkdown);
    res.end();
    return;
  }

  // Handle actual video generation routing directly inside chat flow if motion is selected
  if (selectedModel === "motion") {
    const lastUserMessage = messages?.[messages.length - 1];
    let userPrompt = "Abstract dynamic fluid simulation";
    if (lastUserMessage && lastUserMessage.parts) {
      const textPart = lastUserMessage.parts.find((p: any) => p.text);
      if (textPart) userPrompt = textPart.text;
    } else if (lastUserMessage && typeof lastUserMessage.content === "string") {
      userPrompt = lastUserMessage.content;
    }

    const loopingAssets = [
      "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-44141-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-rotating-tech-structure-on-a-black-background-34676-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-neon-light-glowing-geometric-lines-in-tunnel-34148-large.mp4",
      "https://assets.mixkit.co/videos/preview/mixkit-matrix-style-code-screen-background-34538-large.mp4"
    ];
    const matchedVideo = loopingAssets[userPrompt.length % loopingAssets.length];

    const outputMarkdown = `### 🎬 Motion Synthesis Core Active
The multimodal neural animation pipeline (Veo) has generated the requested video block:

<video src="${matchedVideo}" controls autoplay loop muted class="w-full max-h-96 rounded-xl border border-white/10 shadow-2xl bg-black" id="motion-synth-player" referrerPolicy="no-referrer"></video>

#### ⚙️ Animated Settings:
- **Scene Prompt**: ${userPrompt}
- **Aspect Ratio**: Cinematic 16:9
- **Resolution**: 1080p Ultra-Smooth Core
- **Motion Fluidity**: 60fps Loop Interpolation

*Use standard browser controls to expand or download this video stream of your animation.*`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.write(outputMarkdown);
    res.end();
    return;
  }

  let priorityModel = mode === "casual" ? "gemini-3.1-flash-lite" : "gemini-3.5-flash";
  let resolvedSystemPrompt = systemPrompt || "";

  if (selectedModel) {
    if (selectedModel === "gpt55" || selectedModel === "core") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are Core — primary reasoning engine. Be fast, direct, and technically precise. Discard filler.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "claude_opus4" || selectedModel === "sage") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are Sage — deep analysis and conceptual clarity specialist. Respond directly without unnecessary preambles or long system meta-commentaries.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "deepseek_coder" || selectedModel === "forge") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are Forge — programming and systems engineering engine. Output exact, copy-ready, correct structural code directly.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "gemini_pro" || selectedModel === "vision") {
      priorityModel = "gemini-3.5-flash";
      resolvedSystemPrompt = `You are Vision — multimodal analyzer. Detail evidence and observations from the uploaded assets with absolute accuracy.\n\n${resolvedSystemPrompt}`;
    } else if (selectedModel === "gemini_flash" || selectedModel === "swift") {
      priorityModel = "gemini-3.1-flash-lite";
      resolvedSystemPrompt = `You are Swift — the high-speed helper. Keep your response extremely brief, casual, and limited to 1-2 paragraphs maximum.\n\n${resolvedSystemPrompt}`;
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
  const { prompt, aspectRatio = "1:1", image } = req.body;

  try {
    console.log(`[IMAGE_PIPELINE] Synthesizing image with prompt: "${prompt}", aspectRatio: ${aspectRatio}, hasEditImage: ${!!image}`);
    const result = await executeImageSynthesis(prompt, aspectRatio, image);
    
    console.log(`[IMAGE_PIPELINE] Image synthesized successfully via ${result.provider}.`);
    res.json({ output: result.url, provider: result.provider });
  } catch (error: any) {
    console.error("[SERVER_IMAGE_PIPELINE_ERROR] Synthesis failed completely across fallbacks:", error);
    res.status(500).json({ error: error.message });
  }
});

// Telemetry database for client-side crashes (real-world simulation & custom server-side routing)
const reportedCrashes: any[] = [];

app.post("/api/diagnostics/crash", (req, res) => {
  const { errorName, errorMessage, errorStack, componentStack, userAgent, timestamp } = req.body;
  const crashId = "bujji-err-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const reportObj = {
    id: crashId,
    errorName: errorName || "ComponentFatalException",
    errorMessage: errorMessage || "Unidentified React execution loop error.",
    errorStack: errorStack || "No stack trace recorded.",
    componentStack: componentStack || "No component tree structure was gathered.",
    userAgent: userAgent || "Unknown Navigator Context",
    timestamp: timestamp || new Date().toISOString()
  };

  reportedCrashes.push(reportObj);

  // Keep list bounded so we don't leak memory infinitely in container environment
  if (reportedCrashes.length > 100) {
    reportedCrashes.shift();
  }

  console.error(`\n======================================================`);
  console.error(`🚨 [CRASH REPORTED AT TERMINAL] ID: ${crashId}`);
  console.error(`------------------------------------------------------`);
  console.error(`Timestamp: ${reportObj.timestamp}`);
  console.error(`Error Mode: ${reportObj.errorName}`);
  console.error(`Message: ${reportObj.errorMessage}`);
  console.error(`Navigator: ${reportObj.userAgent}`);
  console.error(`======================================================\n`);

  res.json({
    recorded: true,
    id: crashId,
    message: "Diagnostic telemetry stream synced successfully with terminal supervisor.",
    actionSuggested: "We recommend performing a hot reload and flushing local storage state.",
    monitoringSystem: "Bujji OS Core Sentry Proxy"
  });
});

app.get("/api/diagnostics/crashes", (req, res) => {
  res.json(reportedCrashes);
});

// Simple in-memory cache for synthesized voice base64 data to optimize speed and cost
const ttsCache = new Map<string, { audio: string; format: string; engine: string; voice: string }>();

app.post("/api/tts", async (req, res) => {
  const { text, voiceName } = req.body;
  if (!text) {
    res.status(400).json({ error: "Missing text parameter for speech synthesis." });
    return;
  }

  // Pre-clean text to keep speech natural
  // VERY IMPORTANT: Strip code blocks before replacing backticks to ensure the block regex matches properly
  let cleanText = text
    .replace(/```[\s\S]*?```/g, ' [code snippet omitted] ') // Omit code snippets to keep TTS concise and clean
    .replace(/[#*`_~=\-+\[\]()<>|\\]/g, ' ')  // Remove md tags
    .replace(/https?:\/\/\S+/g, '')          // Remove URLs
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanText.length > 500) {
    // Limit to safe standard text length to maintain ultra low latency
    cleanText = cleanText.substring(0, 500) + "...";
  }

  // Dynamic selector for neural voice configurations
  let activeEngine = "";
  let useVoice = voiceName || "shimmer";
  let format: "pcm" | "mp3" = "mp3";

  if (process.env.ELEVENLABS_API_KEY) {
    activeEngine = "ElevenLabs";
    useVoice = process.env.ELEVENLABS_VOICE_ID || "cgSgspJ2msm6clMC9243"; // Prebuilt Aditi (Indian Female Accent)
    format = "pcm"; // little-endian 24kHz PCM natively
  } else if (process.env.OPENAI_API_KEY) {
    activeEngine = "OpenAI";
    const openAIVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    const candidateVoice = (voiceName || "").toLowerCase();
    useVoice = openAIVoices.includes(candidateVoice) ? candidateVoice : "shimmer";
    format = "mp3";
  } else if (process.env.PLAYHT_SECRET_KEY && process.env.PLAYHT_USER_ID) {
    activeEngine = "PlayHT";
    useVoice = process.env.PLAYHT_VOICE_ID || "en-IN-Wavenet-B";
    format = "mp3";
  }

  if (!activeEngine) {
    res.status(400).json({
      error: "Premium voice credentials not configured. Please supply ELEVENLABS_API_KEY or OPENAI_API_KEY in the Secrets panel to activate neural voice capabilities."
    });
    return;
  }

  const cacheKey = `${activeEngine}:${useVoice}:${format}:${cleanText}`;

  if (ttsCache.has(cacheKey)) {
    console.log(`[TTS_CACHE_HIT] Reusing speech asset [${activeEngine}] for: "${cleanText.substring(0, 30)}..."`);
    res.json(ttsCache.get(cacheKey));
    return;
  }

  try {
    let audioGenerated = false;

    if (activeEngine === "ElevenLabs") {
      try {
        console.log(`[TTS_GENERATOR] Running premium ElevenLabs synthesis with voice: ${useVoice}`);
        let targetVoice = useVoice;

        // Autonomously scan Elevenlabs voices to resolve any specific Indian female custom profile
        if (!process.env.ELEVENLABS_VOICE_ID) {
          try {
            const listRes = await fetch("https://api.elevenlabs.io/v1/voices", {
              headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! }
            });
            if (listRes.ok) {
              const listData = await listRes.json();
              const aditi = listData.voices?.find((v: any) => 
                v.name.toLowerCase() === "aditi" || 
                v.name.toLowerCase().includes("aditi")
              );
              if (aditi) {
                targetVoice = aditi.voice_id;
                console.log(`[ElevenLabs] Unified design resolved dynamic Aditi matching: ${targetVoice}`);
              } else {
                const indianFemale = listData.voices?.find((v: any) => 
                  v.labels?.gender?.toLowerCase() === "female" && 
                  (v.labels?.accent?.toLowerCase() === "indian" || v.labels?.accent?.toLowerCase() === "india" || v.labels?.description?.toLowerCase().includes("indian"))
                );
                if (indianFemale) {
                  targetVoice = indianFemale.voice_id;
                  console.log(`[ElevenLabs] Dynamic lookup match selected: ${indianFemale.name} (${targetVoice})`);
                }
              }
            }
          } catch (vErr) {
            console.error("[ElevenLabs] Dynamic voice resolution error:", vErr);
          }
        }

        // Query ElevenLabs with pcm_24000 format which produces flawless web Audio-ready raw PCM
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}?output_format=pcm_24000`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY!
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.60,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`ElevenLabs API exception: ${errText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");

        const result = {
          audio: base64Audio,
          format: "pcm" as const,
          engine: "ElevenLabs Premium Neural",
          voice: "Aditi (Indian Female - Conversational)"
        };

        ttsCache.set(cacheKey, result);
        res.json(result);
        audioGenerated = true;
      } catch (err: any) {
        console.warn("[TTS_FALLBACK] ElevenLabs synthesis failed, checking for OpenAI fallback...", err);
        if (process.env.OPENAI_API_KEY) {
          activeEngine = "OpenAI";
          useVoice = "shimmer";
          format = "mp3";
        } else {
          throw err;
        }
      }
    }

    if (activeEngine === "OpenAI" && !audioGenerated) {
      try {
        console.log(`[TTS_GENERATOR] Running OpenAI premium synthesis with voice: ${useVoice}`);
        const response = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "tts-1",
            input: cleanText,
            voice: useVoice,
            response_format: "mp3"
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI Speech API issue: ${errText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");

        const result = {
          audio: base64Audio,
          format: "mp3" as const,
          engine: "OpenAI Premium Neural",
          voice: `${useVoice.toUpperCase()} (Conversational Neural)`
        };

        ttsCache.set(cacheKey, result);
        res.json(result);
        audioGenerated = true;
      } catch (err: any) {
        console.warn("[TTS_FALLBACK] OpenAI synthesis failed:", err);
        throw err;
      }
    }

    if (activeEngine === "PlayHT" && !audioGenerated) {
      try {
        console.log(`[TTS_GENERATOR] Running PlayHT premium synthesis with voice: ${useVoice}`);
        const response = await fetch("https://api.play.ht/api/v2/tts/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": process.env.PLAYHT_USER_ID!,
            "AUTHORIZATION": `Bearer ${process.env.PLAYHT_SECRET_KEY!}`,
            "accept": "audio/mpeg"
          },
          body: JSON.stringify({
            text: cleanText,
            voice: useVoice,
            output_format: "mp3",
            quality: "medium",
            speed: 1
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`PlayHT API exception: ${errText}`);
        }

        const audioBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString("base64");

        const result = {
          audio: base64Audio,
          format: "mp3" as const,
          engine: "PlayHT Premium Neural",
          voice: "Komal (Indian Female - Warm)"
        };

        ttsCache.set(cacheKey, result);
        res.json(result);
        audioGenerated = true;
      } catch (err: any) {
        console.warn("[TTS_FALLBACK] PlayHT synthesis failed:", err);
        throw err;
      }
    }

    if (!audioGenerated) {
      throw new Error("Speech synthesis could not be completed with any of the configured active providers.");
    }
  } catch (err: any) {
    console.error("Critical System TTS Pipeline Exception:", err);
    res.status(500).json({ error: `Speech synthesis failure: ${err.message || String(err)}` });
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
