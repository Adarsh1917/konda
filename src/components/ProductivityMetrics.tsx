import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { 
  CheckSquare, Square, Plus, Trash2, Award, Zap, 
  TrendingUp, BarChart3, PieChartIcon, CheckCircle2, AlertCircle, Clock, Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  score: number;
  category: string;
  timestamp: number;
}

const MODULE_COLORS: Record<string, string> = {
  casual: '#A3A3A3',       // slate
  command: '#FF3E00',      // intense orange-red
  academia: '#3B82F6',     // blue
  math: '#10B981',         // emeraldグリーン
  language: '#8B5CF6',     // violet
  creative: '#EC4899',     // pink
  engineering: '#F59E0B',  // amber
  memory: '#06B6D4',       // cyan
  health: '#EF4444',       // red
};

// Seed dataset for module usage over time (chronological interaction ticks)
const INITIAL_MODULE_USAGE = [
  { day: 'Mon', casual: 42, command: 110, academia: 25, math: 15, language: 30, creative: 12, engineering: 85, memory: 40 },
  { day: 'Tue', casual: 35, command: 125, academia: 10, math: 45, language: 15, creative: 40, engineering: 110, memory: 35 },
  { day: 'Wed', casual: 60, command: 95,  academia: 85, math: 20, language: 45, creative: 55, engineering: 95, memory: 55 },
  { day: 'Thu', casual: 25, command: 140, academia: 40, math: 30, language: 20, creative: 22, engineering: 130, memory: 28 },
  { day: 'Fri', casual: 50, command: 165, academia: 55, math: 75, language: 80, creative: 15, engineering: 150, memory: 90 },
  { day: 'Sat', casual: 80, command: 70,  academia: 90, math: 10, language: 100, creative: 95, engineering: 45, memory: 120 },
  { day: 'Sun', casual: 95, command: 45,  academia: 30, math: 5,  language: 50, creative: 60, engineering: 20, memory: 65 },
];

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Verify Gemini 2.5 Dynamic Uplink Secure Core', completed: true, score: 30, category: 'command', timestamp: Date.now() - 4 * 86400000 },
  { id: '2', title: 'Implement multi-tier L1/L3 cache and persistence', completed: true, score: 50, category: 'engineering', timestamp: Date.now() - 3 * 86400000 },
  { id: '3', title: 'Define standard pedagogical academic map', completed: false, score: 20, category: 'academia', timestamp: Date.now() - 2 * 86400000 },
  { id: '4', title: 'Resolve mathematical Fourier transform leak in math module', completed: true, score: 40, category: 'math', timestamp: Date.now() - 1 * 86400000 },
  { id: '5', title: 'Build interactive Recharts Productivity Dashboard widget', completed: false, score: 35, category: 'engineering', timestamp: Date.now() },
];

