import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Globe, Languages, Zap, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

const languages = [
  { code: 'ZH', name: 'Mandarin', status: 'Native Accuracy', level: 100 },
  { code: 'FR', name: 'French', status: 'Literary Mode', level: 85 },
  { code: 'JP', name: 'Japanese', status: 'Nuance Sync', level: 78 },
  { code: 'DE', name: 'German', status: 'Technical', level: 92 },
];

export default function PolyglotModule() {
  const [selectedLang, setSelectedLang] = useState(languages[0]);

  return (
    <div id="polyglot-module" className="p-10 h-full bg-transparent text-[#F5F5F5] overflow-y-auto">
      <div className="flex flex-col mb-16 px-4">
        <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00] mb-2">Neural Cross-Logic</div>
        <h2 className="text-4xl font-serif italic tracking-tighter text-[#F5F5F5]">Cognitive_Synapse</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang)}
              className={cn(
                "w-full p-4 border transition-all duration-500 text-left group",
                selectedLang.code === lang.code 
                  ? "bg-[#111] border-[#FF3E00] shadow-[0_0_15px_rgba(255,62,0,0.1)]" 
                  : "bg-transparent border-[#1A1A1A] hover:border-white/20"
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-serif italic">{lang.name}</span>
                <span className={cn(
                  "text-[9px] font-mono tracking-widest uppercase",
                  selectedLang.code === lang.code ? "text-[#FF3E00]" : "opacity-30"
                )}>{lang.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] opacity-40 uppercase tracking-tighter">{lang.status}</span>
                <div className="flex gap-0.5">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={cn("w-1 h-3", i * 20 <= lang.level ? "bg-[#FF3E00]/60" : "bg-white/5")} />
                   ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="p-10 border border-[#1A1A1A] bg-[#050505] relative min-h-[300px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-6 flex gap-4">
               <Languages className="w-4 h-4 text-[#FF3E00]" />
               <Globe className="w-4 h-4 text-white/20" />
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-4">Input Context</h3>
                <p className="text-2xl font-light tracking-tight text-white/90">
                  The intersection of aesthetic minimalism and procedural generation creates a unique digital void.
                </p>
              </div>

              <div className="pt-8 border-t border-white/5">
                <h3 className="text-[10px] tracking-[0.3em] uppercase text-[#FF3E00] mb-4">Linguistic Synthesis ({selectedLang.name})</h3>
                <p className="text-xl font-serif italic text-white/60 leading-relaxed">
                  {selectedLang.code === 'FR' ? "L'intersection du minimalisme esthétique et de la génération procédurale crée un vide numérique unique." : 
                   selectedLang.code === 'ZH' ? "审美极简主义与程序生成的交汇创造了一个独特的数字空白。" :
                   "Target linguistic mapping in progress..."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="p-6 border border-[#1A1A1A] bg-[#050505] flex items-center gap-4">
                <Zap className="w-4 h-4 text-[#FF3E00]" />
                <div>
                   <div className="text-[9px] uppercase tracking-widest opacity-40">Latency</div>
                   <div className="text-xs font-mono">14ms</div>
                </div>
             </div>
             <div className="p-6 border border-[#1A1A1A] bg-[#050505] flex items-center gap-4">
                <MessageSquare className="w-4 h-4 text-[#FF3E00]" />
                <div>
                   <div className="text-[9px] uppercase tracking-widest opacity-40">Paradigm</div>
                   <div className="text-xs font-mono italic font-serif">Literary_Sync</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
