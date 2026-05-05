import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Bot, User, Zap, MessageCircle, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message, ModuleId, ThinkingStatus } from '../types';

interface KosmosModuleProps {
  onSendMessage: (val: string) => void;
  messages: Message[];
  isThinking: boolean;
  thinkingStatus: ThinkingStatus;
  onSwitchModule: (mod: ModuleId) => void;
}

export default function KosmosModule({ onSendMessage, messages, isThinking, thinkingStatus, onSwitchModule }: KosmosModuleProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isThinking) return;

    const val = input.trim().toLowerCase();
    
    // Intelligent routing detection
    const routingKeywords = {
      math: ['math', 'calc', 'integral', 'derivative', 'solve for', 'equation', 'matrix', 'tensor', 'probability', 'statistics'],
      engineering: ['code', 'engineer', 'system', 'build', 'optimization', 'architecture', 'dev', 'programming', 'software'],
      creative: ['art', 'draw', 'creative', 'design', 'palette', 'color', 'sketch', 'illustration', 'visual'],
      polyglot: ['translate', 'language', 'french', 'chinese', 'spanish', 'linguistic', 'grammar', 'vocab'],
      memory: ['history', 'save', 'archive', 'backup', 'session', 'recall', 'data bank']
    };

    for (const [mod, keywords] of Object.entries(routingKeywords)) {
      if (keywords.some(kw => val.includes(kw))) {
        onSwitchModule(mod as ModuleId);
        break;
      }
    }

    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-[#212121] relative overflow-hidden text-[#ececec]">
      {/* Decorative Background - subtle for ChatGPT feel */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#212121]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3d3d3d] rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#ececec]" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight">Kosmos Core</h1>
            <div className="text-[10px] text-white/40">Casual Intelligence v1.2</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
           <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Uplink Stable</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar relative z-10"
      >
        <div className="max-w-2xl mx-auto py-12 px-6 space-y-10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-white/20" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
              <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
                I'm your casual companion for quick queries, translations, or just a bit of light conversation.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === 'user' ? "bg-white/10 text-white" : "bg-[#3d3d3d] text-[#ececec]"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "max-w-[85%] px-4 py-2 rounded-2xl text-[15px] leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-[#2f2f2f] text-white" 
                    : "bg-transparent text-[#d1d1d1]"
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
          
          {isThinking && (
            <div className="flex gap-4 flex-row animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#3d3d3d] flex items-center justify-center shrink-0 mt-0.5">
                 <Bot className="w-4 h-4 text-[#ececec]" />
              </div>
              <div className="flex gap-1.5 items-center px-4 py-2">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="pb-6 pt-1 px-6 z-10">
        <div className="max-w-2xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="relative group bg-[#2f2f2f] rounded-3xl border border-white/5 focus-within:border-white/10 transition-all shadow-xl"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isThinking}
              placeholder="Message Kosmos..."
              className="w-full bg-transparent py-2.5 pl-6 pr-14 text-[15px] focus:outline-none placeholder:text-white/20"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isThinking}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/90 transition-all disabled:opacity-20 flex-shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-4 flex justify-center gap-6 overflow-x-auto no-scrollbar py-1">
             <QuickAction icon={Zap} label="Equation" onClick={() => onSwitchModule('math')} />
             <QuickAction icon={MessageCircle} label="Translate" onClick={() => onSwitchModule('polyglot')} />
             <QuickAction icon={Sparkles} label="Design" onClick={() => onSwitchModule('creative')} />
          </div>
          
          <p className="mt-4 text-[10px] text-center text-white/20 uppercase tracking-widest font-mono">
            Kosmos can handle casual talk or route you to specialized intel reactors
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/20 hover:text-[#FF3E00] transition-colors"
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}
