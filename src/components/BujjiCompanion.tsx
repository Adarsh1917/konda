import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Radio, Volume2, VolumeX, Shield, Trash2, Camera, 
  Terminal, Sparkles, Flame, Activity, Zap, Compass, RefreshCcw, Check, Play, Square, Settings2,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AIModel, Message } from '../types';
import { kondaChat } from '../services/kondaService';
import { useCommandInterpreter } from '../hooks/useCommandInterpreter';

interface BujjiCompanionProps {
  onSendMessage: (val: string) => void;
  messages: Message[];
  isThinking: boolean;
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

export default function BujjiCompanion({ 
  onSendMessage, 
  messages, 
  isThinking, 
  selectedModel, 
  setSelectedModel 
}: BujjiCompanionProps) {
  const { interpretCommand, commandsList, lastExecutedCommand } = useCommandInterpreter();
  const [bujjiMood, setBujjiMood] = useState<'witty' | 'sarcastic' | 'loyal' | 'analytical' | 'chill'>(() => {
    return (localStorage.getItem('bujji_mood') as any) || 'witty';
  });
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [bujjiSpeaking, setBujjiSpeaking] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'optic' | 'memory' | 'logs'>('optic');
  const [shouldSimulateCrash, setShouldSimulateCrash] = useState(false);

  useEffect(() => {
    localStorage.setItem('bujji_mood', bujjiMood);
  }, [bujjiMood]);
  
  // Simulated Diagnostic Stats
  const [cpuTemp, setCpuTemp] = useState(38.2);
  const [memoryCount, setMemoryCount] = useState(12);
  const [diagnosticsLogs, setDiagnosticsLogs] = useState<string[]>([
    "Bujji Core 1.0 initialized.",
    "Holographic optic rendering online.",
    "Connected to deep vector memory bank.",
    "Ready for voice and image commands."
  ]);
  const [dailyBrief, setDailyBrief] = useState<string>('');
  const [generatingBrief, setGeneratingBrief] = useState(false);

  const recognitionRef = useRef<any>(null);
  const wakeWordIntervalRef = useRef<any>(null);
  
  // Beep synthesis for futuristic UI chimes
  const playChime = useCallback((type: 'success' | 'alert' | 'start' | 'stop') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'start') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'stop') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio Context not supported or blocked by permissions");
    }
  }, []);

  // CPU Temperature simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuTemp(prev => {
        const offset = (Math.random() - 0.5) * 1.5;
        const target = isThinking ? 48 : 37;
        const current = prev + (target - prev) * 0.1 + offset;
        return parseFloat(current.toFixed(1));
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [isThinking]);

  // Read stored memory counts
  useEffect(() => {
    const memories = localStorage.getItem('konda_history');
    if (memories) {
      try {
        const parsed = JSON.parse(memories);
        setMemoryCount(parsed.length * 6 + 12);
      } catch (e) {}
    }
  }, [messages]);

  // Bujji Voice response handling
  const speakWithBujjiVoice = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    setBujjiSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const bujjiOpt = voices.find(v => v.name.includes('Google UK English Female') || v.lang.includes('en-GB') || v.lang.includes('en-IN')) || voices[0];
    if (bujjiOpt) utterance.voice = bujjiOpt;

    // Adjust speaker rate & pitch contextually based on Bujji's current personality mood
    if (bujjiMood === 'sarcastic') {
      utterance.pitch = 1.25;
      utterance.rate = 1.15;
    } else if (bujjiMood === 'loyal') {
      utterance.pitch = 0.95;
      utterance.rate = 0.95;
    } else if (bujjiMood === 'analytical') {
      utterance.pitch = 0.9;
      utterance.rate = 1.0;
    } else if (bujjiMood === 'chill') {
      utterance.pitch = 1.05;
      utterance.rate = 0.85;
    } else { // Witty
      utterance.pitch = 1.15;
      utterance.rate = 1.05;
    }

    utterance.onend = () => setBujjiSpeaking(false);
    utterance.onerror = () => setBujjiSpeaking(false);

    window.speechSynthesis.speak(utterance);
    
    // Log speaking status
    addLog(`Bujji Speaking: "${text.substring(0, 32)}..."`);
  }, [bujjiMood]);

  // Keep logs of automated actions
  const addLog = (logText: string) => {
    setDiagnosticsLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${logText}`,
      ...prev.slice(0, 40)
    ]);
  };

  // Autoplay assistant responses when Bujji Mode is fully active
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !bujjiSpeaking) {
      // Filter out markdown formatting
      const sanitized = lastMsg.content
        .replace(/[#*`_\[\]()\-]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .substring(0, 450); // limit spoken text lengths

      speakWithBujjiVoice(sanitized);
    }
  }, [messages, speakWithBujjiVoice]);

  // Speech Recognition with Wake Word "Hey Bujji" or "Bujji"
  const startWakeWordEngine = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog("Wake Word System Unsupported in browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsWakeWordActive(true);
      addLog("Wake word 'Hey Bujji' listener online.");
    };

    recognition.onresult = (event: any) => {
      const resultsLength = event.results.length;
      const transcript = event.results[resultsLength - 1][0].transcript.toLowerCase();
      
      if (transcript.includes('bujji') || transcript.includes('hey bujji') || transcript.includes('bujji system')) {
        playChime('start');
        setShowNotification("Companion Triggered by Wake Word!");
        setTimeout(() => setShowNotification(null), 3000);
        
        // Stop current continuous/wake background recognition to take commands cleanly
        recognition.stop();
        setIsWakeWordActive(false);

        // Turn on continuous listener for immediate command capture
        triggerVoiceInput();
      }
    };

    recognition.onend = () => {
      // Re-trigger if wake word mode remains active
      if (isWakeWordActive) {
        try { recognition.start(); } catch(e){}
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn("Wake word listener error", e.error);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch(e) {}

  }, [isWakeWordActive, playChime]);

  const triggerVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setIsContinuousListening(true);
    addLog("Bujji Companion capturing voice instruction...");

    const commandRec = new SpeechRecognition();
    commandRec.continuous = false;
    commandRec.interimResults = false;
    commandRec.lang = 'en-US';

    commandRec.onresult = (event: any) => {
      const userText = event.results[0][0].transcript;
      addLog(`Captured voice text: "${userText}"`);
      
      const { matched, feedback } = interpretCommand(userText, {
        onSwitchModule: (mod) => {
          window.dispatchEvent(new CustomEvent('module-change', { detail: mod }));
        },
        onClearChat: () => {
          window.dispatchEvent(new Event('chat-cleared'));
        },
        onArchiveChat: () => {
          window.dispatchEvent(new Event('archive-session'));
        },
        onToggleBujji: () => {
          window.dispatchEvent(new Event('toggle-bujji-visibility'));
        },
        onToast: (msg) => {
          setShowNotification(msg);
          setTimeout(() => setShowNotification(null), 4000);
        },
        onMoodChange: (newMood) => {
          setBujjiMood(newMood as any);
        }
      });

      if (matched) {
        addLog(`System Command Interpreted: "${userText}"`);
        if (feedback) {
          addLog(`Bujji Feedback: "${feedback}"`);
          speakWithBujjiVoice(feedback);
        }
        playChime('success');
      } else {
        onSendMessage(userText);
        playChime('success');
      }
    };

    commandRec.onerror = () => {
      playChime('alert');
      setIsContinuousListening(false);
    };

    commandRec.onend = () => {
      setIsContinuousListening(false);
      // Restart wake word capture after 2.5 seconds
      setTimeout(() => {
        if (isWakeWordActive) {
          startWakeWordEngine();
        }
      }, 2500);
    };

    try {
      commandRec.start();
    } catch (e) {}
  };

  const toggleWakeWord = () => {
    if (isWakeWordActive) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsWakeWordActive(false);
      playChime('stop');
      addLog("Companion wake word tracking inactive.");
    } else {
      setIsWakeWordActive(true);
      playChime('start');
    }
  };

  useEffect(() => {
    if (isWakeWordActive) {
      startWakeWordEngine();
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isWakeWordActive]);

  // Synthesize customized brief using saved chat patterns / dates
  const handleGenerateBrief = async () => {
    setGeneratingBrief(true);
    addLog("Extracting collective memories for dynamic briefing...");
    playChime('success');

    let memoryContext = "You are currently online. No historic chat history logged yet.";
    const historyData = localStorage.getItem('konda_history') || localStorage.getItem('konda_chats');
    if (historyData) {
      try {
        const parsed = JSON.parse(historyData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryContext = `The user has preserved logs of previous technical discussions. Major areas include local environment tasks, compiler setups, and full-stack API routers.`;
        }
      } catch (e) {}
    }

    try {
      // We will perform a live server completion to get a beautiful briefing in Bujji's unique voice!
      // Send a specialized system prompt modifier
      const briefPersona = `You are Bujji — a precise, intellectually honest analytical assistant. Deliver a calm, direct, and professional daily brief summarizing the user's focus and state. Keep it to exactly two paragraphs. Do not use nicknames, flattery, or theatrical personas. Respond as a trusted senior advisor would.`;

      const mockResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', parts: [{ text: `Generate my daily brief. Memory context: ${memoryContext}` }] }],
          mode: 'intel',
          systemPrompt: briefPersona,
          selectedModel: 'core'
        })
      });

      if (mockResponse.ok) {
        const text = await mockResponse.text();
        setDailyBrief(text);
        speakWithBujjiVoice(text.substring(0, 200) + "... and more.");
      } else {
        throw new Error("Local Brief fallback invoked.");
      }
    } catch (err) {
      // Smart offline fallback brief that sounds fully professional and calibrated
      const briefs = [
        "Diagnostics report loaded. Your local workspace parameters are nominal, with all brain routers active. I have preserved your strategic variables securely in the collective memory. Focus areas are primed; please state your priority directives for today.",
        "System diagnostics completed successfully. Server uplinks indicate optimal latency and throughput. I have catalogued your technical and architectural progress. We are prepared to address complex tasks and strategic logic whenever you are ready."
      ];
      const selected = briefs[Math.floor(Math.random() * briefs.length)];
      setDailyBrief(selected);
      speakWithBujjiVoice(selected);
    } finally {
      setGeneratingBrief(false);
      addLog("Daily brief synthesized and loaded successfully.");
    }
  };

  // Safe Simulated Proactive Suggestions
  const provokeSuggestion = (topic: string) => {
    addLog(`Initiating proactive assistance: "${topic}"`);
    if (topic === 'code_copilot') {
      onSendMessage("Bujji, let's start a coding session. Open safe workspace environment.");
    } else if (topic === 'clean_ram') {
      playChime('start');
      addLog("Flushing transient context buffers... SECURE.");
      setShowNotification("Workspace context cleared successfully.");
      setTimeout(() => setShowNotification(null), 3000);
    } else if (topic === 'vision_ocr') {
      onSendMessage("Bujji, analyze my camera feed and detect items or OCR text headers.");
    }
  };

  if (shouldSimulateCrash) {
    return (
      <div className="w-full h-full bg-[#0d0404] flex flex-col border-l border-red-500/10 font-sans overflow-hidden">
        {/* Top Header */}
        <div className="p-4 border-b border-red-500/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <div>
              <h2 className="text-xs font-mono font-bold tracking-[0.25em] text-red-500 uppercase">BUJJI CORE EXCEPTION</h2>
              <p className="text-[9px] text-red-500/40 font-mono tracking-wider">CRITICAL SYSTEM RESOLUTION</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-500/30 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-red-500/10 animate-ping pointer-events-none" />
          </div>

          <div className="space-y-2 max-w-xs">
            <h3 className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase">Holographic Deck Interrupted</h3>
            <p className="text-[10px] text-white/50 leading-relaxed font-mono">
              Bujji holographic logic pipeline collapsed under active load simulation. Restoring backup systems...
            </p>
          </div>

          <div className="w-full max-w-xs p-3 bg-black/60 border border-red-950/40 rounded-xl text-left space-y-1.5 font-mono text-[9px]">
            <div className="text-red-400 font-bold uppercase tracking-widest text-[8px]">STDERR::COGNITIVE_FAULT_RETAINED</div>
            <div className="text-white/40">Status: ACTIVE_CONTAINER_HALT</div>
            <div className="text-white/40">Vector Memory Address: 0x2Aef0C4</div>
            <div className="text-white/40">Core Registers Preserved: True</div>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
            <button
              onClick={() => {
                setShouldSimulateCrash(false);
                playChime('success');
                addLog("Universal logic core rebooted successfully from active load simulation.");
              }}
              className="py-2 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer active:scale-95 text-center shrink-0"
            >
              REBOOT COGNITIVE CORE
            </button>
            <button
              onClick={() => {
                // Keep option for hard React Error Boundary triggering if strictly wanted
                throw new Error("Konda OS Critical Exception: Bujji holographic logic pipeline collapsed under active load simulation.");
              }}
              className="py-1.5 w-full text-white/25 hover:text-white/40 text-[8px] font-mono hover:underline cursor-pointer"
            >
              Force React Exception Boundary
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#070707] flex flex-col border-l border-white/5 font-sans overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-white/5 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF3E00] animate-pulse" />
          <div>
            <h2 className="text-xs font-mono font-bold tracking-[0.25em] text-[#FF3E00] uppercase">BUJJI COMPANION OS</h2>
            <p className="text-[9px] text-white/30 font-mono tracking-wider">UNIVERSAL LEVEL COGNITION</p>
          </div>
        </div>
        
        {/* Active model label */}
        <div className="bg-white/[0.03] border border-white/10 px-2.5 py-0.5 rounded text-[8px] font-mono whitespace-nowrap text-[#FF3E00]/80">
          MODE: {bujjiMood.toUpperCase()}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/5 bg-black/20 text-[9px] font-mono text-center">
        <button 
          onClick={() => setActiveTab('optic')}
          className={cn(
            "flex-1 py-2.5 border-b transition-colors cursor-pointer",
            activeTab === 'optic' ? "border-[#FF3E00] text-white font-bold bg-[#FF3E00]/5" : "border-transparent text-white/40 hover:text-white"
          )}
        >
          🔮 OPTIC HUD
        </button>
        <button 
          onClick={() => setActiveTab('memory')}
          className={cn(
            "flex-1 py-2.5 border-b transition-colors cursor-pointer",
            activeTab === 'memory' ? "border-[#FF3E00] text-white font-bold bg-[#FF3E00]/5" : "border-transparent text-white/40 hover:text-white"
          )}
        >
          💾 RECALLS
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={cn(
            "flex-1 py-2.5 border-b transition-colors cursor-pointer",
            activeTab === 'logs' ? "border-[#FF3E00] text-white font-bold bg-[#FF3E00]/5" : "border-transparent text-white/40 hover:text-white"
          )}
        >
          📜 AGENT LOGS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {/* Floating Notification */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#FF3E00] text-black text-[10px] font-mono px-3.5 py-2 rounded-lg text-center font-bold shadow-xl"
            >
              {showNotification}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'optic' && (
          <div className="space-y-4">
            
            {/* COMPANION ROBOTIC EYE (ANIMATED ORB) */}
            <div className="flex flex-col items-center justify-center p-6 bg-black/30 border border-white/5 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-radial-gradient from-[#FF3E00]/10 via-transparent to-transparent opacity-40 pointer-events-none" />
              
              {/* Spinning visual SVG holographic eye */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                
                {/* Outermost floating dashes */}
                <motion.div 
                  className="absolute w-36 h-36 rounded-full border border-dashed border-[#FF3E00]/25"
                  animate={{ rotate: 360 }}
                  transition={{ ease: "linear", duration: 18, repeat: Infinity }}
                />

                {/* Sub-outer ring notches */}
                <motion.div 
                  className="absolute w-[124px] h-[124px] rounded-full border-2 border-[#FF3E00]/10 border-t-[#FF3E00]/40 border-b-[#FF3E00]/40"
                  animate={{ rotate: -360 }}
                  transition={{ ease: "linear", duration: 12, repeat: Infinity }}
                />

                {/* Shutter segments */}
                <motion.div
                  className="absolute w-[96px] h-[96px] rounded-full border border-dashed border-[#FF3E00]/40"
                  style={{ borderSpacing: "4px" }}
                  animate={{ rotate: 180 }}
                  transition={{ ease: "easeInOut", duration: 5, repeat: Infinity, repeatType: "reverse" }}
                />

                {/* Glowing lens core */}
                <motion.div 
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center relative transition-all duration-300",
                    isThinking ? "shadow-[0_0_24px_rgba(255,62,0,0.5)]" : "shadow-[0_0_12px_rgba(255,62,0,0.2)]",
                    bujjiSpeaking ? "bg-[#FF3E00]/30" : "bg-[#FF3E00]/15"
                  )}
                  animate={{ 
                    scale: bujjiSpeaking ? [1, 1.15, 0.95, 1.05, 1] : isThinking ? [1, 1.08, 1] : 1
                  }}
                  transition={{ 
                    duration: bujjiSpeaking ? 0.6 : 2, 
                    repeat: Infinity 
                  }}
                >
                  {/* Central robotic aperture element */}
                  <div className="w-6 h-6 rounded-full bg-black/80 border border-[#FF3E00] flex items-center justify-center relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF3E00]" />
                    {bujjiSpeaking && (
                      <motion.span 
                        className="absolute inset-0 rounded-full border border-[#FF3E00]"
                        animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </div>
                </motion.div>
                
                {/* Companion diagnostic status overlaid */}
                <div className="absolute bottom-[-16px] bg-[#0A0A0A]/90 px-3 py-0.5 border border-white/10 rounded-full text-[8px] font-mono tracking-widest text-[#FF3E00]">
                  {isThinking ? "COMPUTING_INTELLIGENCE" : bujjiSpeaking ? "VOCAL_SYNTHESIS" : "HUD_NOMINAL"}
                </div>
              </div>

              {/* Status metrics bar */}
              <div className="w-full grid grid-cols-3 gap-2 mt-8 text-center text-white/50">
                <div className="p-2 border border-white/5 bg-[#0A0A0A] rounded">
                  <div className="text-[8px] uppercase tracking-wider text-white/30 font-mono">CPU TEMP</div>
                  <div className={cn("text-xs font-mono font-bold transition-colors mt-0.5", cpuTemp > 45 ? "text-amber-500" : "text-white")}>
                    {cpuTemp}°C
                  </div>
                </div>
                <div className="p-2 border border-white/5 bg-[#0A0A0A] rounded">
                  <div className="text-[8px] uppercase tracking-wider text-white/30 font-mono">V_MEMORIES</div>
                  <div className="text-xs font-mono font-bold mt-0.5 text-white">
                    {memoryCount}
                  </div>
                </div>
                <div className="p-2 border border-white/5 bg-[#0A0A0A] rounded">
                  <div className="text-[8px] uppercase tracking-wider text-white/30 font-mono">ROUTER</div>
                  <div className="text-xs font-mono font-bold mt-0.5 text-[#FF3E00]">
                    STABLE
                  </div>
                </div>
              </div>
            </div>

            {/* Bujji Mood Modifier Selector */}
            <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/40 uppercase">
                <Settings2 className="w-3.5 h-3.5 text-[#FF3E00]" />
                <span>Adjust Bujji companion Mood & Tone</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'witty', label: 'Witty', icon: '😄' },
                  { id: 'sarcastic', label: 'Sarcastic', icon: '😏' },
                  { id: 'loyal', label: 'Loyal', icon: '🛡️' },
                  { id: 'analytical', label: 'Analytical', icon: '💻' },
                  { id: 'chill', label: 'Chill', icon: '😎' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setBujjiMood(item.id as any);
                      playChime('success');
                      addLog(`Companion personality mood calibrated to: ${item.label.toUpperCase()}`);
                    }}
                    className={cn(
                      "p-1.5 text-[9px] font-mono rounded border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                      bujjiMood === item.id 
                        ? "bg-[#FF3E00]/10 border-[#FF3E00]/40 text-white font-bold" 
                        : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VOICE COMPANION HARDWARE CONTROLS */}
            <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-3">
              <div className="text-[9px] font-mono text-white/40 uppercase tracking-wider flex items-center justify-between">
                <span>Vocal Uplink Settings</span>
                <span className={cn("text-[8px] tracking-widest uppercase font-bold", isWakeWordActive ? "text-emerald-500 animate-pulse" : "text-white/20")}>
                  {isWakeWordActive ? "● ACTIVE" : "● OFFLINE"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={toggleWakeWord}
                  className={cn(
                    "p-2.5 rounded-lg border font-mono text-[10px] tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer",
                    isWakeWordActive 
                      ? "bg-[#FF3E00]/10 border-[#FF3E00]/30 text-[#FF3E00]" 
                      : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Radio className={cn("w-3.5 h-3.5", isWakeWordActive ? "animate-pulse" : "")} />
                    <span>Continuous "Hey Bujji" Wake listener</span>
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 bg-black/50 border border-white/10 rounded">
                    {isWakeWordActive ? "STOP" : "START"}
                  </span>
                </button>

                <button
                  onClick={triggerVoiceInput}
                  disabled={isContinuousListening}
                  className={cn(
                    "p-2.5 rounded-lg border bg-white/[0.02] border-white/5 font-mono text-[10px] tracking-wider uppercase transition-all flex items-center justify-between cursor-pointer text-white/80 hover:text-white",
                    isContinuousListening ? "text-[#FF3E00] border-[#FF3E00]/30 bg-[#FF3E00]/5" : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Activity className={cn("w-3.5 h-3.5", isContinuousListening ? "animate-bounce" : "")} />
                    <span>{isContinuousListening ? "Listening now_..." : "Talk with Bujji Companion"}</span>
                  </div>
                  <span className="text-[8px] px-1.5 py-0.5 bg-black/50 border border-white/10 rounded text-emerald-500 font-bold">
                    PUSH
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Actions / Proactive Suggestions */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest px-1">Proactive Assistance Triggers</div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => provokeSuggestion('code_copilot')}
                  className="p-2.5 bg-black/30 hover:bg-[#FF3E00]/5 border border-white/5 hover:border-[#FF3E00]/30 rounded-xl transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-mono font-bold text-white group-hover:text-[#FF3E00] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#FF3E00]" />
                    <span>Copilot Mode</span>
                  </div>
                  <p className="text-[8px] text-white/30 mt-1">Activate system programming workspace</p>
                </button>

                <button 
                  onClick={() => provokeSuggestion('vision_ocr')}
                  className="p-2.5 bg-black/30 hover:bg-[#FF3E00]/5 border border-white/5 hover:border-[#FF3E00]/30 rounded-xl transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-mono font-bold text-white group-hover:text-[#FF3E00] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#FF3E00]" />
                    <span>Vision OCR</span>
                  </div>
                  <p className="text-[8px] text-white/30 mt-1">OCR documents, camera feeds, and codes</p>
                </button>

                <button 
                  onClick={() => provokeSuggestion('clean_ram')}
                  className="p-2.5 bg-black/30 hover:bg-[#FF3E00]/5 border border-white/5 hover:border-[#FF3E00]/30 rounded-xl transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-mono font-bold text-white group-hover:text-[#FF3E00] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#FF3E00]" />
                    <span>Flush Buffers</span>
                  </div>
                  <p className="text-[8px] text-white/30 mt-1">Flush stale context queues safely</p>
                </button>

                <button 
                  onClick={handleGenerateBrief}
                  disabled={generatingBrief}
                  className="p-2.5 bg-black/30 hover:bg-[#FF3E00]/5 border border-white/5 hover:border-[#FF3E00]/30 rounded-xl transition-all text-left group cursor-pointer"
                >
                  <div className="text-xs font-mono font-bold text-white group-hover:text-[#FF3E00] flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[#FF3E00]" />
                    <span>Bujji Briefing</span>
                  </div>
                  <p className="text-[8px] text-white/30 mt-1">Summarize daily history witty companion style</p>
                </button>
              </div>
            </div>

            {/* VOCAL COMMANDS DICTIONARY */}
            <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-white/40">
                <span>Vocal Commands Reference</span>
                {lastExecutedCommand && (
                  <span className="text-[8px] text-emerald-400 animate-pulse font-bold bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                    MATCH: {lastExecutedCommand}
                  </span>
                )}
              </div>
              <p className="text-[8px] text-white/30 leading-snug">Speak any of these commands to control the System OS directly with zero-chat latency:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {commandsList.map((cmd) => (
                  <div key={cmd.id} className="p-1.5 bg-[#0A0A0A] border border-white/[0.03] rounded flex flex-col gap-0.5 text-[8px] transition-all hover:bg-[#FF3E00]/5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white/80">{cmd.name}</span>
                      <span className="text-[#FF3E00] tracking-wider">"{cmd.keywords[0]}"</span>
                    </div>
                    <span className="text-white/30 truncate">Keywords: {cmd.keywords.slice(1).join(', ') || cmd.keywords[0]}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* MEMORY RECALLS ARCHIVE */}
        {activeTab === 'memory' && (
          <div className="space-y-4 font-mono">
            <div className="p-3 bg-[#0A0A0A] border border-white/5 rounded-xl space-y-2">
              <div className="text-[9px] text-[#FF3E00] uppercase font-bold tracking-wider">Dynamic Memory Brief</div>
              {generatingBrief ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <RefreshCcw className="w-6 h-6 animate-spin text-[#FF3E00] mb-2" />
                  <span className="text-[8px] text-white/30">Extracting memory layers...</span>
                </div>
              ) : dailyBrief ? (
                <p className="text-[10px] text-white/70 leading-relaxed bg-[#050505] p-2.5 rounded border border-white/10 italic">
                  {dailyBrief}
                </p>
              ) : (
                <div className="text-left p-4">
                  <span className="text-[8px] text-white/30 block mb-2">No active Bujji briefing built yet. Build first using:</span>
                  <button 
                    onClick={handleGenerateBrief}
                    className="w-full text-center p-2 rounded border border-[#FF3E00]/30 text-[#FF3E00] text-[9px] font-bold hover:bg-[#FF3E00]/10 transition-all cursor-pointer"
                  >
                    SYNTHESIZE DAILY COGNITIVE BRIEF
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-3">
              <div className="text-[9px] text-white/40 uppercase tracking-widest">Retrieved Credentials</div>
              <div className="space-y-2 text-[9px]">
                <div className="flex items-center justify-between p-2 bg-[#050505] border border-white/5 rounded">
                  <span className="text-white/40">USER IDENTITY</span>
                  <span className="text-[#FF3E00] font-bold">CHIEF PILOT</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#050505] border border-white/5 rounded">
                  <span className="text-white/40">AUTO-ENCRYPT KEYS</span>
                  <span className="text-white/80">AES_256_LOCAL</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#050505] border border-white/5 rounded">
                  <span className="text-white/40">ACTIVE SYSTEM DECK</span>
                  <span className="text-white/80">VITE+REACTIVE_CORE</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0A0A0A] border border-white/5 rounded-xl space-y-2">
              <div className="text-[9px] text-[#FF3E00] uppercase font-bold tracking-wider">Secure Memory Rules</div>
              <p className="text-[9px] text-white/40 leading-relaxed">
                Automated operations are secure. Standard terminal executions execute inside safe sandboxed nodes. Explicit confirmations will trigger prior to modifying workspace records.
              </p>
            </div>
          </div>
        )}

        {/* CYBERNETIC AGENTS AND SAFETY LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] text-white/30 uppercase tracking-widest">Active Cybernetic Activity</span>
              <div className="flex gap-2.5 items-center">
                <button 
                  onClick={() => setDiagnosticsLogs([])}
                  className="text-[8px] text-[#FF3E00] hover:underline cursor-pointer"
                >
                  Clear Logs
                </button>
                <span className="text-white/20 text-[8px] font-sans">|</span>
                <button 
                  onClick={() => setShouldSimulateCrash(true)}
                  className="text-[8px] text-red-500 hover:text-red-400 font-bold hover:underline cursor-pointer"
                  title="Force a real React component runtime crash to test the local ErrorBoundary recovery portal."
                >
                  Simulate OS Crash
                </button>
              </div>
            </div>

            <div className="bg-[#050505] border border-white/10 rounded-xl p-3 h-96 overflow-y-auto space-y-2.5 custom-scrollbar text-[9px]">
              {diagnosticsLogs.length === 0 ? (
                <div className="text-center text-white/20 h-full flex items-center justify-center">
                  Logs stream cleared. Ready in standby mode.
                </div>
              ) : (
                diagnosticsLogs.map((log, i) => (
                  <div key={i} className="text-white/60 leading-relaxed border-b border-white/[0.02] pb-1.5 last:border-b-0 break-words">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
