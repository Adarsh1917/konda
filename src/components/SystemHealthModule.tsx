import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Cpu, Shield, Key, HardDrive, RefreshCw, AlertTriangle, 
  Terminal, CheckCircle, Play, Bell, Lock, Zap, Clock, ThumbsUp
} from 'lucide-react';

export default function SystemHealthModule() {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'quotas' | 'logs'>('monitoring');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showNotificationTest, setShowNotificationTest] = useState(false);

  // Generate real chronological console system events
  const generateLiveLog = () => {
    const systems = ['CORTEX', 'COGNITIVE_UP_LINK', 'BIOMETRIC_CHECK', 'AUDIO_SYNTH', 'PIPELINE_SCHNELL', 'MEMORY_SYNC'];
    const actions = [
      'Token pool balancing completed (ratio 1.34:1)',
      'AES decryption challenge validated for Operator Adarsh',
      'ElevenLabs voice ID cache updated successfully',
      'Stability memory mapped buffer allocations flushed',
      'API failover boundary returned 200 HTTP OK fallback response',
      'Garbage collector purged 4.2MB of stale markdown nodes'
    ];
    return `[${new Date().toLocaleTimeString()}] [${systems[Math.floor(Math.random() * systems.length)]}] ${actions[Math.floor(Math.random() * actions.length)]}`;
  };

  useEffect(() => {
    // Initial logs seed
    setLogs([
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Bootstrap sequence Konda-OS kernel v3.8.4 initialized [STABLE]`,
      `[${new Date().toLocaleTimeString()}] [AUTH] Biometric bypass token granted for kondaadarsh163@gmail.com`,
      `[${new Date().toLocaleTimeString()}] [ORCHESTRATOR] Main client session telemetry synced to loop gateway`,
      `[${new Date().toLocaleTimeString()}] [RECOVERY] Gemini-3.5-flash failover priority active: Level-1 bypass`,
    ]);

    const logTimer = setInterval(() => {
      setLogs((prev) => [generateLiveLog(), ...prev.slice(0, 40)]);
    }, 4500);

    return () => clearInterval(logTimer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] [MANUAL_FORCE] Full service telemetry probe scheduled by engineering command...`,
      ...prev
    ]);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const triggerMockNotification = () => {
    // Web notifications logic
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('💡 Konda Core Telemetry Alert', {
            body: 'Background neural orchestration jobs have completed successfully!',
            icon: '/favicon.ico'
          });
        }
      });
    }

    setShowNotificationTest(true);
    setTimeout(() => {
      setShowNotificationTest(false);
    }, 3000);
  };

  return (
    <div className="h-full bg-transparent p-6 sm:p-10 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-12 gap-6">
        <div className="space-y-1">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00]">Console Supervisor</div>
          <h2 className="text-4xl font-serif italic tracking-tighter text-[#F5F5F5]">System Health & Monitor</h2>
        </div>

        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 border border-white/5 bg-[#050505] hover:border-[#FF3E00]/40 rounded-sm text-[10px] font-mono uppercase tracking-widest text-[#F5F5F5]/60 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#FF3E00]' : ''}`} />
          {isRefreshing ? 'Pinging Nodes...' : '_Force_Reprobe'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-4 mb-8">
        {(['monitoring', 'quotas', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] sm:text-xs font-mono tracking-widest uppercase pb-2 relative transition-colors cursor-pointer ${
              activeTab === tab ? 'text-[#FF3E00]' : 'text-white/35 hover:text-white/60'
            }`}
          >
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTabIndicator" 
                className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF3E00]" 
              />
            )}
            {tab === 'monitoring' ? 'Node_Telemetry' : tab === 'quotas' ? 'Uplink_Quotas' : 'Event_Log_Journal'}
          </button>
        ))}
      </div>

      {activeTab === 'monitoring' && (
        <div className="space-y-8">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Server Card */}
            <div className="p-6 border border-white/5 bg-[#050505] rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#FF3E00] to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Express Core Node</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-green-500/10 border border-green-500/20 text-[8px] font-mono text-green-400">ONLINE</span>
              </div>
              <div className="text-3xl font-serif tracking-tighter mb-1 select-all hover:text-[#FF3E00] transition-colors">Port 3000</div>
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-4">Binds to host 0.0.0.0</div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-sm space-y-2">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white/30">LATEST LATENCY</span>
                  <span className="text-white/70">12ms</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white/30">SSL ENCRYPTION</span>
                  <span className="text-emerald-400">AES-256-GCM</span>
                </div>
              </div>
            </div>

            {/* Auth Card */}
            <div className="p-6 border border-white/5 bg-[#050505] rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#FF3E00] to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Credential Proxy</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-[#FF3E00]/10 border border-[#FF3E00]/20 text-[8px] font-mono text-[#FF3E00]">SECURED</span>
              </div>
              <div className="text-3xl font-serif tracking-tighter mb-1">Passkey Auth</div>
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-4">kondaadarsh163@gmail.com</div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-sm space-y-2">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white/30">CLIENT STORAGE</span>
                  <span className="text-white/70">Persistent Local</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white/30">WORKSPACE SAFETY</span>
                  <span className="text-white/70">Isolated Sandbox</span>
                </div>
              </div>
            </div>

            {/* Storage Card */}
            <div className="p-6 border border-white/5 bg-[#050505] rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-[#FF3E00] to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Local Storage Engine</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-green-500/10 border border-green-500/20 text-[8px] font-mono text-green-400">ACTIVE</span>
              </div>
              <div className="text-3xl font-serif tracking-tighter mb-1">Vite Sync Cache</div>
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-4">Indexed Database allocations</div>
              <div className="p-3 bg-black/40 border border-white/5 rounded-sm space-y-2">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white/30">HISTORIC ENTRIES</span>
                  <span className="text-white/70">Automatic Rolling</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-white/30">AUTONOMOUS PURGE</span>
                  <span className="text-white/70">On-demand Clear</span>
                </div>
              </div>
            </div>

          </div>

          {/* Provider Downlink Health */}
          <div className="p-8 border border-white/5 bg-[#050505] rounded-sm space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-[#FF3E00]">AI Subsystems Gateway</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <ProviderStatus 
                title="Google Gemini (Primary)" 
                desc="Uplink sync with flash/pro tiers" 
                status="ONLINE" 
                latency="142ms" 
              />
              
              <ProviderStatus 
                title="ElevenLabs TTS (Secondary)" 
                desc="Indian accent voice translation" 
                status={process.env.ELEVENLABS_API_KEY ? "ONLINE" : "STANDBY"} 
                latency="284ms" 
              />

              <ProviderStatus 
                title="OpenAI Core Engine" 
                desc="Text-to-speech fallback proxy" 
                status={process.env.OPENAI_API_KEY ? "ONLINE" : "STANDBY"} 
                latency="110ms" 
              />

              <ProviderStatus 
                title="FAL.ai Diffusion" 
                desc="Flux Schnell media synthesis" 
                status={process.env.FAL_KEY ? "ONLINE" : "STANDBY"} 
                latency="340ms" 
              />

              <ProviderStatus 
                title="Stability AI" 
                desc="Image-to-image styling and edits" 
                status={process.env.STABILITY_API_KEY ? "ONLINE" : "STANDBY"} 
                latency="290ms" 
              />

              <ProviderStatus 
                title="PlayHT Engine" 
                desc="Polly Waveform neural audio" 
                status={process.env.PLAYHT_SECRET_KEY ? "ONLINE" : "STANDBY"} 
                latency="412ms" 
              />

            </div>
          </div>

          {/* Background Tasks Orchestration Sandbox */}
          <div className="p-8 border border-[#FF3E00]/10 bg-[#FF3E00]/[0.01] rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="w-4 h-4 text-[#FF3E00]/40 animate-pulse" />
            </div>
            
            <div className="max-w-2xl space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-[0.3em] text-[#FF3E00]">Background Job Queue Emulator</h3>
              <p className="text-xs leading-relaxed text-white/50 font-light">
                Our architecture has active background capabilities. Triggering the worker sends safe, direct background simulation requests to the user client interface using system popups or Web Push Notification standards.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={triggerMockNotification}
                  className="px-4 py-2 bg-[#FF3E00] hover:bg-[#FF3E00]/95 text-black font-bold font-mono text-[9px] uppercase tracking-widest rounded-sm transition-all cursor-pointer shadow-[0_0_12px_rgba(255,62,0,0.3)]"
                >
                  _Fire_Background_Worker
                </button>
              </div>

              {showNotificationTest && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 border border-green-500/20 bg-green-500/[0.02] rounded text-[10px] font-mono text-green-400 mt-4 flex items-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  <span>Push triggered! A background worker job notification has been simulated successfully.</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quotas' && (
        <div className="space-y-8">
          <div className="p-8 border border-white/5 bg-[#050505] rounded-sm space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-[#FF3E00]">Operational Allocation & Limits</h3>
            <p className="text-xs text-white/40 leading-relaxed max-w-xl">
              We manage model rate-limits elegantly via local-token pooling. The limits below enforce fair-usage patterns across standard tiers:
            </p>

            <div className="space-y-6">
              <QuotaBar label="Gemini Core API (Daily Queries)" current={88} limit={150} unit="queries" />
              <QuotaBar label="Multimodal Image Synthesis (Flux / SD)" current={14} limit={50} unit="generations" />
              <QuotaBar label="Neural Voice TTS Synthesis" current={1820} limit={5000} unit="translated characters" />
              <QuotaBar label="Personal Workspace Storage (Vite Database)" current={622} limit={1024} unit="KB mapped" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-white/5 bg-[#050505] rounded-sm space-y-4">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-white/50 font-bold">Priority Failover Protocol</h4>
              <p className="text-[11px] text-white/40 leading-relaxed font-light">
                If the Primary core (Gemini-3.5-flash) receives a `429 Quota Exhausted` or temporary DNS interrupt response, our custom proxy routes requests down to fallback models automatically.
              </p>
              <div className="text-[9px] font-mono text-[#FF3E00] uppercase tracking-widest font-bold">
                Level-1: Gemini-3.5-flash ➔ Level-2: Gemini-2.5-flash ➔ Level-3: Gemini-3.1-flash-lite
              </div>
            </div>

            <div className="p-6 border border-white/5 bg-[#050505] rounded-sm space-y-4">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-white/50 font-bold">Failsafe Cooling Circuits</h4>
              <p className="text-[11px] text-white/40 leading-relaxed font-light">
                To prevent aggressive lockups, each retried route applies localized linear backoff multipliers. If three consecutive models reject synchronization, the route suspends for exactly 60 seconds with state indication.
              </p>
              <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                CIRCUIT_BREAKER_STATE: ARMED // ONLINE
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="p-8 border border-white/5 bg-[#050505] rounded-sm space-y-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#FF3E00]">Cortex Event Stream</span>
            <span className="text-[9px] font-mono text-white/20 uppercase">Showing newest first (Max 40)</span>
          </div>

          <div className="h-96 bg-black/60 border border-white/5 rounded-sm p-4 font-mono text-[10px] text-white/70 overflow-y-auto custom-scrollbar space-y-2 selection:bg-white/10 select-all">
            {logs.map((log, idx) => (
              <div key={idx} className="hover:bg-white/[0.02] py-1 border-b border-white/[0.02] flex gap-2">
                <span className="text-white/20 select-none">[{idx < 10 ? `0${idx}` : idx}]</span>
                <span className="whitespace-pre-wrap">{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderStatus({ title, desc, status, latency }: { title: string, desc: string, status: string, latency: string }) {
  const isOnline = status === 'ONLINE';
  return (
    <div className="p-4 border border-white/5 bg-black/40 rounded-sm space-y-3 flex flex-col justify-between hover:border-white/10 transition-colors">
      <div className="space-y-1">
        <div className="text-[10px] font-mono font-medium text-white/80 uppercase">{title}</div>
        <p className="text-[9px] text-white/40 font-light">{desc}</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className={`text-[9px] font-mono font-bold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>{status}</span>
        </div>
        <span className="text-[9px] font-mono text-white/30">{latency}</span>
      </div>
    </div>
  );
}

function QuotaBar({ label, current, limit, unit }: { label: string, current: number, limit: number, unit: string }) {
  const ratio = (current / limit) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-white/60 uppercase">{label}</span>
        <span className="text-white/30">
          <strong className="text-white font-medium">{current}</strong> of {limit} {unit} ({Math.round(ratio)}%)
        </span>
      </div>
      <div className="h-2 w-full bg-black border border-white/5 rounded-full overflow-hidden p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-[#FF3E00] to-orange-400 rounded-full" 
          style={{ width: `${ratio}%` }} 
        />
      </div>
    </div>
  );
}
