import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Bot, User, ArrowRight, Mic, X, Volume2, VolumeX, Trash2, Plus, Image as ImageIcon, FileText, Camera, Upload, Save, Download, Share2, Table, RefreshCcw, GitFork, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Message, SavedSession, ProficiencyScore, ThinkingStatus } from '../types';
import { useVoice } from '../hooks/useVoice';

// Extend jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface SelectedFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

interface CommandCenterProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onClearChat: () => void;
  onArchiveChat: () => void;
  isThinking: boolean;
  thinkingStatus: ThinkingStatus;
  recommendations: ProficiencyScore[];
}

export default function CommandCenter({ messages, onSendMessage, onClearChat, onArchiveChat, isThinking, thinkingStatus, recommendations }: CommandCenterProps) {
  const [input, setInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { isListening, startListening, stopListening, speak } = useVoice();

  // Speak new model messages if autoSpeak is on
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && autoSpeak) {
      // Remove markdown before speaking for better TTS
      const plainText = lastMessage.content.replace(/[#*`_]/g, '');
      speak(plainText);
    }
  }, [messages, autoSpeak, speak]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;
    if (isThinking) return;

    // In a real app, we would process selectedFiles here.
    // For now we'll just send the message.
    onSendMessage(input);
    setInput('');
    setSelectedFiles([]);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        onSendMessage(transcript);
        setAutoSpeak(true); // Enable auto-speak if user used voice
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setIsAttachmentMenuOpen(false);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const startCamera = async () => {
    setIsAttachmentMenuOpen(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const url = canvas.toDataURL('image/png');
        setSelectedFiles(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: `capture_${Date.now()}.png`,
          type: 'image/png',
          url
        }]);
        stopCamera();
      }
    }
  };

  const handleSaveSession = () => {
    if (!sessionTitle.trim() || messages.length === 0) return;

    const newSession: SavedSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: sessionTitle || 'Neural Session',
      messages: [...messages],
      timestamp: Date.now()
    };

    const existingHistory = localStorage.getItem('konda_history');
    let history: SavedSession[] = [];
    if (existingHistory) {
      try { history = JSON.parse(existingHistory); } catch (e) { history = []; }
    }
    
    localStorage.setItem('konda_history', JSON.stringify([newSession, ...history]));
    setShowSaveDialog(false);
    setSessionTitle('');
    // Notify memory module
    window.dispatchEvent(new Event('memory-updated'));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFontSize(20);
    doc.text('Konda Neural Transcript', 20, y);
    y += 15;
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
    y += 10;
    
    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'USER' : 'KONDA';
      doc.setFontSize(12);
      doc.setTextColor(msg.role === 'user' ? '#000000' : '#FF3E00');
      
      const splitText = doc.splitTextToSize(`[${role}]: ${msg.content}`, 170);
      
      if (y + (splitText.length * 7) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(splitText, 20, y);
      y += (splitText.length * 7) + 5;
    });
    
    doc.save(`konda_transcript_${Date.now()}.pdf`);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const data = messages.map(msg => ({
      Timestamp: new Date(msg.timestamp).toLocaleString(),
      Role: msg.role === 'user' ? 'User' : 'Konda',
      Content: msg.content
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transcript");
    XLSX.writeFile(wb, `konda_data_${Date.now()}.xlsx`);
    setShowExportMenu(false);
  };

  return (
    <div id="command-center" className="flex flex-col h-full bg-transparent px-10">
      <div className="flex-1 overflow-y-auto py-10 space-y-12" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.length === 0 && selectedFiles.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] sm:text-[240px] font-serif italic opacity-[0.02] pointer-events-none select-none">
                K
              </div>
              
              <div className="z-10 space-y-8">
                <div className="w-16 h-16 rounded-full bg-[#FF3E00]/5 border border-[#FF3E00]/10 flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-[#FF3E00]/40" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl sm:text-4xl font-serif italic tracking-tighter">God-Level Intelligence Active.</h3>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[#FF3E00]/40">System Architect // Ethicist // Decision Scientist</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {recommendations.length > 0 && recommendations.map(rec => (
                    <button 
                      key={rec.id}
                      onClick={() => onSendMessage(`Focus on ${rec.subject} weak points: ${rec.weakPoints.join(', ')}. Provide a deep-dive analysis.`)}
                      className="px-6 py-4 bg-[#FF3E00]/5 border border-[#FF3E00]/20 rounded-sm text-[10px] uppercase tracking-widest hover:border-[#FF3E00]/40 hover:text-[#FF3E00] transition-all text-left leading-relaxed relative overflow-hidden group/rec"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[#FF3E00]">Adaptive Recommendation</span>
                        <Zap className="w-3 h-3 text-[#FF3E00] animate-pulse" />
                      </div>
                      <div className="text-white/60 mb-1">Subject: {rec.subject}</div>
                      <div className="text-white/30 text-[8px]">Weak Points: {rec.weakPoints.join(', ')}</div>
                      <div className="absolute bottom-0 left-0 h-0.5 bg-[#FF3E00]/40 transition-all duration-1000 group-hover/rec:w-full" style={{ width: '30%' }} />
                    </button>
                  ))}
                  {[
                    "Apply Neural Pruning to my current study strategy to eliminate resource deadweight.",
                    "Design an Entropy Shielding protocol for an unpredictable exam environment."
                  ].map(suggestion => (
                    <button 
                      key={suggestion}
                      onClick={() => onSendMessage(suggestion)}
                      className="px-6 py-4 bg-white/[0.02] border border-white/5 rounded-sm text-[10px] uppercase tracking-widest hover:border-[#FF3E00]/40 hover:text-[#FF3E00] transition-all text-left leading-relaxed"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {messages.map((msg) => {
            const isSystemBusy = msg.content.includes('[SYSTEM_BUSY') || msg.content.includes('[INTELLIGENCE_UPLINK_DEGRADED]');
            const isAlert = msg.content.includes('[CONNECTION_LATENCY') || msg.content.includes('[KERNEL_ALERT') || isSystemBusy;
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col gap-3 group px-4",
                  msg.role === 'user' ? "items-end text-right" : "items-start text-left",
                  isAlert && "w-full max-w-2xl mx-auto"
                )}
              >
                <div className="flex items-center gap-3 opacity-20">
                  {msg.role === 'user' ? (
                    <span className="text-[10px] tracking-widest font-mono uppercase">Strategist_Auth</span>
                  ) : (
                    <span className={cn(
                      "text-[10px] tracking-widest font-mono uppercase",
                      isAlert ? (isSystemBusy ? "text-yellow-500" : "text-[#FF3E00]") : "text-[#FF3E00] font-bold"
                    )}>
                      {isAlert ? (isSystemBusy ? "System_Latency" : "System_Alert") : "GOD_LEVEL_INTEL"}
                    </span>
                  )}
                  <div className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="text-[10px] font-mono">
                     {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className={cn(
                  "max-w-[85%] leading-relaxed",
                  msg.role === 'user' 
                    ? "text-xl font-light tracking-tight text-white/90" 
                    : cn(
                        "text-base font-sans text-white/70",
                        isAlert && cn(
                          "p-8 border rounded-lg backdrop-blur-sm shadow-xl",
                          isSystemBusy 
                            ? "bg-yellow-500/5 border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.05)]"
                            : "bg-[#FF3E00]/5 border-[#FF3E00]/20 shadow-[0_0_30px_rgba(255,62,0,0.1)]"
                        )
                      )
                )}>
                  <div className={cn("markdown-body", isAlert && "text-white/80")}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                  {isAlert && (
                    <button
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUserMsg) onSendMessage(lastUserMsg.content);
                      }}
                      className={cn(
                        "mt-6 flex items-center gap-2 px-6 py-2 border text-[10px] font-mono uppercase tracking-widest transition-all rounded-sm",
                        isSystemBusy
                          ? "border-yellow-500/40 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                          : "border-[#FF3E00]/40 text-[#FF3E00] hover:bg-[#FF3E00] hover:text-white"
                      )}
                    >
                      <RefreshCcw className="w-3 h-3" />
                      Retry_Synapse_Sync
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2 items-start px-4 w-full max-w-2xl"
            >
               <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] tracking-[0.4em] font-mono uppercase animate-pulse",
                    thinkingStatus.startsWith('retrying') ? "text-yellow-500" : "text-[#FF3E00]"
                  )}>
                     {thinkingStatus === 'thinking' ? "God_Thinking_Mode: EVOLVING" : 
                      thinkingStatus === 'retrying_1' ? "NEURAL_SATURATION: RETRYING_1 (2.0-FLASH)" :
                      thinkingStatus === 'retrying_2' ? "BANDWIDTH_LOW: RETRYING_2 (FALLBACK_1.5-FLASH)" :
                      thinkingStatus === 'retrying_3' ? "SYNCHRONIZING: RETRYING_3 (STABILIZING)" :
                      thinkingStatus === 'retrying_4' ? "FINAL_LOOP: RETRYING_4 (SYNC_INTENSIVE)" :
                      "God_Thinking_Mode: EVOLVING"}
                  </span>
                  <div className={cn(
                    "h-[1px] flex-1",
                    thinkingStatus.startsWith('retrying') ? "bg-yellow-500/10" : "bg-[#FF3E00]/10"
                  )} />
               </div>
               <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                  {thinkingStatus.startsWith('retrying') 
                    ? "Model high-demand detected. Implementing progressive backoff protocols..."
                    : "Simulating: Strategist | Architect | Psychologist | Ethicist | Innovator"}
               </div>
               <div className="flex space-x-1 mt-2">
                  <div className="h-0.5 w-32 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: [-128, 128] }} 
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} 
                      className={cn(
                        "h-full w-16",
                        thinkingStatus.startsWith('retrying') ? "bg-yellow-500" : "bg-[#FF3E00]"
                      )} 
                    />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="py-8 border-t border-white/5 bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {/* Selected Files Preview */}
          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-3 overflow-hidden"
              >
                {selectedFiles.map(file => (
                  <div key={file.id} className="relative group bg-white/5 border border-white/10 rounded-sm p-2 flex items-center gap-3">
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded-sm grayscale" />
                    ) : (
                      <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#FF3E00]" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-white/60 truncate max-w-[100px]">{file.name}</span>
                      <span className="text-[8px] font-mono text-white/20 uppercase">Queued</span>
                    </div>
                    <button 
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-2 -right-2 bg-[#FF3E00] text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="relative group w-full flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                className={cn(
                  "p-3 border border-white/10 rounded-full transition-all hover:border-[#FF3E00] hover:text-[#FF3E00]",
                  isAttachmentMenuOpen ? "border-[#FF3E00] text-[#FF3E00]" : "text-white/20"
                )}
              >
                <Plus className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isAttachmentMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 w-48 bg-[#0F0F0F] border border-white/10 rounded-lg shadow-2xl p-2 z-[60]"
                  >
                    <button 
                      type="button" 
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-white/60 hover:text-[#FF3E00] transition-all text-xs font-mono tracking-widest uppercase rounded-sm"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Photos
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-white/60 hover:text-[#FF3E00] transition-all text-xs font-mono tracking-widest uppercase rounded-sm"
                    >
                      <FileText className="w-4 h-4" />
                      Documents
                    </button>
                    <button 
                      type="button"
                      onClick={startCamera}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-white/60 hover:text-[#FF3E00] transition-all text-xs font-mono tracking-widest uppercase rounded-sm"
                    >
                      <Camera className="w-4 h-4" />
                      Camera
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 relative">
               <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Koda_Kernel_Input..."}
                disabled={isThinking}
                className="w-full bg-transparent border-b border-white/10 py-2.5 text-2xl font-light focus:outline-none focus:border-[#FF3E00] transition-all placeholder:text-white/10 pr-24"
              />
              <div className="absolute right-0 bottom-4 flex items-center gap-4">
                {isListening && (
                  <div className="flex gap-0.5 items-end h-4 mr-2">
                    {[1,2,3,4].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 16, 4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                        className="w-0.5 bg-[#FF3E00]"
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isListening ? "bg-[#FF3E00]/20 text-[#FF3E00]" : "text-white/20 hover:text-[#FF3E00]"
                  )}
                  title={isListening ? "Stop Listening" : "Voice Input"}
                >
                  {isListening ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="submit"
                  disabled={(!input.trim() && selectedFiles.length === 0) || isThinking}
                  className={cn(
                    "p-2 rounded-full transition-all bg-[#FF3E00]/10 text-[#FF3E00] hover:bg-[#FF3E00] hover:text-white disabled:opacity-20",
                  )}
                  title="Execute Command"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <div className="hidden sm:flex text-[8px] tracking-widest text-[#FF3E00] opacity-40 group-focus-within:opacity-100 transition-opacity">
                  CTRL+ENTER
                </div>
              </div>
            </div>
          </form>

          {/* Hidden inputs */}
          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={(e) => handleFileChange(e, 'image')} 
            accept="image/*" 
            multiple 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileChange(e, 'file')} 
            accept=".pdf,.doc,.docx,.txt" 
            multiple 
            className="hidden" 
          />

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={cn(
                  "flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono uppercase transition-colors",
                  autoSpeak ? "text-[#FF3E00]" : "text-white/20"
                )}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {autoSpeak ? "Voice_Output: ON" : "Voice_Output: OFF"}
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={messages.length === 0}
                  className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono uppercase text-white/20 hover:text-[#FF3E00] transition-colors disabled:opacity-0"
                  title="Export Data Pipeline"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Pipeline</span>
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: -10, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-0 mb-4 w-48 bg-[#0F0F0F] border border-white/10 rounded-lg shadow-2xl p-2 z-[60]"
                    >
                      <button 
                        onClick={exportToPDF}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-white/60 hover:text-[#FF3E00] transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Export_PDF
                      </button>
                      <button 
                        onClick={exportToExcel}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-white/60 hover:text-[#FF3E00] transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm"
                      >
                        <Table className="w-4 h-4" />
                        Export_Excel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => setShowSaveDialog(true)}
                disabled={messages.length === 0}
                className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono uppercase text-white/20 hover:text-[#FF3E00] transition-colors disabled:opacity-0"
                title="Archive Session"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Snapshot</span>
              </button>

              <button 
                onClick={onArchiveChat}
                disabled={messages.length === 0}
                className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono uppercase text-white/20 hover:text-[#FF3E00] transition-colors group relative border border-white/5 px-2 py-1 rounded-sm disabled:opacity-0"
                title="Diverge into New Session"
              >
                <GitFork className="w-4 h-4" />
                <span className="hidden sm:inline">Diverge_Session</span>
              </button>

              <button 
                onClick={() => onSendMessage("ENTROPY_SHIELD: I am experiencing system-wide cognitive stress. Activate God-Level Entropy Shielding and provide a strategic override immediately.")}
                className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono uppercase text-[#FF3E00]/40 hover:text-[#FF3E00] transition-all border border-[#FF3E00]/20 px-3 py-1 rounded-sm hover:bg-[#FF3E00]/10"
                title="Activate Entropy Shield"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Entropy_Shield</span>
              </button>

              <button 
                onClick={onClearChat}
                className="flex items-center gap-2 text-[10px] tracking-[0.2em] font-mono uppercase text-white/20 hover:text-[#FF3E00] transition-colors group relative"
                title="Clear Session History"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear_Cache</span>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#FF3E00] text-white px-2 py-0.5 rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  CMD + K
                </span>
              </button>
              
              <div className="text-[10px] font-mono text-white/10 tracking-widest uppercase">
                Terminal: Ready
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={stopCamera}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 overflow-hidden"
            >
              <div className="aspect-video bg-black flex items-center justify-center relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" />
                <div className="absolute top-0 left-0 p-6 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF3E00] animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-white/40">Neural_Live_Feed</span>
                </div>
              </div>
              <div className="p-8 flex items-center justify-between">
                <button 
                  onClick={stopCamera}
                  className="px-6 py-2 text-[10px] font-mono tracking-widest uppercase text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={captureImage}
                  className="w-16 h-16 rounded-full border-4 border-white/10 flex items-center justify-center hover:border-[#FF3E00] transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white transition-all group-hover:scale-90 group-active:scale-75" />
                </button>
                <div className="w-24" /> {/* Spacer */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowSaveDialog(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 p-8 space-y-6"
            >
              <div>
                <h3 className="text-xl font-serif italic tracking-tighter mb-2">Neural Registry</h3>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Name this archive for recall</p>
              </div>

              <input 
                autoFocus
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Session designation..."
                className="w-full bg-white/5 border-b border-white/10 py-3 text-lg font-light focus:outline-none focus:border-[#FF3E00] transition-all placeholder:text-white/10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveSession();
                  if (e.key === 'Escape') setShowSaveDialog(false);
                }}
              />

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-3 border border-white/5 text-[10px] uppercase tracking-widest text-white/20 hover:text-white hover:border-white/10 transition-all font-mono"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveSession}
                  disabled={!sessionTitle.trim()}
                  className="flex-1 py-3 bg-[#FF3E00] text-black text-[10px] uppercase tracking-widest font-bold hover:bg-[#FF3E00]/80 transition-all font-mono disabled:opacity-50"
                >
                  Commit_Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
