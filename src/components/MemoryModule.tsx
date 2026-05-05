import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Trash2, Search, Calendar, MessageSquare, Clock, ArrowRight, Save, History, HardDrive, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { Message, ProficiencyScore } from '../types';

interface SavedSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
  type: 'active' | 'archived' | 'backup';
}

export default function MemoryModule({ proficiency }: { proficiency: ProficiencyScore[] }) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [capacity, setCapacity] = useState(0.24);
  const [maxCapacity, setMaxCapacity] = useState(2.0);
  const [isExpanding, setIsExpanding] = useState(false);

  const trendData = proficiency.map(p => ({
    name: p.subject,
    level: p.level
  })).sort((a, b) => b.level - a.level);

  const expandMemory = () => {
    setIsExpanding(true);
    setTimeout(() => {
      setMaxCapacity(prev => prev + 1.0);
      setIsExpanding(false);
    }, 1500);
  };

  useEffect(() => {
    const loadMemory = () => {
      let combinedSessions: SavedSession[] = [];
      
      // 1. Load active session
      const activeSaved = localStorage.getItem('konda_chats');
      if (activeSaved) {
        try {
          const parsed = JSON.parse(activeSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            combinedSessions.push({
              id: 'current-session',
              title: 'Neural Assistant Session (Active)',
              lastMessage: parsed[parsed.length - 1].content,
              timestamp: parsed[parsed.length - 1].timestamp || Date.now(),
              messageCount: parsed.length,
              type: 'active'
            });
          }
        } catch (e) {
          console.error("Memory Recall Error - Active");
        }
      }

      // 2. Load archived sessions (Some marked as backup if they have 'backup' in title for demo/indicator purpose)
      const archivedSaved = localStorage.getItem('konda_history');
      if (archivedSaved) {
        try {
          const parsed = JSON.parse(archivedSaved);
          if (Array.isArray(parsed)) {
            const archives = parsed.map((s: any) => ({
              id: s.id,
              title: s.title,
              lastMessage: s.messages[s.messages.length - 1]?.content || 'Empty Archive',
              timestamp: s.timestamp,
              messageCount: s.messages.length,
              type: (s.title.toLowerCase().includes('backup') ? 'backup' : 'archived') as 'archived' | 'backup'
            }));
            combinedSessions = [...combinedSessions, ...archives];
          }
        } catch (e) {
          console.error("Memory Recall Error - Archive");
        }
      }

      setSessions(combinedSessions);
    };

    loadMemory();
    window.addEventListener('memory-updated', loadMemory);
    window.addEventListener('chat-cleared', loadMemory);
    return () => {
      window.removeEventListener('memory-updated', loadMemory);
      window.removeEventListener('chat-cleared', loadMemory);
    };
  }, []);

  const deleteSession = (id: string) => {
    if (id === 'current-session') {
      localStorage.removeItem('konda_chats');
      window.dispatchEvent(new Event('chat-cleared'));
    } else {
      const archivedSaved = localStorage.getItem('konda_history');
      if (archivedSaved) {
        try {
          const parsed = JSON.parse(archivedSaved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((s: any) => s.id !== id);
            localStorage.setItem('konda_history', JSON.stringify(filtered));
            window.dispatchEvent(new Event('memory-updated'));
          }
        } catch (e) {}
      }
    }
  };

  const restoreSession = (session: any) => {
    // If it's the current session, do nothing special
    if (session.id === 'current-session') {
      window.dispatchEvent(new CustomEvent('module-change', { detail: 'command' }));
      return;
    }

    // Load from archived
    const archivedSaved = localStorage.getItem('konda_history');
    if (archivedSaved) {
      const parsed = JSON.parse(archivedSaved);
      const fullSession = parsed.find((s: any) => s.id === session.id);
      if (fullSession) {
        window.dispatchEvent(new CustomEvent('session-restored', { detail: fullSession.messages }));
        window.dispatchEvent(new CustomEvent('module-change', { detail: 'command' }));
      }
    }
  };

  const purgeAll = () => {
    localStorage.removeItem('konda_chats');
    localStorage.removeItem('konda_history');
    window.dispatchEvent(new Event('chat-cleared'));
    window.dispatchEvent(new Event('memory-updated'));
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-transparent p-6 sm:p-10 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-12 gap-6">
        <div className="space-y-1">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00]">Neural Collective</div>
          <h2 className="text-4xl font-serif italic tracking-tighter text-[#F5F5F5]">Neural_Bank_V2</h2>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-2 border border-white/5 bg-white/[0.02] text-white/40 rounded-sm text-[10px] tracking-widest font-mono hover:text-[#FF3E00] hover:border-[#FF3E00]/40 transition-all uppercase flex items-center justify-center gap-2" onClick={purgeAll}>
            <Trash2 className="w-3 h-3" />
            Purge_All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Memory Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="p-8 border border-white/5 bg-[#050505] rounded-xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF3E00]/5 rounded-full blur-3xl" />
             <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-[#FF3E00]/10 rounded-lg">
                 <HardDrive className="w-6 h-6 text-[#FF3E00]" />
               </div>
               <div>
                 <h3 className="text-lg font-medium">Memory Allocation</h3>
                 <p className="text-[10px] text-white/30 uppercase tracking-widest">Neural Link Synchronized</p>
               </div>
             </div>
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between text-[10px] uppercase tracking-widest mb-2 font-mono">
                     <span className="text-white/40">Used Space</span>
                     <span className={cn("transition-colors", isExpanding ? "text-yellow-500" : "text-[#FF3E00]")}>
                       {capacity.toFixed(2)} / {maxCapacity.toFixed(2)} MB
                     </span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(capacity / maxCapacity) * 100}%` }} 
                        className={cn("h-full transition-colors", isExpanding ? "bg-yellow-500" : "bg-[#FF3E00]")} 
                     />
                   </div>
                </div>
                <button 
                  onClick={expandMemory}
                  disabled={isExpanding}
                  className="w-full py-3 border border-[#FF3E00]/20 hover:border-[#FF3E00] bg-[#FF3E00]/5 text-[#FF3E00] text-[10px] font-mono uppercase tracking-[0.2em] rounded transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isExpanding ? "Expanding_Logic_Pipes..." : "Evolve_Cortex_Capacity"}
                </button>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 border border-white/5 bg-white/[0.02] rounded">
                      <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Knowledge_Nodes</div>
                      <div className="text-xl font-mono">{sessions.length}</div>
                   </div>
                   <div className="p-4 border border-white/5 bg-white/[0.02] rounded">
                      <div className="text-[8px] uppercase tracking-widest text-white/20 mb-1">Synaptic_Points</div>
                      <div className="text-xl font-mono">{sessions.reduce((acc, s) => acc + s.messageCount, 0)}</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-8 border border-white/5 bg-[#050505] rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-[#FF3E00]" />
                  <h3 className="text-sm font-medium uppercase tracking-widest text-white/60">Competency_Trend</h3>
                </div>
              </div>
              <div className="h-40 w-full font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF3E00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF3E00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '4px', fontSize: '9px' }}
                      itemStyle={{ color: '#FF3E00' }}
                    />
                    <Area type="monotone" dataKey="level" stroke="#FF3E00" fillOpacity={1} fill="url(#trendGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] text-center">
                Adaptive Synapse mapping active
              </div>
          </div>
          <div className="space-y-4">
             <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] px-2">Proficiency Mapping</h3>
             {proficiency.map(p => (
               <DomainItem 
                 key={p.id}
                 label={p.subject} 
                 count={Math.round(p.level)} 
                 color={p.level < 40 ? "#FF3E00" : p.level < 70 ? "#FFA500" : "#4ade80"} 
                 progress={p.level} 
               />
             ))}
          </div>
        </div>

        {/* Search & History */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#FF3E00] transition-colors" />
            <input 
              type="text"
              placeholder="Search neural history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#050505] border border-white/5 rounded-lg py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-[#FF3E00]/50 transition-all font-light"
            />
          </div>

          <div className="flex-1 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 border border-white/5 bg-[#050505] hover:bg-white/[0.02] rounded-lg group transition-all"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 flex gap-6">
                          <div className={cn(
                            "w-12 h-12 border rounded flex items-center justify-center shrink-0 transition-colors",
                            session.type === 'active' ? "bg-[#FF3E00]/10 border-[#FF3E00]/30" : 
                            session.type === 'backup' ? "bg-yellow-500/10 border-yellow-500/30" :
                            "bg-white/5 border-white/10"
                          )}>
                            <MessageSquare className={cn(
                              "w-5 h-5 transition-colors",
                              session.type === 'active' ? "text-[#FF3E00]" : 
                              session.type === 'backup' ? "text-yellow-500" :
                              "text-white/20 group-hover:text-[#FF3E00]"
                            )} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-base font-medium">{session.title}</h4>
                              <span className={cn(
                                "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-widest",
                                session.type === 'active' ? "text-[#FF3E00] border-[#FF3E00]/40 bg-[#FF3E00]/5" :
                                session.type === 'backup' ? "text-yellow-500 border-yellow-500/40 bg-yellow-500/5" :
                                "text-white/20 border-white/10"
                              )}>
                                {session.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                               <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(session.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                               <span className="flex items-center gap-1.5"><History className="w-3 h-3" /> {session.messageCount} Segments</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                            onClick={(e) => toggleExpand(session.id, e)}
                            className="p-2 border border-white/10 rounded hover:border-white/30 text-white/20 hover:text-white transition-all"
                           >
                             <Search className={cn("w-4 h-4 transition-transform", expandedSessions.has(session.id) && "rotate-180")} />
                           </button>
                           <button 
                            onClick={() => restoreSession(session)}
                            className="p-2 border border-white/10 rounded hover:border-[#FF3E00] hover:text-[#FF3E00] transition-all opacity-0 group-hover:opacity-100"
                           >
                             <ArrowRight className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => deleteSession(session.id)}
                            className="p-2 border border-white/10 rounded hover:border-red-500/50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedSessions.has(session.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-20 pr-4 py-4 border-t border-white/5 mt-2">
                               <p className="text-sm text-white/50 leading-relaxed italic font-serif">
                                 "{session.lastMessage}"
                               </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-lg text-white/10 uppercase tracking-widest text-[10px] font-mono">
                  No_Recall_Matches_Found
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-8 border border-white/5 bg-white/[0.01] rounded-lg mt-auto">
             <div className="flex items-center gap-6">
                <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center">
                  <Save className="w-4 h-4 text-white/20" />
                </div>
                <div>
                   <h5 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#FF3E00] mb-1">Backup_Enabled</h5>
                   <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-tighter">Automatic session snapshotting is currently active within local context.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainItem({ label, count, color, progress }: any) {
  return (
    <div className="p-4 border border-white/5 bg-[#050505] rounded-lg space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">{label}</span>
        <span className="text-[10px] font-mono" style={{ color }}>{count}</span>
      </div>
      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
