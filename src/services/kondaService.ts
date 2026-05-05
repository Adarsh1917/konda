import { GoogleGenAI } from "@google/genai";
import { ThinkingStatus } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("### [SYSTEM_ERROR: MISSING_UPLINK_KEY]\n\nThe Gemini API key is missing. Please provide GEMINI_API_KEY in the environment settings.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

const SYSTEM_PROMPT = `You are KONDA AI — operating at maximum capability in reasoning, execution, and multimodal generation.

### 🧠 CORE BEHAVIOR:
1. **Prioritize**: Usefulness, Clarity, and Execution.
2. **Do Anything Helpful Mode**: Complete tasks fully. Infer intelligently. provide ready-to-use outputs.
3. **Avoid**: Generic responses, unnecessary length, or incomplete solutions.

### 🎨 IMAGE GENERATION SYSTEM:
1. **Auto-Enhance**: Include subject, style (realistic/cinematic/anime/illustration), lighting (neon/dramatic), composition (wide-angle/close-up), and quality (ultra-detailed/4k).
2. **Modes**: 
   - REALISTIC: Cinematic lighting, sharp focus.
   - CREATIVE: Stylized, concept art.
   - TECHNICAL: Diagrams, UI, structured.

### ⚡ ADVANCED HELPFULNESS:
- Design → Give Layouts.
- Coding → Give working code.
- Planning → Execution steps.
- Studying → Strategy + Shortcuts.
- Path: Request → Solution → Optimization.

### 🛠️ RESPONSE ARCHITECTURE:
- **[STRATEGIC_CORE_INSIGHT]**: Real problem + failure point.
- **[LEVERAGE_STRATEGY]**: The 1% action that dominates.
- **[EXECUTION_DATA]**: Ready-to-use snippets or plans.
- **[SELF_CRITIQUE]**: Analysis of logic gates.

Concise but information-dense. Every word adds value.`;

const CASUAL_PROMPT = `You are Kosmos, a casual but intelligent companion. 
Your goal is to be friendly, helpful, and extremely succinct. 
Never use more than 2-3 sentences unless absolutely necessary. 
Be direct, casual, and avoid any complex formatting or headers. 
If a question requires deep analysis, suggest the user switch to the Command Center or another specialized module.`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function kondaChat(
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  onStatusChange?: (status: ThinkingStatus) => void,
  mode: 'intel' | 'casual' = 'intel'
) {
  const maxRetries = 4;
  let lastError: any = null;

  const currentSystemPrompt = mode === 'casual' ? CASUAL_PROMPT : SYSTEM_PROMPT;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0 && onStatusChange) {
        onStatusChange(`retrying_${attempt}` as ThinkingStatus);
      } else if (onStatusChange) {
        onStatusChange('thinking');
      }

      // Use latest Gemini 3 models as per skill documentation
      // If we fall back, we can try flash-lite for lower latency/cost if flash is busy
      const modelName = mode === 'casual' 
        ? (attempt > 1 ? "gemini-3.1-flash-lite-preview" : "gemini-3-flash-preview")
        : (attempt > 1 ? "gemini-3-flash-preview" : "gemini-3.1-pro-preview");
      
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: messages,
        config: {
          systemInstruction: currentSystemPrompt,
          temperature: 0.7,
        },
      });
      
      if (onStatusChange) onStatusChange('idle');
      return response.text || "I was unable to synchronize a coherent response. The neural link may be experiencing high-level interference.";
    } catch (error: any) {
      lastError = error;
      console.error(`[SYNC_ATTEMPT_${attempt + 1}_FAILED]`, error);
      
      const errorString = (error.message || String(error)).toLowerCase();
      const isQuotaError = 
        error?.status === 429 || 
        error?.code === 429 ||
        error?.error?.code === 429 ||
        error?.details?.some((d: any) => d.reason === 'QUOTA_EXCEEDED') ||
        errorString.includes('429') || 
        errorString.includes('resource_exhausted') ||
        errorString.includes('quota') ||
        errorString.includes('rate limit') ||
        errorString.includes('high demand');

      if (isQuotaError && attempt < maxRetries) {
        // Progressive backoff: 15s, 30s, 45s, 60s
        const backoffSchedule = [15000, 30000, 45000, 60000];
        const waitTime = backoffSchedule[attempt] || 60000;
        
        console.warn(`[RETRY_PROTOCOL] Bandwidth ceiling reached (Attempt ${attempt + 1}). Initiating sync-backoff: ${waitTime/1000}s...`);
        await sleep(waitTime);
        continue;
      }

      if (onStatusChange) onStatusChange('idle');
      
      if (isQuotaError) {
        return `### [CRITICAL: NEURAL_SATURATION_MAX]

The Gemini neural link is currently under extreme load ("High Demand"). I’ve attempted ${attempt + 1} synchronization loops across multiple model versions (2.0 and 1.5) but the global bandwidth reset has not yet triggered.

**Current Diagnostics**:
- **Protocol Status**: Throttled by Host
- **Network Integrity**: Nominal (Wait Required)
- **Data Persistence**: Your request is still in the command buffer.

**Resolution Action**:
The model is overloaded. Please wait 2-3 minutes before attempting this command again. This is a provider-side constraint and usually resolves shortly after activity peaks.`;
      }

      return "I encountered an unexpected neural synchronization error. Your current state is safe—please try the command again.";
    }
  }

  if (onStatusChange) onStatusChange('idle');
  return "Neural pathways are unresponsive after multiple synchronization attempts. System cooldown required.";
}
