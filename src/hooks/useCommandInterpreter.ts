import { useCallback, useState } from 'react';
import { ModuleId } from '../types';

export interface CommandDefinition {
  id: string;
  name: string;
  keywords: string[];
  action: (utils: {
    dispatchModule: (mod: ModuleId) => void;
    dispatchClear: () => void;
    dispatchArchive: () => void;
    dispatchBujjiToggle: () => void;
    dispatchToast: (msg: string) => void;
    setMood: (mood: string) => void;
  }) => void;
  feedback: string;
}

export const SYSTEM_COMMANDS: CommandDefinition[] = [
  {
    id: 'clear-session',
    name: 'Clear Session',
    keywords: ['clear session', 'clear chat', 'reset session', 'erase chats', 'clean workspace'],
    action: ({ dispatchClear, dispatchToast }) => {
      dispatchClear();
      dispatchToast('All current active session logs cleared.');
    },
    feedback: "Clearing session data right away, Chief!"
  },
  {
    id: 'archive-session',
    name: 'Archive Session',
    keywords: ['archive session', 'archive chat', 'save session', 'save logs'],
    action: ({ dispatchArchive, dispatchToast }) => {
      dispatchArchive();
      dispatchToast('Current chat session archived successfully.');
    },
    feedback: "Archiving current intelligence log into database, Boss."
  },
  {
    id: 'open-dashboard',
    name: 'Open Dashboard',
    keywords: ['open dashboard', 'go to dashboard', 'open command center', 'go to command center', 'dashboard mode'],
    action: ({ dispatchModule }) => {
      dispatchModule('command');
    },
    feedback: "Steering you to the Command Center dashboard, Boss."
  },
  {
    id: 'open-casual',
    name: 'Open Chat',
    keywords: ['open casual', 'go to casual', 'open chat', 'start chat', 'casual module'],
    action: ({ dispatchModule }) => {
      dispatchModule('casual');
    },
    feedback: "Casual dialogue systems are fully online now."
  },
  {
    id: 'open-math',
    name: 'Math Engine',
    keywords: ['open math', 'go to math', 'math engine', 'solve equation'],
    action: ({ dispatchModule }) => {
      dispatchModule('math');
    },
    feedback: "Accessing target mathematical compute core."
  },
  {
    id: 'open-language',
    name: 'Polyglot Translator',
    keywords: ['open language', 'go to language', 'open translator', 'polyglot engine'],
    action: ({ dispatchModule }) => {
      dispatchModule('language');
    },
    feedback: "Universal multi-lingual decoding stack initialized."
  },
  {
    id: 'open-creative',
    name: 'Creative Planner',
    keywords: ['open creative', 'go to creative', 'creative mode', 'brainstorming'],
    action: ({ dispatchModule }) => {
      dispatchModule('creative');
    },
    feedback: "Creative brainstorming deck loaded."
  },
  {
    id: 'open-engineering',
    name: 'Engineering Workspace',
    keywords: ['open engineering', 'go to engineering', 'coding copilot', 'developer workspace'],
    action: ({ dispatchModule }) => {
      dispatchModule('engineering');
    },
    feedback: "Compiler systems and full-stack editor initialized."
  },
  {
    id: 'open-memory',
    name: 'Memory Bank',
    keywords: ['open memory', 'go to memory', 'memory bank', 'show recalls'],
    action: ({ dispatchModule }) => {
      dispatchModule('memory');
    },
    feedback: "Pulling historic vector records from persistent store."
  },
  {
    id: 'toggle-bujji',
    name: 'Toggle Bujji Companion',
    keywords: ['toggle bujji', 'close bujji', 'hide companion', 'open companion'],
    action: ({ dispatchBujjiToggle }) => {
      dispatchBujjiToggle();
    },
    feedback: "Re-configuring holographic companion portal layout."
  },
  {
    id: 'mood-sarcastic',
    name: 'Mood: Sarcastic',
    keywords: ['sarcastic mood', 'be sarcastic', 'sarcastic mode'],
    action: ({ setMood }) => {
      setMood('sarcastic');
    },
    feedback: "Sarcastic engine engaged. Prepare yourself, Boss!"
  },
  {
    id: 'mood-loyal',
    name: 'Mood: Loyal',
    keywords: ['loyal mood', 'be loyal', 'loyal mode', 'warm mood'],
    action: ({ setMood }) => {
      setMood('loyal');
    },
    feedback: "Always watching your back, Chief. Loyalty protocols optimized."
  },
  {
    id: 'mood-analytical',
    name: 'Mood: Analytical',
    keywords: ['analytical mood', 'be analytical', 'analytical mode', 'coder mode'],
    action: ({ setMood }) => {
      setMood('analytical');
    },
    feedback: "Analytical precision core deployed. Systems logical."
  },
  {
    id: 'mood-chill',
    name: 'Mood: Chill',
    keywords: ['chill mood', 'be chill', 'relaxed mode', 'relaxed mood'],
    action: ({ setMood }) => {
      setMood('chill');
    },
    feedback: "Decompressing logic gates. Let's take it easy, Boss."
  },
  {
    id: 'mood-witty',
    name: 'Mood: Witty',
    keywords: ['witty mood', 'be witty', 'witty mode', 'original mood'],
    action: ({ setMood }) => {
      setMood('witty');
    },
    feedback: "Original witty banter core fired up and online!"
  }
];

