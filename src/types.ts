export type ModuleId = 'command' | 'math' | 'language' | 'creative' | 'engineering' | 'memory' | 'casual' | 'academia' | 'health';

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  base64?: string;
  textContent?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  files?: FileAttachment[];
}

export interface Shortcut {
  id: string;
  label: string;
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
}

export interface SavedSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export interface ProficiencyScore {
  id: string;
  moduleId: ModuleId;
  subject: string;
  level: number; // 0 to 100
  lastInteraction: number;
  weakPoints: string[];
}

export type ThinkingStatus = 'idle' | 'thinking' | 'retrying_1' | 'retrying_2' | 'retrying_3' | 'retrying_4' | 'error';

export type AIModel = 'auto' | 'core' | 'sage' | 'vision' | 'swift' | 'forge' | 'canvas' | 'motion' | 'gpt55' | 'claude_opus4' | 'deepseek_coder' | 'flux_image';

export interface OSState {
  currentModule: ModuleId;
  messages: Message[];
  memory: Record<string, any>;
  thinkingStatus: ThinkingStatus;
  proficiency: ProficiencyScore[];
}
