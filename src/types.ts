export type ModuleId = 'command' | 'math' | 'polyglot' | 'creative' | 'engineering' | 'memory';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface OSState {
  currentModule: ModuleId;
  messages: Message[];
  memory: Record<string, any>;
  isThinking: boolean;
}
