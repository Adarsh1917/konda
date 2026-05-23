import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Bot, User, Zap, MessageCircle, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { Message, ModuleId, ThinkingStatus, AIModel } from '../types';

interface KosmosModuleProps {
  onSendMessage: (val: string) => void;
  messages: Message[];
  isThinking: boolean;
  thinkingStatus: ThinkingStatus;
  onSwitchModule: (mod: ModuleId) => void;
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

const modelOptions = [
  { id: 'auto', label: 'Auto Mode', icon: '🧠', desc: 'Auto-route tasks' },
  { id: 'gpt55', label: 'GPT-5.5', icon: '⚡', desc: 'Universal reasoning & planning' },
  { id: 'claude_opus4', label: 'Claude Opus 4', icon: '🖋️', desc: 'Deep cognition & philosophy' },
  { id: 'gemini_pro', label: 'Gemini Pro', icon: '🔮', desc: 'Multimodal files & analysis' },
  { id: 'gemini_flash', label: 'Gemini Flash', icon: '🚀', desc: 'Speed & latency optimized' },
  { id: 'deepseek_coder', label: 'DeepSeek Coder', icon: '💻', desc: 'Elite programming & debugging' },
  { id: 'flux_image', label: 'Flux Image', icon: '🎨', desc: 'Visual synthesis & design' },
];

export default function KosmosModule({ onSendMessage, messages, isThinking, thinkingStatus, onSwitchModule, selectedModel, setSelectedModel }: KosmosModuleProps) {
  const [input, setInput] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isThinking) return;

    const val = input.trim().toLowerCase();
    
