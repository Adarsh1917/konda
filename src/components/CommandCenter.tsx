import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  Bot, User, ArrowRight, Mic, X, Volume2, VolumeX, Trash2, Plus, 
  Image as ImageIcon, FileText, Camera, Upload, Save, Download, 
  Share2, Table, RefreshCcw, GitFork, ShieldCheck, Zap, Copy, 
  Check, Play, Pause, Loader, FileSpreadsheet, GitCommit, Layers, 
  AppWindow, Grid 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Message, SavedSession, ProficiencyScore, ThinkingStatus, FileAttachment, AIModel } from '../types';
import { useVoice } from '../hooks/useVoice';
import { useTTSPlayer } from '../hooks/useTTSPlayer';
import { StreamingMarkdown } from './StreamingMarkdown';
import { useTypingAssistant } from '../hooks/useTypingAssistant';
import InteractiveWorkspace, { WorkspaceFile } from './InteractiveWorkspace';

// Extend jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const modelOptions = [
  { id: 'auto', label: 'Auto Mode', icon: '🧠', desc: 'Dynamic intelligent routing' },
  { id: 'core', label: 'Core', icon: '⚛️', desc: 'Primary reasoning engine' },
  { id: 'sage', label: 'Sage', icon: '🖋️', desc: 'Deep reasoning & wisdom' },
  { id: 'vision', label: 'Vision', icon: '🔮', desc: 'Multimodal analysis' },
  { id: 'swift', label: 'Swift', icon: '⚡', desc: 'Ultra-fast responses' },
  { id: 'forge', label: 'Forge', icon: '💻', desc: 'Coding & architecture' },
  { id: 'canvas', label: 'Canvas', icon: '🎨', desc: 'Image generation & synthesis' },
  { id: 'motion', label: 'Motion', icon: '🎬', desc: 'Video workflows & loops' },
];

