import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Box, Maximize, Palette, Sparkles, Image as ImageIcon, Download, Copy, Loader2, Send } from 'lucide-react';
import { cn } from '../lib/utils';

interface Asset {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
}

export default function CreativeModule() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [stylePreset, setStylePreset] = useState('Photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('konda_creative_assets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        prompt: 'Minimalist abstract gradient, vaporwave aesthetic, sharp corners',
        timestamp: '14:22:00'
      }
    ];
  });
  const [activeAsset, setActiveAsset] = useState<Asset>(assets[0]);

  useEffect(() => {
    localStorage.setItem('konda_creative_assets', JSON.stringify(assets));
  }, [assets]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    // Mimic generation latency
    setTimeout(() => {
      const now = new Date();
      const newAsset: Asset = {
        id: Date.now().toString(),
        url: `https://images.unsplash.com/photo-${1600000000000 + Math.floor(Math.random() * 100000000)}?auto=format&fit=crop&w=800&q=80`,
        prompt: `${stylePreset}: ${prompt}${negativePrompt ? ` [Negative: ${negativePrompt}]` : ''} (${aspectRatio})`,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setAssets(prev => [newAsset, ...prev]);
      setActiveAsset(newAsset);
      setPrompt('');
      setNegativePrompt('');
      setIsGenerating(false);
    }, 2500);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const now = new Date();
      const newAsset: Asset = {
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        prompt: `Imported Asset: ${file.name}`,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setAssets(prev => [newAsset, ...prev]);
      setActiveAsset(newAsset);
    }
  };

  const stylePresets = ['Photorealistic', 'Anime', 'Cyberpunk', 'Cinematic', 'Minimalist', 'Noir'];
  const ratios = ['1:1', '16:9', '9:16', '4:5', '3:2'];

  return (
    <div className="h-full bg-transparent p-6 sm:p-10 overflow-y-auto custom-scrollbar">
      <input 
        type="file" 
        ref={importInputRef} 
        onChange={handleImport} 
        className="hidden" 
        accept="image/*" 
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between mb-16 gap-6">
        <div className="space-y-1">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00]">Ghost Mark Architecture</div>
          <h2 className="text-4xl font-serif italic tracking-tighter text-[#F5F5F5]">Visual_Mnemonics</h2>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button 
            onClick={() => importInputRef.current?.click()}
            className="flex-1 sm:flex-none px-6 py-2 border border-[#333] rounded-sm text-[10px] tracking-widest font-mono hover:border-[#FF3E00] hover:text-[#FF3E00] transition-colors uppercase"
          >
            Import_Blueprint
          </button>
          <button className="flex-1 sm:flex-none px-6 py-2 bg-[#FF3E00] text-black rounded-sm text-[10px] tracking-widest font-mono font-bold hover:bg-[#FF3E00]/90 transition-colors uppercase shadow-[0_0_15px_rgba(255,62,0,0.3)]">Export_Tactics</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Generation Interface */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 border border-[#1A1A1A] bg-[#050505] flex flex-col gap-6">
            <div>
              <h3 className="text-[10px] font-mono text-white/40 mb-4 uppercase tracking-[0.3em]">Diagram Protocol</h3>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Subject/Topic for mnemonic diagram..."
                    className="w-full bg-black/40 border border-white/5 p-4 text-sm font-light min-h-[120px] focus:outline-none focus:border-[#FF3E00]/50 transition-all resize-none placeholder:text-white/10"
                  />
                  <button 
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute bottom-4 right-4 p-2 bg-[#FF3E00] text-black rounded-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded space-y-2">
                    <h4 className="text-[9px] font-mono text-red-500 uppercase tracking-widest font-bold">GHOST_MARK_HACK: Structure</h4>
                    <p className="text-[10px] text-white/40 leading-relaxed italic">"Diagrams secure 40% marks even if text is weak. Every answer needs a Flowchart or Block Diagram."</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[9px] font-mono text-white/20 mb-2 uppercase tracking-widest">Logic_Type</h4>
                      <select 
                        value={stylePreset}
                        onChange={(e) => setStylePreset(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 p-2 text-[10px] font-mono text-white/60 focus:outline-none focus:border-[#FF3E00]/50 transition-all appearance-none uppercase tracking-widest"
                      >
                        <option value="Flowchart">Flowchart</option>
                        <option value="Mindmap">Mindmap</option>
                        <option value="Block">Block_Diagram</option>
                        <option value="Hierarchy">Hierarchy</option>
                      </select>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-mono text-white/20 mb-2 uppercase tracking-widest">Aspect Ratio</h4>
                      <div className="flex flex-wrap gap-1">
                        {ratios.map(ratio => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            className={cn(
                              "px-2 py-1 text-[9px] font-mono border transition-all",
                              aspectRatio === ratio 
                                ? "bg-[#FF3E00]/10 border-[#FF3E00] text-[#FF3E00]" 
                                : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                            )}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Seed History</h3>
               <div className="grid grid-cols-3 gap-2">
                 {assets.map(asset => (
                   <button 
                    key={asset.id}
                    onClick={() => setActiveAsset(asset)}
                    className={cn(
                      "aspect-square border overflow-hidden transition-all relative group",
                      activeAsset.id === asset.id ? "border-[#FF3E00]" : "border-white/5 hover:border-white/20"
                    )}
                   >
                     <img src={asset.url} alt="thumbnail" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-mono text-white transition-opacity">
                        {asset.timestamp}
                     </div>
                   </button>
                 ))}
               </div>
            </div>
          </div>

          <div className="p-8 border border-[#1A1A1A] bg-[#050505]">
            <h3 className="text-[10px] font-mono text-white/40 mb-6 uppercase tracking-[0.3em]">Kernel Constants</h3>
            <div className="space-y-4">
              <TokenRow label="DENSITY_MANIFEST" value="300_DPI" />
              <TokenRow label="COLOR_ENGINE" value="P3_WIDEST" />
              <TokenRow label="SYNC_TIMESTAMP" value={activeAsset.timestamp} />
              <TokenRow label="ASSET_ORIGIN" value={activeAsset.id.length > 5 ? 'USER_IMPORT' : 'SYNTH_CORE'} />
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="aspect-video lg:aspect-auto lg:h-[500px] border border-[#1A1A1A] bg-[#050505] relative overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAsset.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <img 
                  src={activeAsset.url} 
                  alt="preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              </motion.div>
            </AnimatePresence>

            {/* UI Overlays */}
            <div className="absolute top-0 left-0 p-8 flex items-center gap-4 z-10">
               <div className="w-2 h-2 rounded-full bg-[#FF3E00] animate-pulse" />
               <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">Live_Synthesis_v4.2</span>
            </div>

            <div className="absolute top-0 right-0 p-8 flex gap-4 z-10">
               <button className="p-3 bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-[#FF3E00] transition-colors"><Maximize className="w-4 h-4" /></button>
               <button className="p-3 bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-[#FF3E00] transition-colors"><Download className="w-4 h-4" /></button>
            </div>

            <div className="absolute bottom-0 left-0 p-8 z-10 w-full max-w-xl">
               <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                key={`text-${activeAsset.id}`}
                className="space-y-2 group/prompt"
               >
                 <div className="flex items-center justify-between">
                   <div className="text-[10px] font-mono text-[#FF3E00] uppercase tracking-widest">Active Manifestation</div>
                   <button 
                    onClick={() => {
                      navigator.clipboard.writeText(activeAsset.prompt);
                      setCopiedPrompt(true);
                      setTimeout(() => setCopiedPrompt(false), 2000);
                    }}
                    className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-[0.2em] text-white/20 hover:text-[#FF3E00] transition-all opacity-0 group-hover/prompt:opacity-100"
                   >
                     {copiedPrompt ? 'Copied_Protocol' : 'Copy_Prompt'}
                     <Copy className="w-3 h-3" />
                   </button>
                 </div>
                 <h3 className="text-xl sm:text-2xl font-serif italic text-white leading-tight">
                   "{activeAsset.prompt}"
                 </h3>
               </motion.div>
            </div>

            {isGenerating && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                 <Loader2 className="w-10 h-10 text-[#FF3E00] animate-spin" />
                 <div className="text-[10px] font-mono tracking-[0.5em] text-[#FF3E00] uppercase animate-pulse">Calculating_Light_Paths...</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ColorCard color="#FF3E00" label="SVELTE_CORE" hex="#FF3E00" />
            <ColorCard color="#FF3E00" label="VIBRANT_RED" hex="#FF3E00" />
            <ColorCard color="#E0E0E0" label="PAPER_NEUTRAL" hex="#E0E0E0" />
            <ColorCard color="#1A1A1A" label="VOID_BLACK" hex="#1A1A1A" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorCard({ color, label, hex }: { color: string, label: string, hex: string }) {
  return (
    <div className="group cursor-pointer">
      <div 
        className="h-20 border border-[#333] transition-all duration-500 group-hover:border-[#FF3E00] flex items-end p-3 relative overflow-hidden" 
        style={{ backgroundColor: color }} 
      >
          <div className="absolute top-2 right-2 text-[8px] font-mono text-black/40 font-bold opacity-0 group-hover:opacity-100 transition-opacity">COPY</div>
      </div>
      <div className="mt-2 text-center sm:text-left">
        <div className="text-[8px] font-mono tracking-widest text-[#F5F5F5]/40 uppercase truncate">{label}</div>
        <div className="text-[8px] font-mono text-[#F5F5F5]/20">{hex}</div>
      </div>
    </div>
  )
}

function TokenRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-white/5">
      <span className="text-[9px] text-white/30 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-mono text-[#F5F5F5]">{value}</span>
    </div>
  )
}
