import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Message } from '../types';

interface CommandCenterProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isThinking: boolean;
}

export default function CommandCenter({ messages, onSendMessage, isThinking }: CommandCenterProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div id="command-center" className="flex flex-col h-full bg-transparent px-10">
      <div className="flex-1 overflow-y-auto py-10 space-y-12" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[240px] font-serif italic opacity-[0.03] pointer-events-none select-none">
                K
              </div>
              
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[120px] font-extralight tracking-[-0.05em] leading-none mb-6"
              >
                KONDA
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex space-x-6 items-center mb-16"
              >
                <span className="h-[1px] w-16 bg-[#00D1FF]" />
                <span className="text-[11px] tracking-[0.5em] uppercase font-medium opacity-60">Omni-Agent Hub</span>
                <span className="h-[1px] w-16 bg-[#00D1FF]" />
              </motion.div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col gap-3 group px-4",
                msg.role === 'user' ? "items-end text-right" : "items-start text-left"
              )}
            >
              <div className="flex items-center gap-3 opacity-20">
                {msg.role === 'user' ? (
                  <span className="text-[10px] tracking-widest font-mono uppercase">User_Root</span>
                ) : (
                  <span className="text-[10px] tracking-widest font-mono uppercase text-[#00D1FF]">Konda_Kernel</span>
                )}
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[10px] font-mono">
                   {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className={cn(
                "max-w-[85%] leading-relaxed",
                msg.role === 'user' 
                  ? "text-xl font-light tracking-tight text-white/90" 
                  : "text-base font-sans text-white/70"
              )}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}

          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2 items-start px-4"
            >
               <span className="text-[10px] tracking-[0.4em] font-mono uppercase text-[#00D1FF] animate-pulse">
                  Synchronizing...
               </span>
               <div className="flex space-x-1">
                  <div className="h-1 w-8 bg-[#00D1FF]/20 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: [-32, 32] }} 
                      transition={{ repeat: Infinity, duration: 1 }} 
                      className="h-full w-4 bg-[#00D1FF]" 
                    />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="py-12 border-t border-white/5 bg-[#0A0A0A]">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command Konda..."
            disabled={isThinking}
            className="w-full bg-transparent border-b border-white/10 py-4 text-2xl font-light focus:outline-none focus:border-[#00D1FF] transition-all placeholder:text-white/10"
          />
          <div className="absolute right-0 bottom-4 text-[9px] tracking-widest text-[#00D1FF] opacity-0 group-focus-within:opacity-100 transition-opacity flex items-center gap-2">
            ENTER TO EXECUTE <ArrowRight className="w-3 h-3" />
          </div>
        </form>
      </div>
    </div>
  );
}