    // Intelligent routing detection
    const routingKeywords = {
      math: ['math', 'calc', 'integral', 'derivative', 'solve for', 'equation', 'matrix', 'tensor', 'probability', 'statistics'],
      engineering: ['code', 'engineer', 'system', 'build', 'optimization', 'architecture', 'dev', 'programming', 'software'],
      creative: ['art', 'draw', 'creative', 'design', 'palette', 'color', 'sketch', 'illustration', 'visual'],
      language: ['translate', 'language', 'french', 'chinese', 'spanish', 'linguistic', 'grammar', 'vocab'],
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
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF3E00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00]">
            Casual_Interface_v1
          </div>
          <h1 className="text-2xl font-light tracking-tighter text-[#F5F5F5]">
            Casual <span className="italic font-serif opacity-40">Intelligence</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="text-[8px] uppercase tracking-widest opacity-20">Orchestrated Node</div>
            <div className="text-[9px] text-[#FF3E00] font-mono whitespace-nowrap">
              {selectedModel === 'auto' ? 'AUTO-ROUTED' : selectedModel.toUpperCase().replace('_', ' ')}
            </div>
          </div>
          <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#FF3E00]" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center transform rotate-12 mb-4">
                <Bot className="w-10 h-10 text-white/20" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-xl font-light text-white/80">Greetings, User.</h2>
              <p className="text-sm text-white/40 leading-relaxed font-light">
                I am your Casual companion. I handle the quick, the curious, and the conversational. How shall we spend our clock cycles today?
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <motion.div 
              key={`${msg.id}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-3xl",
                msg.role === 'user' ? "ml-auto flex-row-reverse text-right" : "mr-auto text-left"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-1",
                msg.role === 'user' ? "border-white/10 bg-white/5" : "border-[#FF3E00]/20 bg-[#FF3E00]/5"
              )}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white/40" /> : <Bot className="w-3.5 h-3.5 text-[#FF3E00]" />}
              </div>
              <div className={cn(
                "p-5 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-white/[0.03] border border-white/5 text-white/80 rounded-tr-none" 
                  : "bg-white/[0.01] border border-white/5 text-white/60 rounded-tl-none font-serif italic"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))
        )}
        
        {isThinking && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-4 mr-auto animate-pulse">
              <div className={cn(
                "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
                thinkingStatus.startsWith('retrying') ? "border-yellow-500/20 bg-yellow-500/5" : "border-[#FF3E00]/20 bg-[#FF3E00]/5"
              )}>
                <Bot className={cn("w-3.5 h-3.5", thinkingStatus.startsWith('retrying') ? "text-yellow-500" : "text-[#FF3E00]")} />
              </div>
              <div className="flex gap-1 items-center px-4 py-2">
                <div className={cn("w-1 h-1 rounded-full animate-bounce", thinkingStatus.startsWith('retrying') ? "bg-yellow-500" : "bg-[#FF3E00]")} style={{ animationDelay: '0ms' }} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce", thinkingStatus.startsWith('retrying') ? "bg-yellow-500" : "bg-[#FF3E00]")} style={{ animationDelay: '200ms' }} />
                <div className={cn("w-1 h-1 rounded-full animate-bounce", thinkingStatus.startsWith('retrying') ? "bg-yellow-500" : "bg-[#FF3E00]")} style={{ animationDelay: '400ms' }} />
              </div>
            </div>
            {thinkingStatus.startsWith('retrying') && (
              <div className="ml-12 text-[10px] font-mono text-yellow-500/60 uppercase tracking-widest animate-pulse">
                {thinkingStatus === 'retrying_1' ? "Neural Load High: Retrying (Attempt 1)..." :
                 thinkingStatus === 'retrying_2' ? "Saturated Path: Switching to Primary Link (Attempt 2)..." :
                 thinkingStatus === 'retrying_3' ? "Congestion Detected: Buffering (Attempt 3)..." :
                 "Maximum Saturation: Final Attempt..."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-8 bg-black/40 border-t border-white/5 z-10">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto relative group flex items-center"
        >
          <div className="relative w-full">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isThinking}
              placeholder="Type your casual query..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-28 text-sm focus:outline-none focus:border-[#FF3E00]/30 transition-all placeholder:opacity-20 text-white"
            />
            
            {/* Model Selector Button and Dropdown wrapper */}
            <div ref={dropdownRef} className="absolute right-13 top-1/2 -translate-y-1/2 flex items-center">
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 text-base cursor-pointer",
                  selectedModel !== 'auto' ? "border border-[#FF3E00]/30 bg-[#FF3E00]/5" : ""
                )}
                title="Orchestrated AI Model"
              >
                🧠
              </button>

              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-3 w-72 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl p-2 z-[60] backdrop-blur-md"
                  >
                    <div className="px-3 py-2 border-b border-white/5 mb-1.5 flex justify-between items-center">
                      <span className="text-[9px] font-mono tracking-widest text-[#FF3E00] uppercase font-bold">Orchestration Core</span>
                      <span className="text-[8px] font-mono text-white/40 uppercase">Active: {selectedModel === 'auto' ? 'Auto-Route' : selectedModel.toUpperCase()}</span>
                    </div>
                    {modelOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(opt.id as any);
                          setShowModelDropdown(false);
                        }}
                        className={cn(
                          "w-full flex items-start gap-3 p-2.5 hover:bg-white/5 transition-all text-left rounded-lg group",
                          selectedModel === opt.id ? "bg-white/[0.03] border border-white/5" : "border border-transparent"
                        )}
                      >
                        <span className="text-base select-none shrink-0">{opt.icon}</span>
                        <div className="flex flex-col min-w-0">
                          <span className={cn(
                            "text-xs font-mono tracking-wide transition-colors",
                            selectedModel === opt.id ? "text-[#FF3E00] font-bold" : "text-white/80 group-hover:text-white"
                          )}>
                            {opt.label}
                          </span>
                          <span className="text-[9px] text-white/40 line-clamp-1">{opt.desc}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              type="submit"
              disabled={!input.trim() || isThinking}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#FF3E00] text-black rounded-lg flex items-center justify-center hover:bg-[#FF3E00]/80 transition-all disabled:opacity-20 disabled:grayscale"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        <div className="mt-4 flex justify-center gap-6">
           <QuickAction icon={Zap} label="Math" onClick={() => onSwitchModule('math')} />
           <QuickAction icon={MessageCircle} label="Language" onClick={() => onSwitchModule('language')} />
           <QuickAction icon={Sparkles} label="Creative" onClick={() => onSwitchModule('creative')} />
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
