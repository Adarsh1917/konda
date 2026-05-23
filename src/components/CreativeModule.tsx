import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Box, Maximize, Palette, Sparkles, Image as ImageIcon, Download, Copy, Loader2, Send, Upload, Wand2 } from 'lucide-react';
import { cn, generateId } from '../lib/utils';

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
  const [stylePreset, setStylePreset] = useState('Realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'edit'>('synthesis');
  const [editImage, setEditImage] = useState<string | null>(null);
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('konda_creative_assets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // Fallback
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
  const [activeAsset, setActiveAsset] = useState<Asset>(assets[0] || {
    id: 'placeholder',
    url: '',
    prompt: 'Awaiting first manifestation...',
    timestamp: '00:00:00'
  });

  const createdUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('konda_creative_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    return () => {
      // Cleanup blob URLs on unmount
      createdUrls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    // Mimic generation latency
    setTimeout(() => {
      const now = new Date();
      const newAsset: Asset = {
        id: generateId(),
        url: `https://images.unsplash.com/photo-${1600000000000 + Math.floor(Math.random() * 100000000)}?auto=format&fit=crop&w=800&q=80`,
        prompt: activeTab === 'edit' 
          ? `Modified: ${prompt} (Based on uploaded blueprint)` 
          : `${stylePreset}: ${prompt}${negativePrompt ? ` [Negative: ${negativePrompt}]` : ''} (${aspectRatio})`,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setAssets(prev => [newAsset, ...prev]);
      setActiveAsset(newAsset);
      setPrompt('');
      if (activeTab === 'synthesis') setNegativePrompt('');
      setIsGenerating(false);
      if (activeTab === 'edit') setEditImage(null);
    }, 2500);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>, forEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      createdUrls.current.add(url);
      if (forEdit) {
        setEditImage(url);
      } else {
        const now = new Date();
        const newAsset: Asset = {
          id: generateId(),
          url: url,
          prompt: `Imported Asset: ${file.name}`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setAssets(prev => [newAsset, ...prev]);
        setActiveAsset(newAsset);
      }
    }
  };

  const stylePresets = ['Realistic', 'Cinematic', 'Anime', 'Illustration', 'Cyberpunk', 'Minimalist'];
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  return (
    <div className="h-full bg-transparent p-6 sm:p-10 overflow-y-auto custom-scrollbar">
      <input 
        type="file" 
        ref={importInputRef} 
        onChange={(e) => handleImport(e)} 
        className="hidden" 
        accept="image/*" 
      />
      <input 
        type="file" 
        ref={editInputRef} 
        onChange={(e) => handleImport(e, true)} 
        className="hidden" 
        accept="image/*" 
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between mb-16 gap-6">
        <div className="space-y-1">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00]">Ghost Mark Architecture</div>
          <h2 className="text-4xl font-serif italic tracking-tighter text-[#F5F5F5]">Creative / <span className="opacity-40">Edit</span></h2>
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
          <div className="border border-[#1A1A1A] bg-[#050505] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button 
                onClick={() => setActiveTab('synthesis')}
                className={cn(
                  "flex-1 py-4 text-[9px] font-mono uppercase tracking-[0.2em] transition-all",
                  activeTab === 'synthesis' ? "text-[#FF3E00] border-b border-[#FF3E00]" : "text-white/20 hover:text-white/40"
                )}
              >
                New_Synthesis
              </button>
              <button 
                onClick={() => setActiveTab('edit')}
                className={cn(
                  "flex-1 py-4 text-[9px] font-mono uppercase tracking-[0.2em] transition-all",
                  activeTab === 'edit' ? "text-[#FF3E00] border-b border-[#FF3E00]" : "text-white/20 hover:text-white/40"
                )}
              >
                AI_Assistant_Edit
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6">
              {activeTab === 'synthesis' ? (
                <div key="synthesis-panel">
                  <h3 className="text-[10px] font-mono text-white/40 mb-4 uppercase tracking-[0.3em]">Synthesis Engine</h3>
                  <form onSubmit={handleGenerate} className="space-y-5">
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Primary Prompt</h4>
                      <div className="relative">
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Describe the manifestation..."
                          className="w-full bg-black/40 border border-white/5 p-4 text-sm font-light min-h-[100px] focus:outline-none focus:border-[#FF3E00]/50 transition-all resize-none placeholder:text-white/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Negative Protocol</h4>
                      <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="Avoid elements (e.g. blur, low quality)..."
                        className="w-full bg-black/40 border border-white/5 p-3 text-[11px] font-light min-h-[60px] focus:outline-none focus:border-red-500/30 transition-all resize-none placeholder:text-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <h4 className="text-[9px] font-mono text-white/20 mb-2 uppercase tracking-widest">Visual_Style</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {stylePresets.map(style => (
                            <button
                              key={style}
                              type="button"
                              onClick={() => setStylePreset(style)}
                              className={cn(
                                "px-3 py-2 text-[9px] font-mono border transition-all text-left uppercase truncate",
                                stylePreset === style 
                                  ? "bg-[#FF3E00]/10 border-[#FF3E00] text-[#FF3E00]" 
                                  : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                              )}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[9px] font-mono text-white/20 mb-2 uppercase tracking-widest">Aspect Ratio</h4>
                        <div className="flex flex-wrap gap-2">
                          {ratios.map(ratio => (
                            <button
                              key={ratio}
                              type="button"
                              onClick={() => setAspectRatio(ratio)}
                              className={cn(
                                "px-2.5 py-1.5 text-[9px] font-mono border transition-all",
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

                    <button 
                      type="submit"
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full py-4 bg-[#FF3E00] text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF3E00]/90 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Synthesizing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Initiate_Synthesis
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div key="edit-panel" className="space-y-6">
                  <h3 className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-[0.3em]">AI_Assisted_Modification</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Target Image</h4>
                      {!editImage ? (
                        <button 
                          onClick={() => editInputRef.current?.click()}
                          className="w-full aspect-video border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#FF3E00]/40 transition-all bg-white/[0.02]"
                        >
                          <Upload className="w-6 h-6 text-white/20" />
                          <span className="text-[9px] font-mono text-white/20 uppercase">Load_Base_Layer</span>
                        </button>
                      ) : (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                          <img src={editImage} alt="edit target" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setEditImage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white/60 hover:text-white"
                          >
                            <Box className="w-3 h-3 rotate-45" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Modification Instruction</h4>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Change background to cyberpunk neon city, make it 8-bit style..."
                        className="w-full bg-black/40 border border-white/5 p-4 text-sm font-light min-h-[120px] focus:outline-none focus:border-[#FF3E00]/50 transition-all resize-none placeholder:text-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button className="py-3 px-2 border border-white/5 bg-white/[0.02] text-[8px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition-all">Background_Swap</button>
                      <button className="py-3 px-2 border border-white/5 bg-white/[0.02] text-[8px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition-all">Style_Transfer</button>
                      <button className="py-3 px-2 border border-white/5 bg-white/[0.02] text-[8px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition-all">Element_Removal</button>
                      <button className="py-3 px-2 border border-white/5 bg-white/[0.02] text-[8px] font-mono uppercase tracking-widest text-white/40 hover:text-white/80 transition-all">Enhance_Detail</button>
                    </div>

                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim() || !editImage}
                      className="w-full py-4 bg-[#FF3E00] text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#FF3E00]/90 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing_Pixels...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Apply_Magic_Edit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5">
               <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-4">Seed History</h3>
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