export default function ProductivityMetrics() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('konda_productivity_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('engineering');
  const [newTaskScore, setNewTaskScore] = useState(25);

  const [historicalTimeline, setHistoricalTimeline] = useState(() => {
    // Return mock 7-day logs representing task creation and completion velocities
    return [
      { day: 'Mon', created: 3, completed: 2, efficiency: 66 },
      { day: 'Tue', created: 4, completed: 4, efficiency: 100 },
      { day: 'Wed', created: 5, completed: 3, efficiency: 60 },
      { day: 'Thu', created: 2, completed: 3, efficiency: 150 },
      { day: 'Fri', created: 6, completed: 5, efficiency: 83 },
      { day: 'Sat', created: 3, completed: 2, efficiency: 66 },
      { day: 'Sun', created: 1, completed: 2, efficiency: 200 },
    ];
  });

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('konda_productivity_tasks', JSON.stringify(newTasks));
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        
        // Log log events inside SRE console directly
        window.dispatchEvent(new CustomEvent('konda-progress', {
          detail: {
            moduleId: t.category,
            subject: t.title,
            delta: nextState ? t.score : -t.score,
            weakPoint: null
          }
        }));

        return { ...t, completed: nextState };
      }
      return t;
    });
    saveTasks(updated);

    // Dynamically adjust today's metric in the line chart to show real feedback!
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[new Date().getDay()];
    
    setHistoricalTimeline(prev => prev.map(pt => {
      if (pt.day === currentDayName) {
        const totalCreated = updated.filter(t => new Date(t.timestamp).getDay() === new Date().getDay()).length;
        const totalCompleted = updated.filter(t => t.completed && new Date(t.timestamp).getDay() === new Date().getDay()).length;
        return {
          ...pt,
          created: totalCreated + 1, // baseline + current
          completed: totalCompleted + pt.completed - (updated.find(t=>t.id===id)?.completed ? 0 : 1)
        };
      }
      return pt;
    }));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      score: newTaskScore,
      category: newTaskCategory,
      timestamp: Date.now()
    };

    const updated = [...tasks, newTask];
    saveTasks(updated);
    setNewTaskTitle('');

    // Trigger log entry to user console
    const event = new CustomEvent('bujji_notification', {
      detail: `Initialized task: "${newTask.title}" [category: ${newTask.category.toUpperCase()}]`
    });
    window.dispatchEvent(event);

    // Update historical chart instantly
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[new Date().getDay()];
    setHistoricalTimeline(prev => prev.map(pt => {
      if (pt.day === currentDayName) {
        return { ...pt, created: pt.created + 1 };
      }
      return pt;
    }));
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = tasks.find(t => t.id === id);
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);

    if (target && target.completed) {
      // deduct points from adaptive learning if completed task is deleted to balance score
      window.dispatchEvent(new CustomEvent('konda-progress', {
        detail: {
          moduleId: target.category,
          subject: target.title,
          delta: -target.score,
          weakPoint: null
        }
      }));
    }
  };

  // Derive state metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalPoints = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.score, 0);
    const pendingPoints = tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.score, 0);

    // Group tasks completed by category
    const categoryCounts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.completed) {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      }
    });

    const pieData = Object.entries(categoryCounts).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      color: MODULE_COLORS[name] || '#FF3E00'
    }));

    return {
      total,
      completed,
      completionRate,
      totalPoints,
      pendingPoints,
      pieData: pieData.length > 0 ? pieData : [{ name: 'EMPTY', value: 1, color: '#222' }]
    };
  }, [tasks]);

  // Aggregate user interactions into core module classifications
  const moduleUsageDistribution = useMemo(() => {
    const totals: Record<string, number> = {
      casual: 0, command: 0, academia: 0, math: 0,
      language: 0, creative: 0, engineering: 0, memory: 0
    };

    INITIAL_MODULE_USAGE.forEach(day => {
      Object.keys(totals).forEach(key => {
        totals[key] += (day as any)[key] || 0;
      });
    });

    // Also factor in current tasks weight
    tasks.forEach(t => {
      if (totals[t.category] !== undefined) {
        totals[t.category] += t.completed ? 30 : 10;
      }
    });

    return Object.entries(totals).map(([key, value]) => ({
      name: key.toUpperCase(),
      interactions: value,
      fill: MODULE_COLORS[key] || '#FF3E00'
    })).sort((a, b) => b.interactions - a.interactions);
  }, [tasks]);

  return (
    <div id="productivity-metrics-dashboard" className="space-y-8 animate-fade-in">
      
      {/* Dynamic Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Completion Rate Gauge */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-[1px] h-full bg-[#FF3E00] opacity-40 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Task Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#FF3E00]" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-serif tracking-tighter text-white font-semibold">{stats.completionRate}%</span>
            <span className="text-[9px] font-mono text-emerald-400">({stats.completed}/{stats.total} Tasks)</span>
          </div>
          {/* Custom micro sparkline or progress representation */}
          <div className="w-full bg-white/5 h-1 rounded-sm mt-4 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#FF3E00] to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Card 2: Neural Capacity Index */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-[1px] h-full bg-[#FF3E00] opacity-40 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Neural Gain score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-serif tracking-tighter text-white font-semibold">+{stats.totalPoints}</span>
            <span className="text-[9px] font-mono text-neutral-500">units gained</span>
          </div>
          <div className="text-[9px] text-white/30 font-mono mt-4 uppercase">
            {stats.pendingPoints} units locked in backlog
          </div>
        </div>

        {/* Card 3: Domain Distribution */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-[1px] h-full bg-blue-500 opacity-40 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Principal Module Focus</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-serif tracking-tighter text-white uppercase truncate max-w-full">
              {moduleUsageDistribution[0]?.name || 'Auto'}
            </span>
          </div>
          <div className="text-[9px] text-emerald-400/80 font-mono mt-4 uppercase tracking-wider">
            {moduleUsageDistribution[0]?.interactions} interactions logged
          </div>
        </div>

        {/* Card 4: Operating State Gauge */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-[1px] h-full bg-purple-500 opacity-40 group-hover:opacity-100 transition-all duration-300" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Cognitive Rhythm</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-serif tracking-tighter text-white font-semibold">Optimal</span>
          </div>
          <div className="text-[9px] text-[#FF3E00]/80 font-mono mt-4 uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3E00] animate-ping" />
            SYNCS COMPLETED REAL-TIME
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Tasks & Module Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Real-time Interactive Task Manager (7 Cols) */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm space-y-6 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#FF3E00] font-bold">Directive Node Matrix</span>
              <h3 className="text-lg font-medium tracking-tight">Active Tasks & Objectives</h3>
            </div>
            <span className="px-2 py-0.5 border border-white/5 bg-black rounded text-[9px] font-mono text-white/40 uppercase">
              Sandbox Sync
            </span>
          </div>

          {/* New Task Console Form */}
          <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 py-3 border-y border-white/[0.03]">
            <input 
              type="text"
              placeholder="Deploy a new objective key..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-black text-[#F5F5F5] border border-white/5 rounded-sm px-4 py-2.5 text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-[#FF3E00]/50 transition-all"
            />
            
            <div className="flex gap-2 shrink-0">
              <select 
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="bg-black text-[#F5F5F5] border border-white/5 rounded-sm px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-[#FF3E00]/50"
              >
                <option value="command">COMMAND</option>
                <option value="engineering">ENGINEERING</option>
                <option value="math">QUANT_MATH</option>
                <option value="academia">ACADEMIA</option>
                <option value="casual">CASUAL</option>
                <option value="language">LANGUAGE</option>
                <option value="creative">CREATIVE</option>
                <option value="memory">COLLECT_BANK</option>
                <option value="health">HEALTH</option>
              </select>

              <button 
                type="submit"
                className="bg-[#FF3E00] hover:bg-[#FF3E00]/90 text-black font-bold font-mono text-[10px] px-4 rounded-sm flex items-center gap-1 uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </form>

          {/* Scrollable Tasks list */}
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            <AnimatePresence initial={false}>
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-white/20 font-mono text-xs uppercase tracking-widest">
                  No active parameters mapped. Build a custom task above!
                </div>
              ) : (
                tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layoutId={`task-${task.id}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      "group p-3 border rounded-sm flex items-center justify-between gap-4 cursor-pointer transition-all duration-300",
                      task.completed 
                        ? "border-emerald-500/10 bg-emerald-500/[0.01]" 
                        : "border-white/5 bg-black/40 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 transition-transform active:scale-90 text-neutral-400 hover:text-white">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-white/30 hover:text-[#FF3E00]" />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-mono transition-all truncate pr-3",
                        task.completed ? "line-through text-white/30 font-light" : "text-white/80"
                      )}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded-sm tracking-wider" style={{
                        color: MODULE_COLORS[task.category],
                        backgroundColor: `${MODULE_COLORS[task.category]}15`,
                        border: `1px solid ${MODULE_COLORS[task.category]}25`
                      }}>
                        {task.category}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 font-semibold text-right w-10">
                        {task.completed ? `+${task.score}` : `[${task.score}]`}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="p-1 text-white/20 hover:text-red-500 rounded transition-colors"
                        title="Dismantle Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          
        </div>

        {/* Right Side: Recharts Pie Focus Index of Category Breakdown (5 Cols) */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm flex flex-col justify-between lg:col-span-5">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#FF3E00] font-bold">Execution Balance</span>
            <h3 className="text-lg font-medium tracking-tight">Focus Node Distribution</h3>
          </div>

          <div className="h-64 relative w-full flex items-center justify-center mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#050505', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '10px',
                    fontFamily: 'monospace'
                  }}
                  itemStyle={{ color: '#F5F5F5' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center HUD Circle */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF3E00]/60">Ratio Ratio</span>
              <span className="text-2xl font-serif tracking-tighter text-white font-semibold">
                {stats.completed}/{stats.total}
              </span>
            </div>
          </div>

          {/* Segment Labels list */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/[0.03]">
            {stats.pieData.map((entry: any, idx) => {
              if (entry.name === 'EMPTY') return null;
              return (
                <div key={idx} className="flex items-center gap-2 text-[9px] font-mono text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate">{entry.name}</span>
                  <span className="ml-auto text-white/20">({entry.value})</span>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Dynamic Module Usage Over Time & Completion Rates Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Module Usage (Bar Chart) */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#FF3E00] font-bold">Telemetry Core logs</span>
              <h3 className="text-md uppercase font-light">Interactive Module Load Over Time (GMT)</h3>
            </div>
            <BarChart3 className="w-4 h-4 text-[#FF3E00]" />
          </div>

          <div className="h-72 w-full pr-4 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INITIAL_MODULE_USAGE}>
                <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#050505', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '10px'
                  }}
                  labelStyle={{ color: '#FF3E00', fontWeight: 'bold' }}
                />
                <Bar dataKey="command" name="Command Core" stackId="modules" fill="#FF3E00" />
                <Bar dataKey="engineering" name="God Intel" stackId="modules" fill="#F59E0B" />
                <Bar dataKey="casual" name="Casual OS" stackId="modules" fill="#A3A3A3" />
                <Bar dataKey="memory" name="Collective" stackId="modules" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-white/20 font-mono text-center uppercase tracking-wider">
            Stack layers denote computational latency blocks spent in core modules.
          </p>
        </div>

        {/* Task completion Velocity (Area Chart) */}
        <div className="p-6 border border-white/5 bg-[#050505] rounded-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#FF3E00] font-bold">Dynamic Velocity Graph</span>
              <h3 className="text-md uppercase font-light">Created vs Completed Trend (7 Days)</h3>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-72 w-full pr-4 text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalTimeline}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#050505', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '10px'
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase' }} />
                <Area type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCreated)" />
                <Area type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-white/20 font-mono text-center uppercase tracking-wider">
            Velocity convergence: Complete tasks to shift completion line above incoming work index.
          </p>
        </div>

      </div>

    </div>
  );
}
