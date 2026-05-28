import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sigma, Binary, Zap, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ProficiencyScore } from '../types';

const data = [
  { x: 0, y: 10 },
  { x: 1, y: 15 },
  { x: 2, y: 8 },
  { x: 3, y: 22 },
  { x: 4, y: 18 },
  { x: 5, y: 30 },
  { x: 6, y: 25 },
];

export default function MathModule() {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    setChartReady(true);
  }, []);

  const proficiency: ProficiencyScore[] = useMemo(() => {
    const saved = localStorage.getItem('konda_proficiency');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const totalLevel = proficiency.filter(p => p.moduleId === 'math').reduce((acc, p) => acc + p.level, 0) / 3;
  const difficulty = totalLevel > 80 ? 'EXTREME' : totalLevel > 50 ? 'ADVANCED' : 'FOUNDATIONAL';
  return (
    <div id="math-module" className="p-10 h-full bg-transparent text-[#F5F5F5] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        <div className="md:col-span-4 space-y-10">
          <section>
            <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#FF3E00] font-bold mb-4">Logical Matrix</h3>
            <div className="text-4xl font-serif italic mb-2 tracking-tighter">
              {"∫ L(θ) + λ ||θ||₁ dθ"}
            </div>
            <div className="text-[10px] text-[#FF3E00]/40 font-mono">Simulating non-convex optimization...</div>
          </section>

          <section className="space-y-4">
             <h3 className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">Quant Protocol</h3>
             <div className="p-5 border border-[#FF3E00]/20 bg-[#050505] rounded-sm group hover:border-[#FF3E00]/60 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#FF3E00]" />
                   <span className="text-[10px] font-mono tracking-widest uppercase">Bayesian Inference Engine</span>
                </div>
                <p className="text-xs text-[#CCC] leading-relaxed italic mb-4">
                   Calculating posterior probability distributions under real-world Bayesian constraints.
                </p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[8px] uppercase tracking-widest text-white/30">Difficulty_Scale</span>
                   <span className={cn(
                     "text-[10px] font-mono tracking-widest px-2 py-0.5 rounded",
                     difficulty === 'EXTREME' ? "bg-red-500 text-white" :
                     difficulty === 'ADVANCED' ? "bg-yellow-500/20 text-yellow-500" :
                     "bg-white/10 text-white/40"
                   )}>{difficulty}</span>
                </div>
             </div>
          </section>
        </div>

        <div className="md:col-span-8 p-8 border border-[#1A1A1A] bg-[#050505]/50 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4">
               <div className="text-[9px] font-mono text-[#FF3E00] tracking-tighter uppercase opacity-40">Probability_Density_V2</div>
            </div>
            
            <div className="w-full min-w-0 min-h-[300px] h-[300px] relative">
               {chartReady && (
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF3E00" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#FF3E00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                      <XAxis dataKey="x" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '2px', fontSize: '10px' }}
                        itemStyle={{ color: '#FF3E00' }}
                      />
                      <Area type="monotone" dataKey="y" stroke="#FF3E00" strokeWidth={1} fillOpacity={1} fill="url(#colorRed)" />
                    </AreaChart>
                 </ResponsiveContainer>
               )}
            </div>

            <div className="mt-6 flex justify-between items-end border-t border-[#1A1A1A] pt-4">
               <div className="space-y-1">
                  <div className="text-[8px] uppercase tracking-widest opacity-30">Sampling Engine</div>
                  <div className="flex gap-1">
                     {[1,2,3,4,5,6,7].map(i => <div key={i} className="w-px h-3 bg-[#FF3E00]/40" />)}
                  </div>
               </div>
               <div className="text-right">
                  <span className="text-[18px] font-light tracking-tighter">782,192 <span className="text-[10px] opacity-30 font-mono">ITERATIONS</span></span>
               </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MathCard icon={Sigma} title="Symbolic" desc="LaTeX parsing & solving." subject="Calculus" />
        <MathCard icon={Binary} title="Tensors" desc="Matrix & vector ops." subject="Linear Algebra" />
        <MathCard icon={Zap} title="Direct" desc="Probabilistic modeling." subject="Probability" />
      </div>
    </div>
  );
}

function MathCard({ icon: Icon, title, desc, subject }: { icon: any, title: string, desc: string, subject: string }) {
  const handleClick = () => {
    // Report progress to global listener
    window.dispatchEvent(new CustomEvent('konda-progress', {
      detail: {
        moduleId: 'math',
        subject,
        delta: 2, // Small boost for interaction
        weakPoint: Math.random() > 0.8 ? 'Random Topic' : undefined
      }
    }));
  };

  return (
    <div 
      onClick={handleClick}
      className="p-6 border border-[#1A1A1A] bg-[#050505] flex items-center gap-6 hover:bg-[#111] transition-colors cursor-pointer group"
    >
      <div className="w-10 h-10 border border-[#222] rounded-full flex items-center justify-center group-hover:border-[#FF3E00] transition-colors">
        <Icon className="w-4 h-4 text-[#F5F5F5] group-hover:text-[#FF3E00] transition-colors" />
      </div>
      <div>
         <h4 className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#F5F5F5] mb-1">{title}</h4>
         <p className="text-[11px] text-[#F5F5F5]/40 leading-snug">{desc}</p>
      </div>
    </div>
  )
}