export function useCommandInterpreter() {
  const [lastExecutedCommand, setLastExecutedCommand] = useState<string | null>(null);

  const interpretCommand = useCallback((
    transcript: string,
    callbacks?: {
      onClearChat?: () => void;
      onSwitchModule?: (mod: ModuleId) => void;
      onArchiveChat?: () => void;
      onToggleBujji?: () => void;
      onToast?: (msg: string) => void;
      onMoodChange?: (mood: string) => void;
    }
  ): { matched: boolean; feedback: string | null } => {
    const rawInput = transcript.toLowerCase().trim();
    
    // Find the command that has at least one matching keyword
    const match = SYSTEM_COMMANDS.find(cmd => 
      cmd.keywords.some(kw => rawInput.includes(kw))
    );

    if (match) {
      setLastExecutedCommand(match.name);
      
      const dispatchModule = (mod: ModuleId) => {
        if (callbacks?.onSwitchModule) {
          callbacks.onSwitchModule(mod);
        } else {
          window.dispatchEvent(new CustomEvent('module-change', { detail: mod }));
        }
      };

      const dispatchClear = () => {
        if (callbacks?.onClearChat) {
          callbacks.onClearChat();
        } else {
          window.dispatchEvent(new Event('chat-cleared'));
        }
      };

      const dispatchArchive = () => {
        if (callbacks?.onArchiveChat) {
          callbacks.onArchiveChat();
        } else {
          window.dispatchEvent(new Event('archive-session'));
        }
      };

      const dispatchBujjiToggle = () => {
        if (callbacks?.onToggleBujji) {
          callbacks.onToggleBujji();
        } else {
          window.dispatchEvent(new Event('toggle-bujji-visibility'));
        }
      };

      const dispatchToast = (msg: string) => {
        if (callbacks?.onToast) {
          callbacks.onToast(msg);
        } else {
          window.dispatchEvent(new CustomEvent('konda-toast', { detail: msg }));
        }
      };

      const setMood = (mood: string) => {
        localStorage.setItem('bujji_mood', mood);
        if (callbacks?.onMoodChange) {
          callbacks.onMoodChange(mood);
        }
        window.dispatchEvent(new CustomEvent('bujji-mood-changed', { detail: mood }));
      };

      // Execute command action
      match.action({
        dispatchModule,
        dispatchClear,
        dispatchArchive,
        dispatchBujjiToggle,
        dispatchToast,
        setMood
      });

      return { matched: true, feedback: match.feedback };
    }

    return { matched: false, feedback: null };
  }, []);

  return {
    interpretCommand,
    lastExecutedCommand,
    setLastExecutedCommand,
    commandsList: SYSTEM_COMMANDS
  };
}
