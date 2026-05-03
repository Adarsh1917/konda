import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CommandCenter from './components/CommandCenter';
import MathModule from './components/MathModule';
import CreativeModule from './components/CreativeModule';
import { ModuleId, OSState, Message } from './types';
import { kondaChat } from './services/kondaService';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Power, Menu, X, Terminal } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<OSState>({
    currentModule: 'command',
    messages: [],
    memory: {},
    isThinking: false
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleModuleChange = (module: ModuleId) => {
    setState(s => ({ ...s, currentModule: module }));
    setIsSidebarOpen(false);
  };

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setState(s => ({
      ...s,
      messages: [...s.messages, userMessage],
      isThinking: true
    }));

    const chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [...state.messages, userMessage].map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await kondaChat(chatHistory);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    };

    setState(s => ({
      ...s,
      messages: [...s.messages, assistantMessage],
      isThinking: false
    }));
  }, [state.messages]);

  return (
    <div id="os-root" className="fixed inset-0 bg-[#0A0A0A] flex overflow-hidden font-sans antialiased text-[#F5F5F5] selection:bg-[#00D1FF] selection:text-black">
      
      {/* Background Decorative Element */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] border border-white/5 rounded-full pointer-events-none z-0" />
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] border border-[#00D1FF]/10 rounded-full pointer-events-none z-0" />

      {/* Sidebar - Persistent on desktop, Toggle on mobile */}
      <AnimatePresence>
        {(isSidebarOpen || !isMobile) && (
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0"
          >
            <Sidebar 
              currentModule={state.currentModule} 
              onModuleChange={handleModuleChange} 
            />
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
        <header className="h-20 md:h-24 flex items-center md:items-start justify-between px-6 md:px-10 pt-0 md:pt-8 bg-transparent shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-[#00D1FF]"
            >
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="flex flex-col">
              <div className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#00D1FF] mb-0.5 md:mb-1">
                Active Module
              </div>
              <div className="text-lg md:text-2xl font-light tracking-tighter uppercase flex items-center gap-2">
                {state.currentModule} 
                <span className="hidden sm:inline-block opacity-20 font-serif italic font-normal normal-case ml-2 text-base md:text-lg">Sequence 01</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-12 items-baseline">
            <div className="text-right hidden md:block">
              <div className="text-[9px] tracking-[0.2em] uppercase opacity-40 mb-1">Temporal Registry</div>
              <div className="text-xs font-mono">{new Date().toLocaleTimeString('en-US', { hour12: false })} GMT</div>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-[9px] tracking-[0.2em] uppercase opacity-40 mb-1">Kernel Integrity</div>
              <div className="text-xs font-mono text-[#00D1FF]">98.4%</div>
            </div>
            <div className="w-10 h-10 border border-[#333] rounded-full flex items-center justify-center text-[10px] hover:border-[#00D1FF] cursor-pointer transition-colors hover:text-[#00D1FF] group">
              <Power className="w-3 h-3 group-hover:scale-110 transition-transform" />
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
                isThinking={state.isThinking}
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
            <span className="cursor-pointer hover:text-[#00D1FF]">MANIFESTO</span>
            <span className="cursor-pointer hover:text-[#00D1FF]">DOCUMENTATION</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ModuleSelector({ moduleId, messages, onSendMessage, isThinking }: { 
  moduleId: ModuleId, 
  messages: Message[],
  onSendMessage: (val: string) => void,
  isThinking: boolean
}) {
  switch (moduleId) {
    case 'command':
      return <CommandCenter messages={messages} onSendMessage={onSendMessage} isThinking={isThinking} />;
    case 'math':
      return <MathModule />;
    case 'polyglot':
      return <PlaceholderModule title="Polyglot Engine" description="Real-time multi-dimensional translation interface." />;
    case 'creative':
      return <CreativeModule />;
    case 'engineering':
      return <PlaceholderModule title="Engineering Core" description="High-performance code generation and architectural review." />;
    case 'memory':
      return <PlaceholderModule title="Neural Memory" description="Long-term context retention and relationship mapping." />;
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
