import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Image, Volume2, Shield, Network, Check, AlertTriangle, Cloud, Power } from 'lucide-react';

interface ProviderHealth {
  status: 'Healthy' | 'Limited' | 'Unavailable';
  hasKey: boolean;
  cooldown: number; // in seconds
  recentFailures: number;
}

interface ProviderStatuses {
  [key: string]: ProviderHealth;
}

export default function BrainSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [statuses, setStatuses] = useState<ProviderStatuses>({
    gemini: { status: 'Healthy', hasKey: true, cooldown: 0, recentFailures: 0 },
    deepseek: { status: 'Unavailable', hasKey: false, cooldown: 0, recentFailures: 0 },
    openai: { status: 'Unavailable', hasKey: false, cooldown: 0, recentFailures: 0 },
    claude: { status: 'Unavailable', hasKey: false, cooldown: 0, recentFailures: 0 },
    fal: { status: 'Unavailable', hasKey: false, cooldown: 0, recentFailures: 0 },
    stability: { status: 'Unavailable', hasKey: false, cooldown: 0, recentFailures: 0 },
    elevenlabs: { status: 'Unavailable', hasKey: false, cooldown: 0, recentFailures: 0 },
    browser: { status: 'Healthy', hasKey: true, cooldown: 0, recentFailures: 0 },
  });

  const [providers, setProviders] = useState(() => {
    try {
      const saved = localStorage.getItem('konda_preferred_providers');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      chat: 'auto',   // auto, gemini, deepseek, openai, claude
      image: 'auto',  // auto, fal, stability
      voice: 'auto'   // auto, browser, elevenlabs, openai
    };
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll server for provider statuses
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/provider-status');
      if (res.ok) {
        const data = await res.json();
        setStatuses(data);
      }
    } catch (e) {
      console.warn("Error fetching provider health matrix:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Save changes to localStorage and dispatch event for cross-module synchronization
  const handleSelect = (category: 'chat' | 'image' | 'voice', providerId: string) => {
    const next = { ...providers, [category]: providerId };
    setProviders(next);
    localStorage.setItem('konda_preferred_providers', JSON.stringify(next));
    window.dispatchEvent(new Event('konda_providers_changed'));

    // Check if the manual choice is unavailable / unconfigured
    if (providerId !== 'auto' && providerId !== 'browser') {
      const h = statuses[providerId];
      if (h && !h.hasKey) {
        const friendlyName = {
          gemini: 'Gemini',
          deepseek: 'DeepSeek',
          openai: 'OpenAI',
          claude: 'Claude',
          fal: 'FAL.ai',
          stability: 'Stability AI',
          elevenlabs: 'ElevenLabs'
        }[providerId] || providerId;

        // Dispatch status toast/notification in console or app
        console.warn(`[ROUTING_WARNING] Force routing is set to ${friendlyName}, but its API Key is not configured on the uplink.`);
      }
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getStatusColor = (id: string) => {
    if (id === 'auto' || id === 'browser') return 'bg-emerald-500';
    const h = statuses[id];
    if (!h) return 'bg-neutral-600';
    if (!h.hasKey) return 'bg-red-500/20 border border-red-500/30';
    if (h.cooldown > 0) return 'bg-amber-500 animate-pulse';
    if (h.status === 'Healthy') return 'bg-emerald-500';
    if (h.status === 'Limited') return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusText = (id: string) => {
    if (id === 'auto') return 'Ready';
    if (id === 'browser') return 'Active';
    const h = statuses[id];
    if (!h) return 'Offline';
    if (!h.hasKey) return 'Key Missing';
    if (h.cooldown > 0) return `Cooling (${Math.round(h.cooldown)}s)`;
    return h.status;
  };

  return (
    <div className="relative inline-block z-40">
      <button
        id="brain-switcher-btn"
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 border rounded-lg flex items-center justify-center transition-all cursor-pointer relative group ${
          isOpen 
            ? 'border-[#FF3E00] text-[#FF3E00] bg-[#FF3E00]/5' 
            : 'border-white/5 bg-[#050505] text-white/50 hover:border-[#FF3E00]/30 hover:text-white'
        }`}
        title="AI Neural Provider Switcher"
      >
        <Brain className={`w-4 h-4 ${providers.chat !== 'auto' ? 'text-[#FF3E00] animate-pulse' : ''}`} />
        <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full border border-[#0A0A0A] bg-emerald-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-12 right-0 w-80 bg-[#0A0A0A] border border-white/5 p-5 rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.8)] space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FF3E00]" />
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-medium text-white/80">
                  UPLINK MODULE SWITCHER
                </span>
              </div>
              <Cloud className="w-3.5 h-3.5 text-white/20" />
            </div>

            {/* Chat section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider uppercase text-white/30">
                <Network className="w-3 h-3 text-[#FF3E00]" />
                <span>Text Reasoning Matrix</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { id: 'auto', label: 'Brain Auto (Gemini Priority)' },
                  { id: 'gemini', label: 'Google Gemini Pro' },
                  { id: 'deepseek', label: 'DeepSeek Coder / V3' },
                  { id: 'openai', label: 'OpenAI GPT-4o Engine' },
                  { id: 'claude', label: 'Anthropic Claude-3.5' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('chat', item.id)}
                    className={`flex items-center justify-between px-3 py-1.5 border rounded-sm text-[10px] font-mono text-left cursor-pointer transition-all ${
                      providers.chat === item.id
                        ? 'border-[#FF3E00]/30 bg-[#FF3E00]/5 text-white font-bold'
                        : 'border-transparent text-white/40 hover:bg-white/[0.02] hover:text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(item.id)}`} />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] opacity-45">{getStatusText(item.id)}</span>
                      {providers.chat === item.id && <Check className="w-3 h-3 text-[#FF3E00]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider uppercase text-white/30">
                <Image className="w-3 h-3 text-cyan-400" />
                <span>Multimodal Image Router</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'auto', label: 'Auto' },
                  { id: 'fal', label: 'Fal.ai' },
                  { id: 'stability', label: 'Stability' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('image', item.id)}
                    className={`px-1 py-1 border rounded-sm text-[9px] font-mono text-center cursor-pointer transition-all ${
                      providers.image === item.id
                        ? 'border-[#FF3E00]/30 bg-[#FF3E00]/5 text-white'
                        : 'border-white/5 text-white/40 hover:bg-white/[0.02] hover:text-white/60'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <div className={`w-1 h-1 rounded-full ${getStatusColor(item.id)}`} />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[7px] text-white/20 whitespace-nowrap overflow-hidden">
                        {getStatusText(item.id)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider uppercase text-white/30">
                <Volume2 className="w-3 h-3 text-pink-400" />
                <span>Text-to-Speech Core</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'auto', label: 'Auto Priority' },
                  { id: 'browser', label: 'Browser Speech' },
                  { id: 'elevenlabs', label: 'ElevenLabs Voice' },
                  { id: 'openai', label: 'OpenAI TTS' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('voice', item.id)}
                    className={`px-2 py-1.5 border rounded-sm text-[9px] font-mono text-left cursor-pointer transition-all ${
                      providers.voice === item.id
                        ? 'border-[#FF3E00]/30 bg-[#FF3E00]/5 text-white'
                        : 'border-white/5 text-white/40 hover:bg-white/[0.02] hover:text-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-1 h-1 rounded-full ${getStatusColor(item.id)} flex-shrink-0`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {providers.voice === item.id && <Check className="w-2.5 h-2.5 text-[#FF3E00] flex-shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Failsafe Note */}
            {providers.chat !== 'auto' && (
              <div className="p-2 border border-blue-500/10 bg-blue-500/[0.02] text-[8px] font-mono text-blue-400 leading-normal rounded-sm">
                ⚠️ [FORCE_ROUTING_ACTIVE] Disengaged automatic failover matrix. All chats are bound to {providers.chat.toUpperCase()}.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
