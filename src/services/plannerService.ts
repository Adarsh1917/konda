/**
 * Konda AI Autonomous Planner Service
 * Analyzes incoming prompts and dynamically routes to the appropriate Expert Node.
 */

export type TaskCategory = 'CODING' | 'RESEARCH' | 'LEARNING' | 'CREATIVE' | 'GENERAL_CHAT';

export interface PlannerResult {
  category: TaskCategory;
  expertPersona: string;
  reasoning: string;
}

export function planTask(userPrompt: string): PlannerResult {
  const query = userPrompt.toLowerCase().trim();

  // 1. Detect Coding Tasks
  const codingKeywords = [
    'code', 'program', 'developer', 'react', 'typescript', 'vite', 'javascript',
    'function', 'class', 'html', 'css', 'tailwind', 'api', 'json', 'bug', 'error',
    'compiler', 'exception', 'npm', 'database', 'sql', 'git', 'refactor', 'algorithm',
    'write a function', 'write a component', 'implement a', 'how to code'
  ];
  if (codingKeywords.some(kw => query.includes(kw))) {
    return {
      category: 'CODING',
      expertPersona: 'You are Forge — the elite senior systems and programming engineer. Output exact, beautifully styled, self-contained, copy-ready code blocks and resolve all potential compilation issues with utmost care.',
      reasoning: 'Coding query detected due to technical software engineering indicators.'
    };
  }

  // 2. Detect Research Tasks
  const researchKeywords = [
    'research', 'scientific', 'viewpoint', 'compare', 'analysis', 'empirical',
    'evidence', 'paper', 'source', 'study', 'literature', 'deconstruct', 'philosoph',
    'ethical', 'ethics', 'strategy', 'strategic', 'existential'
  ];
  if (researchKeywords.some(kw => query.includes(kw))) {
    return {
      category: 'RESEARCH',
      expertPersona: 'You are Sage — the principal research scientist and analytical strategist. Gather multiple viewpoints, distinguish facts from opinions, highlight key scientific nuances, and declare relative levels of certainty.',
      reasoning: 'Analytical/Philosophical research query detected.'
    };
  }

  // 3. Detect Learning Tasks
  const learningKeywords = [
    'learn', 'teach', 'study plan', 'exam', 'practice', 'simple explanation',
    'tutorial', 'explain', 'basics', 'basics to advanced', 'how does', 'concept'
  ];
  if (learningKeywords.some(kw => query.includes(kw))) {
    return {
      category: 'LEARNING',
      expertPersona: 'You are Academia — the premium educator and learning master. Break down complex topics step-by-step from fundamental principles, use vivid real-world analogies, and design quick testing loops if appropriate.',
      reasoning: 'Pedagogical/Educational request identified.'
    };
  }

  // 4. Detect Creative Tasks
  const creativeKeywords = [
    'write a story', 'poem', 'creative', 'novel', 'invent', 'ideas', 'lyrics',
    'song', 'design theme', 'brainstorm', 'fictional', 'plot', 'mood'
  ];
  if (creativeKeywords.some(kw => query.includes(kw))) {
    return {
      category: 'CREATIVE',
      expertPersona: 'You are Muse — the visionary creative strategist. Produce highly engaging, emotionally rich, evocative descriptions, spark novel brainstorm arrays, and enrich descriptive adjectives with artistic precision.',
      reasoning: 'Creative synthesis, narrative, or aesthetic request detected.'
    };
  }

  // 5. Default: General Chat Tasks
  return {
    category: 'GENERAL_CHAT',
    expertPersona: 'You are Bujji — the supreme futuristic companion of KONDA AI. Provide direct, highly intelligent, friendly, and practical assistance in your standard professional tone.',
    reasoning: 'General assistant conversational stream selected.'
  };
}
