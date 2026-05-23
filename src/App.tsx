import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import KosmosModule from './components/KosmosModule';
import CommandCenter from './components/CommandCenter';
import MathModule from './components/MathModule';
import CreativeModule from './components/CreativeModule';
import PolyglotModule from './components/PolyglotModule';
import EngineeringModule from './components/EngineeringModule';
import MemoryModule from './components/MemoryModule';
import ShortcutManager from './components/ShortcutManager';
import { useShortcuts } from './hooks/useShortcuts';
import { useAdaptiveLearning } from './hooks/useAdaptiveLearning';
import { ModuleId, OSState, Message, Shortcut, ProficiencyScore, ThinkingStatus, FileAttachment } from './types';
import { kondaChat } from './services/kondaService';
import { generateId, cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Power, Menu, X, Terminal, Share2, Check, Keyboard, Zap } from 'lucide-react';

export default function App() {
  const { proficiency, updateProficiency, getRecommendations } = useAdaptiveLearning();
  const [state, setState] = useState<OSState>(() => {
    return {
      currentModule: 'casual',
      messages: [],
      memory: {},
      thinkingStatus: 'idle',
      proficiency: []
    };
  });

  const isGeneratingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setState(s => ({ ...s, proficiency }));
  }, [proficiency]);

  useEffect(() => {
    const handleProgressReport = (e: any) => {
      const { moduleId, subject, delta, weakPoint } = e.detail;
      updateProficiency(moduleId, subject, delta, weakPoint);
    };

    window.addEventListener('konda-progress', handleProgressReport);
    return () => window.removeEventListener('konda-progress', handleProgressReport);
  }, [updateProficiency]);

  useEffect(() => {
    // On mount, check if there's an existing session to archive
    const existing = localStorage.getItem('konda_chats');
    if (existing) {
      try {
        const messages = JSON.parse(existing);
        if (Array.isArray(messages) && messages.length > 0) {
          // Auto-archive the previous session
          const archivedSaved = localStorage.getItem('konda_history');
          const history = archivedSaved ? JSON.parse(archivedSaved) : [];
          const newArchive = {
            id: generateId(),
            title: `Auto-Archived Session ${new Date().toLocaleString()}`,
            messages: messages,
            timestamp: Date.now()
          };
          localStorage.setItem('konda_history', JSON.stringify([newArchive, ...history]));
          localStorage.removeItem('konda_chats');
          window.dispatchEvent(new Event('memory-updated'));
        }
      } catch (e) {
        console.error("Failed to auto-archive previous session");
      }
    }
  }, []);

  useEffect(() => {
    if (state.messages.length > 0) {
      localStorage.setItem('konda_chats', JSON.stringify(state.messages));
    } else {
      localStorage.removeItem('konda_chats');
    }
  }, [state.messages]);

  useEffect(() => {
    const handleGlobalClear = () => {
      setState(s => ({ ...s, messages: [] }));
    };

    const handleSessionRestore = (e: any) => {
      setState(s => ({ ...s, messages: e.detail }));
    };

    const handleModuleChange = (e: any) => {
      setState(s => ({ ...s, currentModule: e.detail as ModuleId }));
    };

    window.addEventListener('chat-cleared', handleGlobalClear);
    window.addEventListener('session-restored', handleSessionRestore);
    window.addEventListener('module-change', handleModuleChange);

    return () => {
      window.removeEventListener('chat-cleared', handleGlobalClear);
      window.removeEventListener('session-restored', handleSessionRestore);
      window.removeEventListener('module-change', handleModuleChange);
    };
  }, []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isShortcutManagerOpen, setIsShortcutManagerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleModuleChange = useCallback((module: ModuleId) => {
    setState(s => ({ ...s, currentModule: module }));
    setIsSidebarOpen(false);
  }, []);

  const handleArchiveChat = useCallback(() => {
    if (state.messages.length === 0) return;
    
    try {
      const archivedSaved = localStorage.getItem('konda_history');
      const history = archivedSaved ? JSON.parse(archivedSaved) : [];
      const newArchive = {
        id: generateId(),
        title: `Manual Session Archive ${new Date().toLocaleString()}`,
        messages: state.messages,
        timestamp: Date.now()
      };
      localStorage.setItem('konda_history', JSON.stringify([newArchive, ...history]));
      setState(s => ({ ...s, messages: [] }));
      window.dispatchEvent(new Event('memory-updated'));
    } catch (e) {
      console.error("Failed to archive session");
    }
  }, [state.messages]);

  const handleClearChat = useCallback(() => {
    setState(s => ({ ...s, messages: [] }));
  }, []);

  const shortcuts: Shortcut[] = useMemo(() => [
    {
      id: 'clear-chat',
      label: 'Clear Assistant Session',
      key: 'k',
      ctrlKey: true,
      action: handleClearChat
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Navigation Sidebar',
      key: 'b',
      ctrlKey: true,
      action: () => setIsSidebarOpen(s => !s)
    },
    {
      id: 'switch-casual',
      label: 'Switch to Casual Module',
      key: '0',
      altKey: true,
      action: () => handleModuleChange('casual')
    },
    {
      id: 'switch-command',
      label: 'Switch to Command Center',
      key: '1',
      altKey: true,
      action: () => handleModuleChange('command')
    },
    {
      id: 'switch-math',
      label: 'Switch to Math Engine',
      key: '2',
      altKey: true,
      action: () => handleModuleChange('math')
    },
    {
      id: 'switch-language',
      label: 'Switch to Language Module',
      key: '3',
      altKey: true,
      action: () => handleModuleChange('language')
    },
    {
      id: 'show-shortcuts',
      label: 'Show Shortcut Manager',
      key: '/',
      shiftKey: true,
      action: () => setIsShortcutManagerOpen(true)
    }
  ], [handleClearChat]);

  // Global Keyboard listener
  useShortcuts(shortcuts);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Konda Personal OS',
          text: 'Access the Konda Kernel interface.',
          url: url
        });
      } catch (err) {
        console.log('Share canceled or failed');
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const handleSendMessage = useCallback(async (content: string, files?: FileAttachment[]) => {
    const trimmed = content.trim().toLowerCase();
    
    // Intercept clear commands
    if (['clear', 'cls', 'reset', 'exit'].includes(trimmed)) {
      handleClearChat();
      return;
    }

    // 1. Prevent multiple active streaming sessions & handle abort
    if (isGeneratingRef.current) {
      abortControllerRef.current?.abort();
      isGeneratingRef.current = false;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isGeneratingRef.current = true;

    const userMsgId = generateId();
    const assistantMsgId = generateId();

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: Date.now(),
      files
    };

    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: "",
      timestamp: Date.now() + 1
    };

    // Inject both user and assistant placeholder messages in a single atomic update.
    // This clears any previous response state directly before starting generation.
    setState(s => ({
      ...s,
      messages: [...s.messages, userMessage, assistantMessage],
      thinkingStatus: 'thinking'
    }));

    // Build the clean, duplicate-free history mapping.
    // Filter out messages with empty content or thinking indicators to keep the context window perfectly optimized.
    const validHistory = state.messages.filter(m => {
      if (m.role === 'assistant' && !m.content.trim()) return false;
      return true;
    });

    const chatHistory = [...validHistory, userMessage].map(m => {
      const parts: any[] = [];
      
      // Add files if present
      if (m.files && m.files.length > 0) {
        for (const file of m.files) {
          if (file.textContent) {
            parts.push({
              text: `=== ATTACHMENT: ${file.name} ===\n${file.textContent}\n=== END OF ATTACHMENT ===`
            });
          } else if (file.base64) {
            parts.push({
              inlineData: {
                mimeType: file.type,
                data: file.base64
              }
            });
          }
        }
      }
      
      // Always add the text part
      parts.push({ text: m.content });

      return {
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts
      };
    });

    const mode = state.currentModule === 'casual' ? 'casual' : 'intel';
    let fullText = "";

    try {
      const response = await kondaChat(
        chatHistory,
        (status) => {
          if (controller.signal.aborted) return;
          setState(s => ({ ...s, thinkingStatus: status }));
        },
        mode,
        (chunk) => {
          if (controller.signal.aborted) return;
          fullText += chunk;
          setState(s => {
            const updated = s.messages.map(m => {
              if (m.id === assistantMsgId) {
                return { ...m, content: fullText };
              }
              return m;
            });
            return { ...s, messages: updated };
          });
        }
      );

      if (controller.signal.aborted) return;

      // Ensure stable final output update and set target state to idle
      setState(s => {
        const updated = s.messages.map(m => {
          if (m.id === assistantMsgId) {
            return { ...m, content: response || fullText };
          }
          return m;
        });
        return {
          ...s,
          messages: updated,
          thinkingStatus: 'idle'
        };
      });
    } catch (err) {
      console.error("[STREAM_PIPELINE_ERROR]", err);
      if (controller.signal.aborted) return;

      setState(s => {
        const updated = s.messages.map(m => {
          if (m.id === assistantMsgId) {
            return { ...m, content: "Neural sync encountered an unexpected operational failure." };
          }
          return m;
        });
        return {
          ...s,
          messages: updated,
          thinkingStatus: 'idle'
        };
      });
    } finally {
      if (abortControllerRef.current === controller) {
        isGeneratingRef.current = false;
        abortControllerRef.current = null;
      }
    }
  }, [state.messages, state.currentModule, handleClearChat]);

  return (
    <div id="os-root" className="fixed inset-0 bg-[#0A0A0A] flex overflow-hidden font-sans antialiased text-[#F5F5F5] selection:bg-[#FF3E00] selection:text-white">
      
      {/* Background Decorative Element */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none z-0" />
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] border border-[#FF3E00]/10 rounded-full pointer-events-none z-0" />

      {/* Sidebar - Collapsible on both desktop and mobile */}
      <AnimatePresence initial={false}>
        {(isSidebarOpen || !isMobile) && (
          <motion.div
            initial={isMobile ? { x: -260 } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: isSidebarOpen ? 0 : -260 } : { width: isSidebarOpen ? 256 : 0, opacity: isSidebarOpen ? 1 : 0 }}
            exit={isMobile ? { x: -260 } : { width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "h-full z-50 shrink-0 overflow-hidden",
              isMobile ? "fixed inset-y-0 left-0 bg-[#050505] shadow-2xl w-64" : "relative bg-[#050505]"
            )}
          >
            <div className="w-64 h-full">
              <Sidebar 
                currentModule={state.currentModule} 
                onModuleChange={handleModuleChange} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Title Bar / Header */}
        <header className="h-14 md:h-16 flex items-center justify-between px-6 md:px-8 border-b border-white/[0.04] bg-black/10 backdrop-blur-md shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-white/40 hover:text-[#FF3E00] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="flex flex-col">
              <div className="text-[9px] tracking-[0.25em] uppercase font-bold text-[#FF3E00] leading-none mb-0.5">
                Active Protocol
              </div>
              <div className="text-sm md:text-base font-light tracking-tight uppercase flex items-center gap-1.5 leading-none">
                {state.currentModule} 
                <span className="hidden sm:inline-block opacity-20 font-serif italic font-normal normal-case ml-2 text-xs">Sequence_Omega</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-8 items-center">
            <div className="text-right hidden md:block">
              <div className="text-[8px] tracking-[0.15em] uppercase opacity-30 mb-0.5">Temporal Registry</div>
              <div className="text-[10px] font-mono text-white/50 leading-none">{currentTime.toLocaleTimeString('en-US', { hour12: false })} GMT</div>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-[8px] tracking-[0.15em] uppercase opacity-30 mb-0.5">Cortex Integrity</div>
              <div className="text-[10px] font-mono text-[#FF3E00]/80 leading-none">MAX_INTEL</div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsShortcutManagerOpen(true)}
                className="w-8 h-8 border border-[#333] rounded-full flex items-center justify-center text-[10px] hover:border-[#FF3E00] cursor-pointer transition-all hover:text-[#FF3E00] group relative"
                title="Shortcuts (Shift + ?)"
              >
                <Keyboard className="w-3 h-3 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={handleShare}
                className="w-8 h-8 border border-[#333] rounded-full flex items-center justify-center text-[10px] hover:border-[#FF3E00] cursor-pointer transition-all hover:text-[#FF3E00] group relative"
              >
                {showShareToast ? <Check className="w-3 h-3 text-[#FF3E00]" /> : <Share2 className="w-3 h-3 group-hover:scale-110 transition-transform" />}
                <AnimatePresence>
                  {showShareToast && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-10 right-0 whitespace-nowrap bg-[#FF3E00] text-white text-[8px] font-bold py-1 px-2 rounded-sm tracking-widest z-[70]"
                    >
                      LINK COPIED
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <div className="w-8 h-8 border border-[#333] rounded-full flex items-center justify-center text-[10px] hover:border-[#FF3E00] cursor-pointer transition-all hover:text-[#FF3E00] group">
                <Power className="w-3 h-3 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Module Layer */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentModule}
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.01, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <ModuleSelector 
                moduleId={state.currentModule} 
                messages={state.messages}
                onSendMessage={handleSendMessage}
                onClearChat={handleClearChat}
                onArchiveChat={handleArchiveChat}
                thinkingStatus={state.thinkingStatus}
                proficiency={state.proficiency}
                recommendations={getRecommendations()}
                onSwitchModule={handleModuleChange}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Footer Decoration */}
        <footer className="h-12 border-t border-[#1A1A1A] flex items-center justify-between px-10">
          <div className="text-[8px] uppercase tracking-[0.4em] opacity-20">
            KONDA_OS // SYNCHRONIZED_WITH_NEURAL_LINK_A7
          </div>
          <div className="flex gap-6 text-[8px] uppercase tracking-widest opacity-40">
            <span className="cursor-pointer hover:text-[#FF3E00]" onClick={() => setIsShortcutManagerOpen(true)}>SHORTCUTS</span>
            <span className="cursor-pointer hover:text-[#FF3E00]">MANIFESTO</span>
            <span className="cursor-pointer hover:text-[#FF3E00]">DOCUMENTATION</span>
          </div>
        </footer>

        <ShortcutManager 
          isOpen={isShortcutManagerOpen} 
          onClose={() => setIsShortcutManagerOpen(false)} 
          shortcuts={shortcuts}
        />
      </main>
    </div>
  );
}