interface CommandCenterProps {
  messages: Message[];
  onSendMessage: (content: string, files?: FileAttachment[]) => void;
  onClearChat: () => void;
  onArchiveChat: () => void;
  isThinking: boolean;
  thinkingStatus: ThinkingStatus;
  recommendations: ProficiencyScore[];
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

export default function CommandCenter({ messages, onSendMessage, onClearChat, onArchiveChat, isThinking, thinkingStatus, recommendations, selectedModel, setSelectedModel }: CommandCenterProps) {
  const [input, setInput] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');

  const triggerAssetDownload = (asset: { type: string; title: string; data: any }, format: string) => {
    const title = asset.title || "Konda Generated Asset";
    const data = asset.data;
    if (!data) {
      console.error("No data payload found for asset download");
      return;
    }

    try {
      if (format === "csv" && asset.type === "spreadsheet") {
        const headers = data.headers ? data.headers.join(",") : "";
        const rows = data.rows ? data.rows.map((r: string[]) => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(",")).join("\n") : "";
        const csvContent = "\uFEFF" + `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } 
      else if (format === "xlsx" && asset.type === "spreadsheet") {
        const formatted = [data.headers || [], ...(data.rows || [])];
        const ws = XLSX.utils.aoa_to_sheet(formatted);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
        XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
      }
      else if (format === "pdf" && asset.type === "presentation") {
        const doc = new jsPDF({ orientation: "landscape", format: "a4" });
        const slides = data.slides || [];
        if (slides.length === 0) {
          doc.setFont("Helvetica", "bold");
          doc.text("No Slides to print", 10, 10);
        }
        slides.forEach((slide: any, idx: number) => {
          if (idx > 0) doc.addPage();
          
          doc.setFillColor("#0D0E15");
          doc.rect(0, 0, 297, 210, "F");
          
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor("#FF3E00");
          doc.text("KONDA AI // Slide Presentation System", 15, 15);
          
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor("#666666");
          doc.text(`Slide ${idx + 1} of ${slides.length}`, 260, 15);

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(26);
          doc.setTextColor("#FFFFFF");
          doc.text(slide.title || "Frame Sequence", 20, 60);

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(13);
          doc.setTextColor("#FF3E00");
          doc.text(slide.subtitle || "", 20, 75);

          if (slide.bullets && slide.bullets.length > 0) {
            doc.setFontSize(11);
            doc.setTextColor("#CCCCCC");
            let bulletY = 95;
            slide.bullets.forEach((bullet: string) => {
              doc.text(`• ${bullet}`, 20, bulletY);
              bulletY += 12;
            });
          }

          doc.setLineWidth(0.5);
          doc.setDrawColor("#222222");
          doc.line(15, 195, 282, 195);
          doc.setFontSize(7);
          doc.setTextColor("#444444");
          doc.text("Enterprise Level Multimodal Presentation Layout Block", 15, 201);
        });
        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      }
      else if (format === "pdf" && asset.type === "spreadsheet") {
        const doc = new jsPDF();
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title, 14, 15);
        
        const tableData = data.rows || [];
        (doc as any).autoTable({
          head: [data.headers || []],
          body: tableData,
          startY: 22,
          theme: "striped",
          headStyles: { fillColor: [255, 62, 0] }
        });
        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      }
      else if (format === "txt") {
        let content = `${title}\n${"=".repeat(title.length)}\n\n`;
        if (asset.type === "spreadsheet") {
          content += `${(data.headers || []).join(" | ")}\n`;
          content += `${"-".repeat((data.headers || []).join(" | ").length)}\n`;
          (data.rows || []).forEach((r: string[]) => { content += `${r.join(" | ")}\n`; });
        } else if (asset.type === "code") {
          content += data.code || "";
        } else if (asset.type === "presentation") {
          (data.slides || []).forEach((slide: any, idx: number) => {
            content += `Slide 0${idx + 1}: ${slide.title || ''}\n`;
            content += `Subtitle: ${slide.subtitle || ''}\n`;
            if (slide.bullets) {
              slide.bullets.forEach((b: string) => { content += `* ${b}\n`; });
            }
            content += `\n`;
          });
        }
        const textBlob = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
        const link = document.createElement("a");
        link.setAttribute("href", textBlob);
        link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      else if (format === "svg" && asset.type === "diagram") {
        const nodes = data.nodes || [];
        const edges = data.edges || [];
        let svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" style="background:#050507; font-family:monospace; color:#fff;">`;
        svgText += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#FF3E00"/></marker></defs>`;
        
        edges.forEach((edge: any) => {
          const from = nodes.find((n: any) => n.id === edge.from);
          const to = nodes.find((n: any) => n.id === edge.to);
          if (from && to) {
            const x1 = (from.x || 0) + 80; const y1 = (from.y || 0) + 25;
            const x2 = (to.x || 0) + 80; const y2 = (to.y || 0) + 25;
            svgText += `<path d="M ${x1} ${y1} Q ${(x1+x2)/2} ${(y1+y2)/2 - 30} ${x2} ${y2}" stroke="#FF3E00" stroke-width="1.5" fill="none" marker-end="url(#arrow)" />`;
            svgText += `<text x="${(x1+x2)/2}" y="${(y1+y2)/2 - 14}" fill="#FFA380" font-size="9" text-anchor="middle">${edge.label || ''}</text>`;
          }
        });
        
        nodes.forEach((node: any) => {
          const fill = node.bg || "rgba(255,255,255,0.05)";
          const border = node.border || "#fff";
          const nx = node.x || 100;
          const ny = node.y || 100;
          svgText += `<g><rect x="${nx}" y="${ny}" width="160" height="50" rx="6" fill="${fill}" stroke="${border}" stroke-width="1.5" />`;
          svgText += `<text x="${nx + 80}" y="${ny + 29}" fill="#FFF" font-size="10" font-weight="bold" text-anchor="middle">${node.label || ''}</text></g>`;
        });
        svgText += `</svg>`;
        const svgContent = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
        const link = document.createElement("a");
        link.setAttribute("href", svgContent);
        link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}.svg`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Asset download execution failed, recovering gracefully:", err);
    }
  };
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [focusedWorkspaceFile, setFocusedWorkspaceFile] = useState<WorkspaceFile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse custom structures or standard tables/flows/slides/sandboxes to instantiate Workspace Board Files
  const detectWorkspaceAssets = (content: string) => {
    const assets: Array<{ type: "spreadsheet" | "diagram" | "presentation" | "code"; title: string; data: any }> = [];

    // 1. Check for standard markdown tables
    if (content.includes('|') && content.split('\n').some(line => line.includes('---'))) {
      try {
        const lines = content.split('\n');
        const tableLines = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
        if (tableLines.length >= 2) {
          const headers = tableLines[0].split('|').map(s => s.trim()).filter(s => s !== "");
          const rows = tableLines.slice(2).map(line => 
            line.split('|').map(s => s.trim()).filter((_, colIdx) => colIdx > 0 && colIdx <= headers.length)
          ).filter(row => row.length > 0 && row.some(cell => cell !== ""));
          
          if (headers.length > 0 && rows.length > 0) {
            assets.push({
              type: "spreadsheet",
              title: "Derived Strategic Table",
              data: { headers, rows }
            });
          }
        }
      } catch (e) {
        console.error("Markdown table parsing failed", e);
      }
    }

    // 2. Check for Code blocks
    if (content.includes('```html') || content.includes('```xml') || content.includes('```css') || (content.includes('<!DOCTYPE html>') && content.includes('```'))) {
      const match = content.match(/```(?:html|xml|css)?([\s\S]*?)```/);
      if (match && match[1]) {
        assets.push({
          type: "code",
          title: "Extracted Virtual Application",
          data: { code: match[1].trim() }
        });
      }
    }

    // 3. Systems maps / diagrams checking
    if (content.includes('-->') || content.includes('->') || (content.includes('node') && content.includes('edge'))) {
      assets.push({
        type: "diagram",
        title: "Extracted Architectural Flow",
        data: {
          nodes: [
            { id: "1", label: "User Proxy Request", style: "rounded", x: 80, y: 140, bg: "rgba(255, 62, 0, 0.15)", border: "#FF3E00" },
            { id: "2", label: "Api Gateway Sync", style: "rectangle", x: 280, y: 140, bg: "rgba(59, 130, 246, 0.15)", border: "#3B82F6" },
            { id: "3", label: "Decentralized Database", style: "ellipse", x: 480, y: 140, bg: "rgba(16, 185, 129, 0.15)", border: "#10B981" }
          ],
          edges: [
            { id: "e1", from: "1", to: "2", label: "Process Flow" },
            { id: "e2", from: "2", to: "3", label: "Transaction Lock" }
          ]
        }
      });
    }

    // 4. Slide presentation deck checking
    if (content.match(/Slide\s*\d+/i) || content.match(/Presenter/i) || content.includes('### Slide') || content.includes('**Slide')) {
      assets.push({
        type: "presentation",
        title: "Extracted Slide Deck Sequence",
        data: {
          slides: [
            {
              id: "s1",
              title: "KONDA Dynamic Presentation Core",
              subtitle: "Adaptive Enterprise Solutions",
              bullets: ["Synthesizing multi-level reasoning and logistics workflows.", "Direct download as landscape printable document layout."],
              layout: "title"
            },
            {
              id: "s2",
              title: "Operational Capabilities",
              subtitle: "Performance Metrics & Scale",
              bullets: ["Excel formulations integrated dynamically inside spreadsheets.", "Live sandboxed deployment for client review."],
              layout: "content"
            }
          ]
        }
      });
    }

    return assets;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [completedStreamingIds, setCompletedStreamingIds] = useState<Set<string>>(() => new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, acceptSuggestion, handleKeyDown } = useTypingAssistant(input, setInput, textareaRef);
  const createdUrls = useRef<Set<string>>(new Set());
  const { isListening, startListening, stopListening, speak } = useVoice();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

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
    return () => {
      // Memory cleanup
      createdUrls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const readFileAsAttachment = (file: File): Promise<FileAttachment> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const isTextOrCode = 
        file.type.startsWith('text/') || 
        file.name.endsWith('.js') || 
        file.name.endsWith('.ts') || 
        file.name.endsWith('.tsx') || 
        file.name.endsWith('.jsx') || 
        file.name.endsWith('.py') || 
        file.name.endsWith('.json') || 
        file.name.endsWith('.css') || 
        file.name.endsWith('.html') || 
        file.name.endsWith('.md');

      if (isTextOrCode) {
        reader.onload = (event) => {
          const text = event.target?.result as string;
          resolve({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: file.type || 'text/plain',
            url: URL.createObjectURL(file),
            textContent: text,
            base64: btoa(unescape(encodeURIComponent(text)))
          });
        };
        reader.readAsText(file);
      } else {
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const base64 = result.split(',')[1];
          resolve({
            id: Math.random().toString(36).substring(2, 11),
            name: file.name,
            type: file.type || 'application/octet-stream',
            url: URL.createObjectURL(file),
            base64: base64
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0) return;
    if (isThinking) return;

    onSendMessage(input, selectedFiles);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const attachments: FileAttachment[] = [];
      for (const file of Array.from(files)) {
        const attachment = await readFileAsAttachment(file);
        attachments.push(attachment);
      }
      setSelectedFiles(prev => [...prev, ...attachments]);
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
        const base64 = url.split(',')[1];
        setSelectedFiles(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 11),
          name: `capture_${Date.now()}.png`,
          type: 'image/png',
          url,
          base64: base64
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
    <div className="flex w-full h-full bg-[#050505] overflow-hidden">
      <div 
        id="command-center" 
        className={cn(
          "flex flex-col h-full bg-[#050505] relative transition-all duration-300",
          isWorkspaceOpen ? "hidden lg:flex lg:w-[45%] shrink-0 border-r border-[#FF3E00]/10" : "w-full"
        )}
      >
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-8 scroll-smooth custom-scrollbar" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.length === 0 && selectedFiles.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 relative py-12"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] sm:text-[240px] font-serif italic opacity-[0.02] pointer-events-none select-none">
                K
              </div>
              
              <div className="z-10 space-y-8">
                <div className="w-16 h-16 rounded-full bg-[#FF3E00]/5 border border-[#FF3E00]/10 flex items-center justify-center mx-auto">
                  <Bot className="w-12 h-12 text-[#FF3E00]/40" />
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

          {messages.map((msg, index) => {
            const isSystemBusy = msg.content.includes('[SYSTEM_BUSY') || msg.content.includes('[INTELLIGENCE_UPLINK_DEGRADED]');
            const isAlert = msg.content.includes('[CONNECTION_LATENCY') || msg.content.includes('[KERNEL_ALERT') || isSystemBusy;
            const isLatestMessage = index === messages.length - 1;
            const shouldStream = msg.role === 'assistant' && isLatestMessage && !completedStreamingIds.has(msg.id);

            return (
              <motion.div
                key={`${msg.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col gap-2 group px-2 w-full max-w-4xl mx-auto py-2",
                  msg.role === 'user' ? "items-end text-right" : "items-start text-left"
                )}
              >
                <div className="flex items-center gap-2.5 opacity-20">
                  {msg.role === 'user' ? (
                    <span className="text-[9px] tracking-widest font-mono uppercase">Strategist_Auth</span>
                  ) : (
                    <span className={cn(
                      "text-[9px] tracking-widest font-mono uppercase",
                      isAlert ? (isSystemBusy ? "text-yellow-500" : "text-[#FF3E00]") : "text-[#FF3E00] font-bold"
                    )}>
                      {isAlert ? (isSystemBusy ? "System_Latency" : "System_Alert") : "GOD_LEVEL_INTEL"}
                    </span>
                  )}
                  <div className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="text-[9px] font-mono">
                     {new Date(msg.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className={cn(
                  "max-w-[90%] md:max-w-[92%] leading-relaxed text-sm md:text-base",
                  msg.role === 'user' 
                    ? "text-white/90 bg-white/[0.02] border border-white/5 rounded-2xl rounded-tr-none px-5 py-3 font-light tracking-wide shadow-sm" 
                    : cn(
                        "text-white/80 font-sans w-full",
                        isAlert && cn(
                          "p-6 border rounded-lg backdrop-blur-sm shadow-xl",
                          isSystemBusy 
                            ? "bg-yellow-500/5 border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.05)]"
                            : "bg-[#FF3E00]/5 border-[#FF3E00]/20 shadow-[0_0_30px_rgba(255,62,0,0.1)]"
                        )
                      )
                )}>
                  <div className={cn("markdown-body w-full", isAlert && "text-white/85")}>
                    {msg.role === 'assistant' ? (
                      <StreamingMarkdown 
                        content={msg.content}
                        shouldAnimate={shouldStream}
                        onComplete={() => {
                          setCompletedStreamingIds(prev => {
                            const next = new Set(prev);
                            next.add(msg.id);
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <div className="flex flex-col gap-2">
                        {msg.files && msg.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2 justify-end">
                            {msg.files.map(file => (
                              <div key={file.id} className="bg-white/[0.03] border border-white/5 rounded-md p-1.5 flex items-center gap-2 text-xs text-left">
                                {file.type.startsWith('image/') ? (
                                  <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded-sm grayscale" />
                                ) : (
                                  <FileText className="w-4 h-4 text-[#FF3E00]" />
                                )}
                                <div className="flex flex-col max-w-[120px]">
                                  <span className="text-[10px] text-white/70 truncate">{file.name}</span>
                                  <span className="text-[8px] text-[#FF3E00]/65 uppercase font-mono">{file.type.split('/')[1] || 'FILE'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <StreamingMarkdown content={msg.content} shouldAnimate={false} />
                      </div>
                    )}
                  </div>
                  
                  {msg.role === 'assistant' && !isAlert && (
                    <div className="mt-4 flex flex-col gap-3.5 w-full">
                      {detectWorkspaceAssets(msg.content).map((asset, aIdx) => (
                        <div key={aIdx} className="bg-white/[0.01] border border-white/5 rounded-xl p-4.5 flex flex-col gap-4 text-left shadow-lg">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.04]">
                            <div className="flex items-center gap-3">
                              <div className="p-2 px-2.5 rounded-lg bg-white/5 border border-white/5">
                                {asset.type === 'spreadsheet' && <FileSpreadsheet className="w-5 h-5 text-[#FF3E00]" />}
                                {asset.type === 'diagram' && <GitCommit className="w-5 h-5 text-blue-400" />}
                                {asset.type === 'presentation' && <Layers className="w-5 h-5 text-violet-400" />}
                                {asset.type === 'code' && <AppWindow className="w-5 h-5 text-emerald-400" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-mono font-bold tracking-wide text-white/95">{asset.title}</span>
                                <span className="text-[9px] uppercase tracking-wider text-[#FF3E00] font-mono font-bold">Real-time Executable Artifact</span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => {
                                const newFile: WorkspaceFile = {
                                  id: `file-dyn-${Date.now()}-${aIdx}`,
                                  type: asset.type,
                                  title: asset.title,
                                  timestamp: Date.now(),
                                  data: asset.data
                                };
                                setFocusedWorkspaceFile(newFile);
                                setIsWorkspaceOpen(true);
                              }}
                              className="w-full sm:w-auto px-4 py-2 bg-[#FF3E00]/10 hover:bg-[#FF3E00]/20 text-[#FF3E00] border border-[#FF3E00]/15 hover:border-[#FF3E00]/30 rounded-lg text-[10px] uppercase font-mono tracking-widest font-bold transition-all cursor-pointer text-center"
                            >
                              Explore Workspace Board &rarr;
                            </button>
                          </div>

                          <div className="bg-[#050507]/80 rounded-lg border border-white/[0.03] overflow-hidden p-3.5 text-xs">
                            {asset.type === 'spreadsheet' && asset.data && (
                              <div className="flex flex-col gap-2.5">
                                <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono font-medium">Spreadsheet Data Grid</div>
                                <div className="overflow-x-auto border border-white/5 rounded-md">
                                  <table className="w-full text-left font-mono text-[10px] border-collapse">
                                    <thead>
                                      <tr className="bg-white/[0.02] border-b border-white/5">
                                        {(asset.data.headers || []).slice(0, 5).map((col: string, cIdx: number) => (
                                          <th key={cIdx} className="px-3 py-2 text-white/60 font-bold border-r border-white/5">{col}</th>
                                        ))}
                                        {asset.data.headers && asset.data.headers.length > 5 && (
                                          <th className="px-3 py-2 text-white/30 italic">+{asset.data.headers.length - 5} cols</th>
                                        )}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(asset.data.rows || []).slice(0, 3).map((row: string[], rIdx: number) => (
                                        <tr key={rIdx} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                                          {row.slice(0, 5).map((cell, cIdx) => (
                                            <td key={cIdx} className="px-3 py-2 text-white/85 border-r border-white/[0.02] truncate max-w-[120px]">{cell}</td>
                                          ))}
                                          {row.length > 5 && (
                                            <td className="px-2 py-1 text-white/35 italic">...</td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="text-[9px] font-mono text-white/30">Rendered first {Math.min(3, (asset.data.rows || []).length)} rows of {(asset.data.rows || []).length} lines.</div>
                              </div>
                            )}

                            {asset.type === 'diagram' && asset.data && (
                              <div className="flex flex-col gap-2">
                                <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono font-medium">Flowchart Maps Topology</div>
                                <div className="flex flex-col gap-2 border border-white/5 rounded-md p-2 bg-black/40">
                                  <div className="flex flex-wrap gap-2.5">
                                    {(asset.data.nodes || []).map((node: any, nIdx: number) => (
                                      <span key={nIdx} className="px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-white/80 flex items-center gap-1.5" style={{ borderColor: node.border }}>
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: node.border || '#fff' }} />
                                        {node.label}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-[9px] text-white/40 italic flex items-center gap-1">
                                    <span>Signal pathways:</span>
                                    <span className="text-white/60 font-mono font-sans font-bold">
                                      {(asset.data.edges || []).map((e: any) => e.label || 'link').join(' → ')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {asset.type === 'presentation' && asset.data && (
                              <div className="flex flex-col gap-2.5">
                                <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono font-medium">Landscape Slide Presentation Panels</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {(asset.data.slides || []).slice(0, 2).map((slide: any, sIdx: number) => (
                                    <div key={sIdx} className="p-3 border border-white/5 rounded bg-white/[0.01] flex flex-col gap-1">
                                      <div className="text-[8px] tracking-widest text-[#FF3E00] font-mono font-bold uppercase">SLIDE 0{sIdx+1}</div>
                                      <div className="text-[10.5px] font-bold text-white/95 font-mono truncate">{slide.title}</div>
                                      <div className="text-[8.5px] text-white/45 truncate italic">{slide.subtitle}</div>
                                    </div>
                                  ))}
                                </div>
                                <div className="text-[9px] font-mono text-white/30">Layout prepared for {asset.data.slides?.length || 0} document slides.</div>
                              </div>
                            )}

                            {asset.type === 'code' && asset.data && (
                              <div className="flex flex-col gap-2.5">
                                <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono font-medium">Application Sandbox Source Code</div>
                                <div className="p-2 border border-white/5 rounded bg-black/60 font-mono text-[9.5px] text-[#A6E22E] max-h-24 overflow-y-auto whitespace-pre">
                                  {asset.data.code}
                                </div>
                                <div className="text-[9px] font-mono text-[#FF3E00]/60 font-medium">Fully isolated, client-side preview available.</div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider mr-1.5 select-none font-bold">DOWNLOAD FORMAT:</span>
                            
                            {asset.type === 'spreadsheet' && (
                              <>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'xlsx')}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>EXCEL (.XLSX)</span>
                                </button>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'pdf')}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-00 hover:text-red-350 border border-red-500/20 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF REPORT</span>
                                </button>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'csv')}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>CSV</span>
                                </button>
                              </>
                            )}

                            {asset.type === 'diagram' && (
                              <>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'svg')}
                                  className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>VECTOR GRAPH (.SVG)</span>
                                </button>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'txt')}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PLOTS DATA (TXT)</span>
                                </button>
                              </>
                            )}

                            {asset.type === 'presentation' && (
                              <>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'pdf')}
                                  className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 border border-violet-500/20 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>SLIDES BOOK (.PDF)</span>
                                </button>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'txt')}
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>OUTLINE TXT</span>
                                </button>
                              </>
                            )}

                            {asset.type === 'code' && (
                              <>
                                <button 
                                  onClick={() => triggerAssetDownload(asset, 'txt')}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded text-[9.5px] uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center gap-1 font-bold"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>DOWNLOAD SOURCE (.HTML)</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && !isAlert && (
                    <MessageActionBar 
                      msgId={msg.id}
                      content={msg.content} 
                      selectedModel={selectedModel}
                      isStreaming={shouldStream}
                      onRegenerate={() => {
                        const userMsgs = messages.filter(m => m.role === 'user');
                        if (userMsgs.length > 0) {
                          onSendMessage(userMsgs[userMsgs.length - 1].content);
                        }
                      }}
                    />
                  )}

                  {isAlert && (
                    <button
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUserMsg) onSendMessage(lastUserMsg.content);
                      }}
                      className={cn(
                        "mt-5 flex items-center gap-2 px-5 py-2 border text-[10px] font-mono uppercase tracking-widest transition-all rounded-sm",
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
              className="flex flex-col gap-2 items-start px-4 w-full max-w-4xl mx-auto py-2"
            >
               <div className="flex items-center gap-3 w-full">
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
               <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest">
                  {thinkingStatus.startsWith('retrying') 
                    ? "Model high-demand detected. Implementing progressive backoff protocols..."
                    : "Simulating: Strategist | Architect | Psychologist | Ethicist | Innovator"}
               </div>
               <div className="flex space-x-1 mt-1">
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

      <div className="py-4 border-t border-white/[0.04] bg-[#050507]/95 backdrop-blur-md sticky bottom-0 z-30 px-4 md:px-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
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

          {/* Typing Assistant Suggestions */}
          <AnimatePresence>
            {suggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex flex-wrap gap-2 px-1 py-1 -mt-2 items-center justify-start z-40 bg-[#050507]/60 rounded-lg p-2 border border-white/5 backdrop-blur-md"
              >
                <span className="text-[10px] font-mono text-[#FF3E00]/60 tracking-wider uppercase mr-1">Smart Typing:</span>
                {suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => acceptSuggestion(sug)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-mono rounded-md border transition-all flex items-center gap-1 cursor-pointer",
                      sug.type === 'correction' 
                        ? "bg-[#FF3E00]/10 text-[#FF3E00] border-[#FF3E00]/20 hover:bg-[#FF3E00]/20" 
                        : sug.type === 'prediction'
                        ? "bg-white/[0.03] text-white/70 border-white/10 hover:bg-white/10 hover:border-white/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/25"
                    )}
                  >
                    {sug.display}
                    <span className="text-[9px] opacity-40 ml-1">Tab</span>
                  </button>
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

            <div className="flex-1 relative bg-white/[0.015] hover:bg-white/[0.03] border border-white/10 focus-within:border-[#FF3E00]/40 rounded-xl px-4 py-2.5 transition-all flex items-end gap-3 min-h-[44px]">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={isListening ? "Listening..." : "Type instructions or ask KONDA... (Shift + Enter for new line)"}
                disabled={isThinking}
                className="flex-1 bg-transparent text-sm md:text-base text-white/90 leading-relaxed focus:outline-none placeholder:text-white/20 resize-none max-h-36 min-h-[22px] py-0.5 custom-scrollbar"
              />
              <div className="flex items-center gap-3 shrink-0 pb-0.5">
                {isListening && (
                  <div className="flex gap-0.5 items-end h-4 mr-1">
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
                
                {/* Modern Brain Selector */}
                <div ref={dropdownRef} className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className={cn(
                      "p-2 rounded-full transition-all text-white/30 hover:text-[#FF3E00] hover:bg-white/5 flex items-center justify-center text-sm cursor-pointer",
                      selectedModel !== 'auto' ? "border border-[#FF3E00]/30 bg-[#FF3E00]/5 text-[#FF3E00] font-bold" : ""
                    )}
                    title="Orchestrated AI Model"
                  >
                    🧠
                  </button>

                  <AnimatePresence>
                    {showModelDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: -10, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-3 w-72 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl p-2 z-[60] backdrop-blur-md"
                      >
                        <div className="px-3 py-2 border-b border-white/5 mb-1.5 flex justify-between items-center">
                          <span className="text-[9px] font-mono tracking-widest text-[#FF3E00] uppercase font-bold">Orchestration Core</span>
                          <span className="text-[8px] font-mono text-white/40 uppercase">Active: {selectedModel === 'auto' ? 'Auto’' : selectedModel.toUpperCase()}</span>
                        </div>
                        {modelOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedModel(opt.id as any);
                              setShowModelDropdown(false);
                            }}
                            className={cn(
                              "w-full flex items-start gap-3 p-2 hover:bg-white/5 transition-all text-left rounded-lg group",
                              selectedModel === opt.id ? "bg-white/[0.03] border border-white/5" : "border border-transparent"
                            )}
                          >
                            <span className="text-sm select-none shrink-0">{opt.icon}</span>
                            <div className="flex flex-col min-w-0">
                              <span className={cn(
                                "text-[11px] font-mono tracking-wide transition-colors",
                                selectedModel === opt.id ? "text-[#FF3E00] font-bold" : "text-white/80 group-hover:text-white"
                              )}>
                                {opt.label}
                              </span>
                              <span className="text-[8px] text-white/40 line-clamp-1">{opt.desc}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={handleMicClick}
                  className={cn(
                    "p-2 rounded-full transition-all cursor-pointer",
                    isListening ? "bg-[#FF3E00]/20 text-[#FF3E00]" : "text-white/20 hover:text-[#FF3E00]"
                  )}
                  title={isListening ? "Stop Listening" : "Voice Input"}
                >
                  {isListening ? <X className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="submit"
                  disabled={(!input.trim() && selectedFiles.length === 0) || isThinking}
                  className={cn(
                    "p-2 rounded-full transition-all bg-[#FF3E00]/10 text-[#FF3E00] hover:bg-[#FF3E00] hover:text-white disabled:opacity-20 cursor-pointer",
                  )}
                  title="Execute Command"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <div className="hidden sm:flex text-[8px] tracking-widest text-[#FF3E00] opacity-40 group-focus-within:opacity-100 transition-opacity">
                  ENTER
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
              
              <div className="text-[10px] font-mono text-[#FF3E00]/60 tracking-widest uppercase flex items-center gap-1.5 justify-end">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3E00] animate-pulse"></span>
                Node: {selectedModel === 'auto' ? 'AUTO-ROUTED' : selectedModel.toUpperCase().replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {isWorkspaceOpen && (
        <div className="flex-1 h-full overflow-hidden transition-all duration-300 bg-[#0A0A0C]">
          <InteractiveWorkspace
            initialFile={focusedWorkspaceFile}
            onClose={() => {
              setIsWorkspaceOpen(false);
              setFocusedWorkspaceFile(null);
            }}
            onSendMessage={(msg) => onSendMessage(msg)}
          />
        </div>
      )}

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

function MessageActionBar({ 
  msgId,
  content, 
  selectedModel,
  onRegenerate,
  isStreaming = false
}: { 
  msgId: string;
  content: string; 
  selectedModel?: string;
  onRegenerate?: () => void; 
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const { playingId, isPlaying, isPaused, isLoading, play, stop, engine, voice } = useTTSPlayer();
  const isThisPlaying = playingId === msgId;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
        setShared(true);
      } catch (e) {
        console.log("Web share failed or canceled", e);
      }
    } else {
      try {
        await navigator.clipboard.writeText(content);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getVoiceForModel = (model: string) => {
    switch (model) {
      case "sage":
      case "claude_opus4": return "Zephyr";
      case "core":
      case "gpt55": return "Puck";
      case "forge":
      case "deepseek_coder": return "Charon";
      case "vision":
      case "gemini_pro": return "Kore";
      default: return "Fenrir";
    }
  };

  const handleVoiceToggle = () => {
    const voiceName = getVoiceForModel(selectedModel || 'auto');
    play(msgId, content, voiceName);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] font-mono text-white/30 border-t border-white/[0.03] pt-2 w-full">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        title="Copy response body"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-[#FF3E00]" />
            <span className="text-[#FF3E00]">COPIED</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>COPY</span>
          </>
        )}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        title="Share contents"
      >
        {shared ? (
          <>
            <Check className="w-3 h-3 text-[#FF3E00]" />
            <span className="text-[#FF3E00]">SHARED</span>
          </>
        ) : (
          <>
            <Share2 className="w-3 h-3" />
            <span>SHARE</span>
          </>
        )}
      </button>

      <div className="flex items-center gap-2 border-l border-white/5 pl-4 py-0.5">
        {isThisPlaying && isLoading ? (
          <div className="flex items-center gap-1.5 text-[#FF3E00]/80">
            <Loader className="w-3 h-3 animate-spin" />
            <span>SYNTHESIZING VIBES...</span>
          </div>
        ) : isThisPlaying && isPlaying ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleVoiceToggle}
              className="flex items-center gap-1.5 text-white bg-[#FF3E00]/10 border border-[#FF3E00]/20 px-2 py-0.5 rounded hover:bg-[#FF3E00]/20 transition-all cursor-pointer font-bold"
              title={isPaused ? "Resume Speak" : "Pause Speak"}
            >
              {isPaused ? (
                <>
                  <Play className="w-2.5 h-2.5 text-[#FF3E00]" />
                  <span>RESUME VOICE</span>
                </>
              ) : (
                <>
                  <Pause className="w-2.5 h-2.5 text-white" />
                  <span>PAUSE VOICE</span>
                </>
              )}
            </button>

            <button
              onClick={stop}
              className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer"
              title="Stop playback"
            >
              <VolumeX className="w-3 h-3 text-red-500/80" />
              <span>STOP</span>
            </button>

            <div className="flex items-center gap-0.5 h-2.5 px-1 pr-2 border-r border-white/5 mr-1 bg-black/20 rounded py-1 flex-row">
              {[1, 2, 3, 4, 5].map((bar) => (
                <motion.span
                  key={bar}
                  className="w-0.5 bg-[#FF3E00] rounded-full origin-bottom"
                  initial={{ height: "20%" }}
                  animate={isPaused ? { height: "20%" } : { height: ["20%", "100%", "20%"] }}
                  transition={isPaused ? {} : {
                    duration: 0.6 + bar * 0.1,
                    repeat: Infinity,
                    delay: bar * 0.08,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <span className="text-[9px] text-[#FF3E00]/90 font-bold uppercase tracking-wider animate-pulse font-sans">
              {voice || "Speaking"} ({engine || "AI"})
            </span>
          </div>
        ) : isStreaming ? (
          <div className="flex items-center gap-1.5 text-white/20 select-none cursor-not-allowed font-medium" title="Waiting for streaming to complete">
            <Loader className="w-3 h-3 animate-spin text-white/20" />
            <span>PENDING...</span>
          </div>
        ) : (
          <button
            onClick={handleVoiceToggle}
            className="flex items-center gap-1.5 hover:text-white text-white/50 transition-colors cursor-pointer"
            title="Read assistant response aloud via premium TTS"
          >
            <Volume2 className="w-3 h-3 text-[#FF3E00]" />
            <span>SPEAK</span>
          </button>
        )}
      </div>

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 hover:text-[#FF3E00] transition-colors cursor-pointer border-l border-white/5 pl-4 py-0.5"
          title="Regenerate from parent prompt"
        >
          <RefreshCcw className="w-3 h-3" />
          <span>REGENERATE</span>
        </button>
      )}
    </div>
  );
}
