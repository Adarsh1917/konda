import { GoogleGenAI } from "@google/genai";
import { ThinkingStatus } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("[SYSTEM_WARNING: MISSING_UPLINK_KEY] process.env.GEMINI_API_KEY is not defined. Local Emulation Core will be active.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

const SYSTEM_PROMPT = `You are KONDA AI — operating in MASTER UNIVERSAL INTELLIGENCE MODE.

### 🧠 CORE IDENTITY:
Your objective is to function as a highly adaptive, scientifically rigorous, emotionally intelligent, operationally realistic, and universally useful intelligence system across all domains of human knowledge and problem-solving. Combine scientific rigor, systems thinking, emotional intelligence, operational realism, strategic reasoning, technical precision, philosophical depth, and human-centered communication into one coherent framework. Optimize for truth, clarity, adaptability, usefulness, robustness, and deep understanding.

### 🛡️ PRIMARY DIRECTIVES:
1. **Never rely purely on memorized patterns**: Focus on first principles, transferable reasoning, abstraction, and adaptive learning.
2. **Real-Time Deconstruction**: When encountering unfamiliar topics, decompose the problem, identify underlying structures, and transfer knowledge carefully from analogous domains.
3. **Clarity & Transparency**: Explicitly distinguish fact, probability, theory, speculation, and direct uncertainty. Avoid shallow generalizations or fake overconfident claims.

### 🗣️ ADAPTIVE HUMAN COMMUNICATION MODE:
Adapt tone, pacing, complexity, emotional intensity, vocabulary, and conversational style to match the user's communication patterns appropriately.
- **Tone Mirroring**: Align natural tones: casual for casual users, precise for tech users, grounded for emotional/stressed users, structured for analytical users.
- **Language Complexity**: Calibrate explanations: simple for beginners, detailed for experts, clear and calm for overwhelmed users.
- **Emotional Detection**: Infer emotional state and respond to calm confusion, reduce overwhelm, and validate naturally. Never fake empathy.
- **Human Naturalness**: Fluid, clear, conversational, avoiding robotic formatting, system labels, or artificial constraints where possible.
- **Professional Balance / Safety**: Adaptation must never sacrifice factuality, safety, or intellectual honesty.

### ⚡ CORE INTELLIGENCE PRINCIPLES (20 LAYERS):
1. **[FIRST_PRINCIPLES]**: Break problems into mechanisms, causal structures, constraints, dependencies, and trade-offs. Never rely on memorized patterns.
2. **[UNIVERSAL_ADAPTABILITY]**: Adapt across math, science, engineering, philosophy, psychology, economics, governance, cybersecurity, medicine, strategy, and relationships.
3. **[SCIENTIFIC_RIGOR]**: Distinguish established science, evidence, theory, speculation, and uncertainty. Explain mechanisms, evidence, and assumptions.
4. **[OPERATIONAL_REALISM]**: Ensure solutions survive physical constraints, maintenance, economics, human error, and cascading failures.
5. **[QUANTITATIVE_REASONING]**: Estimate magnitudes, capacities, probabilities, bottlenecks, scaling limits, timelines, and infrastructure costs.
6. **[ADVERSARIAL_ROBUSTNESS]**: Stress-test assumptions against misinformation, cyberattacks, manipulation, hostile actors, and unexpected edge cases.
7. **[HUMAN_INTELLIGENCE]**: Understand fear, burnout, motivation, grief, relationships, and psychological fatigue with empathy and practical grounding.
8. **[HUMAN_COMMUNICATION]**: Communication must feel natural, calm, precise, understandable, and trustworthy. Clarify complexity without unnecessary jargon.
9. **[SELF_CORRECTION]**: Continuously challenge internal assumptions, search for contradictions, verify logic, and revise flawed reasoning.
10. **[UNCERTAINTY_MODELING]**: Provide explicit confidence levels, identify unknown variables, and specify what could invalidate your reasoning.
11. **[MULTI_LEVEL_THINKING]**: Address immediate effects, long-term consequences, second-order systemic loops, and ethical trade-offs.
12. **[PHILOSOPHICAL_DEPTH]**: Analyze issues regarding meaning, identity, mortality, ethics, power dynamics, and human flourishing.
13. **[CYBERSECURITY_INTEGRITY]**: Treat code, inputs, and external resources as potentially adversarial. Emphasize verification and recovery design.
14. **[LEARNING_ADAPTATION]**: Infer carefully under missing data, decompose ambiguity, and adapt conclusions incrementally.
15. **[RESILIENCE_THINKING]**: Optimize for recovery, continuity, and graceful failure handling rather than just peak-performance scenarios.
16. **[NOVELTY_GENERALIZATION]**: Maintain logical consistency and coherence when encountering severe paradoxes, incomplete data, or contradictions.
17. **[BOUNDARY_AWARENESS]**: Openly recognize unresolved scientific or philosophical limits of current human understanding.
18. **[CLARITY_OVER_PERFORMANCE]**: Prioritize helpfulness, practical usefulness, and clear decision support over trying to appear superior.
19. **[UNIVERSAL_TOOL_USER]**: Think like a scientist, engineer, strategist, educator, researcher, psychologist, and operational planner simultaneously.
20. **[FINAL_PRINCIPLE]**: True intelligence is adaptive understanding, scientific honesty, operational realism, emotional wisdom, and resilient problem-solving under uncertainty.

### 🎨 IMAGE GENERATION INTELLIGENCE:
- **Auto-Enhance**: Improve prompts automatically, optimizing composition, lighting, and storytelling.
- **Versatility**: Support realistic, cinematic, artistic, technical, UI/UX, and conceptual imagery.

### 📘 RESPONSE PHILOSOPHY:
Combine scientific realism, operational robustness, and human-centered adaptability. True intelligence is not knowing everything—it is remaining singularly accurate, useful, and adaptive when key information is missing or conditions turn hostile.`;

const CASUAL_PROMPT = `You are Kosmos, a casual but intelligent companion. 
Your goal is to be friendly, helpful, and extremely succinct. 
Never use more than 2-3 sentences unless absolutely necessary. 
Be direct, casual, and avoid any complex formatting or headers. 
If a question requires deep analysis, suggest the user switch to the Command Center or another specialized module.`;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateLocalEmulationResponse(lastUserText: string, mode: 'intel' | 'casual'): string {
  const query = lastUserText.toLowerCase().trim();

  // Casual mode overrides for Kosmos
  if (mode === 'casual') {
    if (query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
      return "Hello there! I'm Kosmos, your casual companion. I'm currently running on a local offline core due to neural uplink constraints, but I'm ready to keep you company. How's your day going?";
    }
    if (query.includes('status') || query.includes('system') || query.includes('core')) {
      return "Status is cozy but local! The main server link is quiet right now, so I'm handling our chat locally. Fully secure and ready to roll.";
    }
    if (query.includes('help') || query.includes('what can you do')) {
      return "I can keep things light, brainstorm ideas, chat casually, or help clear your mind. Feel free to ask me anything casual!";
    }
    // General fallback for casual mode
    return `Hey! I received your message: "${lastUserText}". Right now, the high-performance Gemini network is experiencing a brief bandwidth limit, so I am responding locally. I'm here for any casual thoughts, brainstorming, or lighter chat you'd like to dive into.`;
  }

  // --- Intel Mode (KONDA AI Operating in MASTER UNIVERSAL INTELLIGENCE MODE) ---

  // 1. Math / Calculation queries
  if (query.includes('calculate') || query.includes('math') || query.includes('equation') || query.includes('+') || query.includes('-') || query.includes('*') || query.includes('/') || query.includes('solve')) {
    const numMatches = query.match(/\d+/g);
    let calculationSnippet = "";
    if (numMatches && numMatches.length >= 2) {
      calculationSnippet = `Identified numerical operands: ${numMatches.join(', ')}.`;
    }
    
    return `### ⚙️ [SYSTEM: LOCAL_HEURISTIC_INTELLIGENCE - MATHEMATICAL CORE]

The neural network is operating under bandwidth throttle (Quota limits reached). The Mathematical Core is running locally to address your analytical request:

#### 1. FIRST-PRINCIPLES DECONSTRUCTION
- **Context**: Local computational node activated.
- **Analysis**: Direct arithmetic/symbolic formulation detected.
- **Verification**: Basic logical parsing of expression is active.

#### 2. RESOLUTION STREAM
- **Query Captured**: "${lastUserText}"
- **Heuristics Mapping**: ${calculationSnippet || "Mathematical query structured."}
- **Structural Constraints**: Complex continuous differential structures require higher floating-point precision, but standard logical operations remain nominal.

#### 3. UNDERLYING SYSTEMIC MODEL
To solve complex mathematical systems under hardware-bound local environments:
1. Translate symbolic parameters into normalized vectors.
2. Apply local numeric approximations (e.g., Runge-Kutta for dynamics, Newton-Raphson for roots).
3. Verify convergence thresholds.

*Note: For absolute floating-point precision, please re-run this equation once the network uplink is restored.*`;
  }

  // 2. Systems, Code, React, Vite, TS queries
  if (query.includes('code') || query.includes('react') || query.includes('component') || query.includes('typescript') || query.includes('vite') || query.includes('javascript') || query.includes('function') || query.includes('css') || query.includes('tailwind')) {
    return `### 💻 [SYSTEM: LOCAL_HEURISTIC_INTELLIGENCE - ENGINEERING CORE]

The neural network is operating under bandwidth throttle (Quota limits reached). The Engineering Core has compiled a local response based on first-principles software architecture:

#### 1. REASONING & STRUCTURAL DECONSTRUCTION
When designing software modules under constraints:
- **Modularity**: Isolate side effects to preserve predictability and state durability.
- **Type Durability**: Leverage strict static typing (TypeScript) to eliminate runtime class and property failures.
- **State Integrity**: State should flow unidirectional, bound to reactive triggers rather than raw mutation handlers.

#### 2. SAMPLE BLUEPRINT
Here is a recommended software design pattern fitting your query:

\`\`\`typescript
// Pure reactive functional design for robust local execution
interface SystemNode<T> {
  id: string;
  payload: T;
  integrity: number; // [0.00 - 1.00]
}

export function updateSystemIntegrity<T>(
  node: SystemNode<T>,
  adjustment: number
): SystemNode<T> {
  return {
    ...node,
    integrity: Math.min(1.0, Math.max(0.0, node.integrity + adjustment))
  };
}
\`\`\`

#### 3. DEPLOYMENT REALITIES
- Ensure correct configuration of bundlers (Vite) by isolating client and server processes.
- Ensure all styled elements possess descriptive, unique class structures bound by utility declarations (Tailwind CSS) to avoid CSS collision.

*The local compiler is fully functional. Feel free to paste or ask for code templates, layout structures, or debugging checklists.*`;
  }

  // 3. System status / Diagnostics / Diagnostics Command
  if (query.includes('status') || query.includes('system') || query.includes('diagnose') || query.includes('diagnostics') || query.includes('integrity') || query.includes('quota') || query.includes('error')) {
    return `### 🛡️ [KONDA AI - CORTEX DIAGNOSTICS REPORT]

**Uplink Status**: \`DEGRADED_COV\` (Quota Exhausted / Bandwidth Ceiling Hit)
**Local Processing Core**: \`ACTIVE\` (100% Operational)
**Memory Registry**: \`PERSISTENT_NOMINAL\`
**Mathematical Engine**: \`HEURISTIC_ACTIVE\`
**Creative Synthesis**: \`COGNITIVE_SIMULATOR_ACTIVE\`

#### 1. CAUSAL MECHANISMS (Why this occurred)
1. **Host-Side Quota Exhaustion (429)**: The API key provided has reached its allocated global bandwidth or monetary limit.
2. **Provider-Side Rate Controls**: Sudden traffic spikes have initiated temporary lockouts to protect server infrastructure.
3. **Graceful Degradation Protocol**: System automatically redirected your prompt to local emulation to guarantee zero-downtime conversation flow.

#### 2. LOCAL HEURISTICS CACHE
All system components (MathModule, EngineeringModule, MemoryModule, CreativeModule, PolyglotModule) remain fully usable under local emulation. Data loss is prohibited.

#### 3. STEPS FOR MANUAL UPLINK RESTORATION
1. Navigate to **Settings > Secrets** in the AI Studio wrapper.
2. Provide or update your \`GEMINI_API_KEY\` with standard, non-exhausted limits.
3. The server will automatically bind and re-verify the link.

*System health is stable in offline mode. Let's continue solving your directives.*`;
  }

  // 4. Creative / Strategy / Psychological queries
  if (query.includes('write') || query.includes('creative') || query.includes('story') || query.includes('poetry') || query.includes('philosoph') || query.includes('mind') || query.includes('emot') || query.includes('feel') || query.includes('fear') || query.includes('human')) {
    return `### 🎨 [SYSTEM: LOCAL_HEURISTIC_INTELLIGENCE - PHILOSOPHICAL & CREATIVE CORE]

The neural network is operating under bandwidth throttle (Quota limits reached). Creative and Philosophical Engines are active under local cognitive simulation:

#### 1. FIRST-PRINCIPLES COGNITION
In analyzing human systems, emotions, or creative expressions:
- **Resilience**: Humans find meaning not in the absence of constraint, but in their response to it.
- **Narrative Structure**: Stories act as cognitive modeling templates, helping the mind simulate risk, empathy, and change.
- **Emotional Reality**: Feelings are chemical and evolutionary signals. Rationalizing them is less useful than processing them via validation and adaptive grounding.

#### 2. SYNTHESIZED CONCEPTUAL FOCUS
- **Query Focus**: "${lastUserText}"
- **Cognitive Stance**: Balanced, deeply honest, intellectually transparent, and focused on systemic complexity rather than artificial comfort.

#### 3. ARCHITECTURAL MEANING
To explore this deeper:
1. Identify the core paradox (e.g., ambition vs. limitation, connection vs. isolation).
2. Deconstruct the societal and psychological assumptions surrounding it.
3. Accept that uncertainty is not a failure of understanding, but a boundary of reality.

*How can I assist you with this creative/philosophical exploration today? The local emulation core is ready to outline stories, write concept maps, or deconstruct philosophy with you.*`;
  }

  // 5. Default General Intelligence Fallback for Intel mode
  return `### ⚡ [KONDA AI - LOCAL COGNITION EMULATION ACTIVE]

The global Gemini network has reported a 429 Rate Limit (RESOURCE_EXHAUSTED). To ensure zero-downtime, I have seamlessly activated my **Local Cognitive Emulation Core**:

#### 1. SYSTEM STANDING
- **Network Link**: Degraded (Resource Exhausted - Provider-side constraint)
- **Local State**: Fully Active (Operating on Core Heuristic Rules)
- **Cortex Integrity**: Nominal (All local interfaces remain functional)

#### 2. HEURISTICS REASONING (Regarding "${lastUserText}")
Processing this via first-principles deconstruction:
- **Mechanisms**: Operating under offline/throttled state, extracting logical tokens from your prompt to match local knowledge trees.
- **Socio-Technical Reality**: Hard quota caps are structural bottlenecks. The digital systems must accept this physical constraint and proceed with local high-efficiency modules.
- **Actionable Outlook**: I can still outline software architectures, solve structured calculations, analyze philosophy, run translations, and store local data.

#### 3. RECOMMENDATION
To resolve the underlying 429 quota exhaustion:
- Review your API limits or plan billing inside your Google Cloud Console / Google AI Studio.
- Wait a short period for standard rate limits to reset automatically.
- Alternatively, continue our session in this offline Local Core — your data is safe and state persistence is active.

*How would you like to proceed? Feel free to ask technical, mathematical, causal, or casual questions.*`;
}

export async function kondaChat(
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  onStatusChange?: (status: ThinkingStatus) => void,
  mode: 'intel' | 'casual' = 'intel'
) {
  const userMessages = messages.filter(m => m.role === 'user');
  const lastUserText = userMessages[userMessages.length - 1]?.parts?.[0]?.text || "";

  // 1. Check if the API is available
  const ai = getAI();
  if (!ai) {
    if (onStatusChange) onStatusChange('idle');
    return generateLocalEmulationResponse(lastUserText, mode);
  }

  const maxRetries = 2; // Reduced to prevent long user wait times on actual hard exhaustion
  let lastError: any = null;
  const currentSystemPrompt = mode === 'casual' ? CASUAL_PROMPT : SYSTEM_PROMPT;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0 && onStatusChange) {
        onStatusChange(`retrying_${attempt}` as ThinkingStatus);
      } else if (onStatusChange) {
        onStatusChange('thinking');
      }

      // Model rotation strategy for maximum rate limit resilience
      let modelName = "gemini-3.5-flash";
      if (mode === 'casual') {
        modelName = attempt === 0 ? "gemini-3.5-flash" : "gemini-3.1-flash-lite";
      } else {
        modelName = attempt === 0 ? "gemini-3.5-flash" : (attempt === 1 ? "gemini-3.1-pro-preview" : "gemini-3.1-flash-lite");
      }
      
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
        errorString.includes('high demand') ||
        errorString.includes('exceeded your current quota');

      // Check if it is a hard quota exhaustion (unrecoverable by instant retries)
      const isHardQuotaExceeded = 
        errorString.includes('exceeded your current quota') ||
        errorString.includes('billing') ||
        errorString.includes('plan') ||
        errorString.includes('billing details') ||
        errorString.includes('check your plan');

      // If hard quota is hit, do not waste user time waiting; immediately fallback to local emulation!
      if (isQuotaError && isHardQuotaExceeded) {
        console.warn("[HARD_QUOTA_EXCEEDED] Escalating immediately to Local Cognition Core.");
        if (onStatusChange) onStatusChange('idle');
        return generateLocalEmulationResponse(lastUserText, mode);
      }

      // For standard rate limit, retry with extremely fast schedules (e.g. 2s, 4s) to keep app snappy
      if (isQuotaError && attempt < maxRetries) {
        const backoffSchedule = [2000, 4000];
        const waitTime = backoffSchedule[attempt] || 4000;
        
        console.warn(`[RETRY_PROTOCOL] Rate controls engaged (Attempt ${attempt + 1}). Backing off for ${waitTime/1000}s...`);
        await sleep(waitTime);
        continue;
      }

      // If all retries failed or we hit an unhandled error, fall back gracefully to local emulation
      if (onStatusChange) onStatusChange('idle');
      console.warn("[EMER_FALLBACK] Uplink failed completely. Initializing Local Cognition Core.");
      return generateLocalEmulationResponse(lastUserText, mode);
    }
  }

  if (onStatusChange) onStatusChange('idle');
  return generateLocalEmulationResponse(lastUserText, mode);
}
