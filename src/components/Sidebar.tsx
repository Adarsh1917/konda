import React from 'react';
import { 
  Terminal, 
  Calculator, 
  Languages, 
  Palette, 
  Code2, 
  Database,
  Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ModuleId } from '../types';

interface SidebarProps {
  currentModule: ModuleId;
  onModuleChange: (id: ModuleId) => void;
}

const modules: { id: ModuleId; icon: any; label: string }[] = [
  { id: 'casual', icon: Cpu, label: 'CASUAL' },
  { id: 'command', icon: Terminal, label: 'COMMAND_CENTER' },
  { id: 'math', icon: Calculator, label: 'QUANT_SYNAPSE' },
  { id: 'language', icon: Languages, label: 'LANGUAGE' },
  { id: 'creative', icon: Palette, label: 'CREATIVE/EDIT' },
  { id: 'engineering', icon: Code2, label: 'GOD_INTEL_OS' },
  { id: 'memory', icon: Database, label: 'COLLECTIVE_BANK' },
];

export default function Sidebar({ currentModule, onModuleChange }: SidebarProps) {
  return (
    <div id="konda-sidebar" className="w-64 h-full bg-[#050505] border-r border-[#1A1A1A] flex flex-col p-6 z-20">
      <div className="flex flex-col gap-1 mb-12">
        <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00] mb-1">
          God-Level Intelligence
        </div>
        <h1 className="text-xl font-light tracking-tighter text-[#F5F5F5]">
          KONDA <span className="opacity-20 font-mono text-[10px] tracking-normal">GOD_INTEL_V1</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => onModuleChange(mod.id)}
              className={cn(
                "w-full flex items-center gap-4 px-0 py-3 text-[10px] tracking-[0.25em] uppercase font-medium transition-all duration-300 group relative",
                isActive 
                  ? "text-[#FF3E00]"
                  : "text-[#F5F5F5]/30 hover:text-[#F5F5F5]/80"
              )}
            >
              <div className={cn(
                "absolute left-[-24px] w-[2px] h-full transition-all duration-500",
                isActive ? "bg-[#FF3E00]" : "bg-transparent"
              )} />
              <Icon className={cn("w-3.5 h-3.5 transition-transform duration-500", isActive ? "scale-110" : "opacity-40 group-hover:opacity-100")} />
              <span>{mod.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto space-y-6">
        <div className="p-4 border border-[#222] bg-[#0A0A0A] rounded-sm">
          <div className="text-[9px] uppercase tracking-[0.3em] opacity-40 mb-2">Daily Directive</div>
          <p className="text-[11px] leading-relaxed text-[#CCC] italic font-serif">
            "Bridge the gap between Euclidean geometry and generative design tokens."
          </p>
        </div>
        
        <div className="flex justify-between items-end border-t border-[#1A1A1A] pt-4">
          <div>
            <div className="text-[8px] uppercase tracking-widest opacity-20 mb-1">Status</div>
            <div className="text-[9px] text-[#FF3E00] font-mono uppercase tracking-widest">Autonomous</div>
          </div>
          <div className="text-right">
             <div className="text-[8px] uppercase tracking-widest opacity-20 mb-1">Load</div>
             <div className="text-[9px] text-[#F5F5F5]/40 font-mono">14.2%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