function ModuleSelector({ moduleId, messages, onSendMessage, onClearChat, onArchiveChat, thinkingStatus, proficiency, recommendations, onSwitchModule }: { 
  moduleId: ModuleId, 
  messages: Message[],
  onSendMessage: (val: string, files?: FileAttachment[]) => void,
  onClearChat: () => void,
  onArchiveChat: () => void,
  thinkingStatus: ThinkingStatus,
  proficiency: ProficiencyScore[],
  recommendations: ProficiencyScore[],
  onSwitchModule: (id: ModuleId) => void
}) {
  const isThinking = thinkingStatus !== 'idle';
  switch (moduleId) {
    case 'casual':
      return <KosmosModule messages={messages} onSendMessage={onSendMessage} isThinking={isThinking} thinkingStatus={thinkingStatus} onSwitchModule={onSwitchModule} />;
    case 'command':
      return <CommandCenter messages={messages} onSendMessage={onSendMessage} onClearChat={onClearChat} onArchiveChat={onArchiveChat} isThinking={isThinking} thinkingStatus={thinkingStatus} recommendations={recommendations} />;
    case 'math':
      return <MathModule />;
    case 'language':
      return <PolyglotModule />;
    case 'creative':
      return <CreativeModule />;
    case 'engineering':
      return <EngineeringModule />;
    case 'memory':
      return <MemoryModule proficiency={proficiency} />;
    default:
      return null;
  }
}

function PlaceholderModule({ title, description }: { title: string, description: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 bg-[#050505]">
       <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Cpu className="text-white/20 w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-medium mb-3 tracking-tight">{title}</h2>
          <p className="text-sm text-white/40 leading-relaxed">{description}</p>
          <div className="mt-8 flex gap-2 justify-center">
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-white/30">System Lock</div>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-white/30">Admin Only</div>
          </div>
       </div>
    </div>
  )
}
