import React, { useState, useEffect, useRef } from "react";
import { 
  X, Download, FileText, Table as TableIcon, BarChart2, GitCommit, FilePlay, 
  Settings, Save, Plus, Trash2, Edit2, Play, ChevronLeft, ChevronRight, 
  RotateCcw, Sliders, Type, Grid, FileSpreadsheet, Layers, AppWindow, 
  Search, Bold, Italic, Sparkles, AlertCircle, ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { triggerSystemNotification } from "../utils/notificationHelper";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter
} from "recharts";
import { cn } from "../lib/utils";

// Types for elements
export interface WorkspaceFile {
  id: string;
  type: "spreadsheet" | "chart" | "diagram" | "presentation" | "creative" | "code";
  title: string;
  data: any;
  timestamp: number;
}

interface InteractiveWorkspaceProps {
  onClose: () => void;
  initialFile?: WorkspaceFile | null;
  onSendMessage?: (msg: string) => void;
}

export default function InteractiveWorkspace({ onClose, initialFile, onSendMessage }: InteractiveWorkspaceProps) {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    setIsChartReady(true);
    const saved = localStorage.getItem("konda_workspace_files");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFiles(parsed);
          setActiveFileId(initialFile?.id || parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse workspace files from storage");
      }
    }

    // Default seed files
    const defaultFiles: WorkspaceFile[] = [
      {
        id: "default-sheet",
        type: "spreadsheet",
        title: "Q3 Project Financial Analytics",
        timestamp: Date.now(),
        data: {
          headers: ["Project Phase", "Allocated CapEx", "Operational Spend", "Strategic Backup", "Target Margin (%)", "Allocated Total"],
          rows: [
            ["Neural Architect Base", "150000", "42000", "15000", "85", "=SUM(B1:D1)"],
            ["Uplink Protocol Sync", "220000", "55000", "30000", "78", "=SUM(B2:D2)"],
            ["Entropy Shields Phase B", "180000", "38000", "25000", "92", "=SUM(B3:D3)"],
            ["Multimodal Canvas Core", "310000", "72000", "50000", "65", "=SUM(B4:D4)"]
          ]
        }
      },
      {
        id: "default-diagram",
        type: "diagram",
        title: "Distributed Pipeline Architecture",
        timestamp: Date.now() - 10000,
        data: {
          nodes: [
            { id: "1", label: "Neural Web Client", style: "rounded", x: 60, y: 120, bg: "rgba(255, 62, 0, 0.15)", border: "#FF3E00" },
            { id: "2", label: "Cortex API Gateway", style: "rectangle", x: 260, y: 120, bg: "rgba(255, 255, 255, 0.05)", border: "#444" },
            { id: "3", label: "Auth Validator Synapse", style: "diamond", x: 460, y: 40, bg: "rgba(59, 130, 246, 0.15)", border: "#3B82F6" },
            { id: "4", label: "Transactional DB Uplink", style: "ellipse", x: 460, y: 200, bg: "rgba(16, 185, 129, 0.15)", border: "#10B981" },
            { id: "5", label: "Distributed Storage Cell", style: "rectangle", x: 680, y: 120, bg: "rgba(139, 92, 246, 0.15)", border: "#8B5CF6" }
          ],
          edges: [
            { id: "e1", from: "1", to: "2", label: "HTTPS / TLS" },
            { id: "e2", from: "2", to: "3", label: "gRPC Authorize" },
            { id: "e3", from: "2", to: "4", label: "Write Ops" },
            { id: "e4", from: "3", to: "5", label: "Cache Sync" },
            { id: "e5", from: "4", to: "5", label: "Cold Sync" }
          ]
        }
      },
      {
        id: "default-presentation",
        type: "presentation",
        title: "Enterprise Strategy Deck",
        timestamp: Date.now() - 20000,
        data: {
          slides: [
            {
              id: "s1",
              title: "KONDA Productivity Platform",
              subtitle: "Master Universal Workspace Solutions",
              bullets: ["Introducing high-density data sheets, smart charts, and diagram builders in a single workspace.", "Engineered for executive decision pathways and complex technical logic.", "Dynamic fallback models ensuring seamless continuity."],
              layout: "title"
            },
            {
              id: "s2",
              title: "System Capability Grid",
              subtitle: "Modular High-Performance Benchmarks",
              bullets: ["Advanced multi-axis layout generators representing systems flows.", "Excel computational cell layers including safe auto-formula parsing.", "Immediate presentation decks ready for live client-side PDF export."],
              layout: "content"
            }
          ]
        }
      },
      {
        id: "default-code",
        type: "code",
        title: "Interactive Canvas Art Component",
        timestamp: Date.now() - 30000,
        data: {
          code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Cortex Ambient Visualizer</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background: #030305;
            color: #fff;
            font-family: monospace;
        }
        canvas {
            display: block;
        }
        #info {
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(0,0,0,0.6);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
            border: 1px border rgba(255,62,0,0.2);
            pointer-events: none;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div id="info">Neural Grid Active // Touch to Ripples</div>
    <canvas id="ambient-canvas"></canvas>

    <script>
        const canvas = document.getElementById('ambient-canvas');
        const ctx = canvas.getContext('2d');
        let points = [];
        const maxPoints = 140;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor(x, y) {
                this.x = x || Math.random() * canvas.width;
                this.y = y || Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.radius = Math.random() * 2 + 1;
                this.color = Math.random() > 0.5 ? 'rgba(255, 62, 0, 0.6)' : 'rgba(255, 255, 255, 0.4)';
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if(this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if(this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            }
        }

        for(let i=0; i<maxPoints; i++) {
            points.push(new Particle());
        }

        window.addEventListener('click', (e) => {
            for(let i=0; i<8; i++) {
                points.push(new Particle(e.clientX, e.clientY));
                if(points.length > maxPoints + 30) points.shift();
            }
        });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(3, 3, 5, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Connect lines
            for(let i=0; i<points.length; i++) {
                const pi = points[i];
                pi.update();
                pi.draw();

                for(let j=i+1; j<points.length; j++) {
                    const pj = points[j];
                    const dist = Math.hypot(pi.x - pj.x, pi.y - pj.y);
                    if(dist < 90) {
                        ctx.beginPath();
                        ctx.moveTo(pi.x, pi.y);
                        ctx.lineTo(pj.x, pj.y);
                        ctx.strokeStyle = \`rgba(255, 62, 0, \${1 - dist/90 * 0.45})\`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }
        animate();
    </script>
</body>
</html>`
        }
      }
    ];

    setFiles(defaultFiles);
    setActiveFileId(initialFile?.id || defaultFiles[0].id);
    localStorage.setItem("konda_workspace_files", JSON.stringify(defaultFiles));
  }, []);

  // Save changes locally
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem("konda_workspace_files", JSON.stringify(files));
    }
  }, [files]);

  // Handle setting a file specifically if passed from parent
  useEffect(() => {
    if (initialFile) {
      setFiles(prev => {
        const index = prev.findIndex(f => f.id === initialFile.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = initialFile;
          return updated;
        } else {
          return [initialFile, ...prev];
        }
      });
      setActiveFileId(initialFile.id);
    }
  }, [initialFile]);

  const activeFile = files.find(f => f.id === activeFileId);

  const updateActiveFileData = (newData: any) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, data: newData, timestamp: Date.now() } : f));
  };

  const createNewFile = (type: WorkspaceFile["type"]) => {
    const id = `file-${Date.now()}`;
    let name = `Untitled ${type.toUpperCase()}`;
    let data: any = {};

    if (type === "spreadsheet") {
      name = "Strategic Budget Sheets";
      data = {
        headers: ["Division Item", "Unit Cost", "Quantity", "Operational Slack", "Markup Factor", "Integrated Total"],
        rows: [
          ["Enterprise Platform Nodes", "2400", "5", "500", "1.25", "=SUM(B1:D1)*E1"],
          ["AI Model Fine-tuning Sync", "12000", "1", "1500", "1.10", "=SUM(B2:D2)*E2"],
          ["Strategic Workspace Buffer", "4500", "2", "300", "1.15", "=SUM(B3:D3)*E3"]
        ]
      };
    } else if (type === "diagram") {
      name = "Global Infrastructure Node Map";
      data = {
        nodes: [
          { id: "1", label: "User Session Proxy", style: "rounded", x: 100, y: 150, bg: "rgba(255, 255, 255, 0.05)", border: "#fff" },
          { id: "2", label: "Regional Balancing Core", style: "diamond", x: 300, y: 150, bg: "rgba(255, 62, 0, 0.15)", border: "#FF3E00" },
          { id: "3", label: "Compute VM Array", style: "rectangle", x: 500, y: 150, bg: "rgba(59, 130, 246, 0.15)", border: "#3B82F6" }
        ],
        edges: [
          { id: "e1", from: "1", to: "2", label: "Route" },
          { id: "e2", from: "2", to: "3", label: "Compute" }
        ]
      };
    } else if (type === "presentation") {
      name = "Enterprise Roadmap Presentation";
      data = {
        slides: [
          {
            id: "s1",
            title: "KONDA Workspace Ecosystem",
            subtitle: "Strategic Real-time Management",
            bullets: [
              "Consolidating spreadsheets, architecture mapping, and document generation.",
              "Designed for multi-device scalability."
            ],
            layout: "title"
          }
        ]
      };
    } else if (type === "code") {
      name = "Universal Vector Clock Widget";
      data = {
        code: `<!DOCTYPE html>
<html>
<head>
<style>
  body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
  h1 { font-size: 5rem; font-weight: 300; font-variant-numeric: tabular-nums; letter-spacing: 0.05em; text-shadow: 0 0 20px rgba(255,62,0,0.5); }
</style>
</head>
<body>
  <h1 id="clock">00:00:00</h1>
  <script>
    setInterval(() => {
      document.getElementById('clock').innerText = new Date().toLocaleTimeString('en-US', { hour12: false });
    }, 1000);
  </script>
</body>
</html>`
      };
    }

    const newFile: WorkspaceFile = {
      id,
      type,
      title: name,
      timestamp: Date.now(),
      data
    };

    setFiles(prev => [newFile, ...prev]);
    setActiveFileId(id);
  };

  const deleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) {
      const remaining = files.filter(f => f.id !== id);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  return (
    <div id="workspace-layout" className="flex h-full bg-[#0A0A0C] text-white border-l border-white/5 overflow-hidden">
      {/* Workspace Files Sidebar */}
      <div className="w-64 border-r border-white/5 bg-[#070709] flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[#FF3E00] font-bold text-xs font-mono">CORTEX</span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/50">WORKSPACE</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white cursor-pointer" title="Close Workspace">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Creators */}
        <div className="p-3 border-b border-white/5 bg-black/20">
          <div className="text-[9px] uppercase font-mono tracking-wider text-white/30 mb-2">Instantiate Project Core</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button 
              onClick={() => createNewFile("spreadsheet")}
              className="px-2 py-1.5 bg-white/5 hover:bg-[#FF3E00]/10 hover:text-[#FF3E00] border border-white/5 hover:border-[#FF3E00]/20 rounded text-[9px] font-mono uppercase transition-all text-left flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Sheet
            </button>
            <button 
              onClick={() => createNewFile("diagram")}
              className="px-2 py-1.5 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 border border-white/5 hover:border-blue-500/20 rounded text-[9px] font-mono uppercase transition-all text-left flex items-center gap-1 cursor-pointer"
            >
              <GitCommit className="w-3.5 h-3.5" />
              Map
            </button>
            <button 
              onClick={() => createNewFile("presentation")}
              className="px-2 py-1.5 bg-white/5 hover:bg-violet-500/10 hover:text-violet-400 border border-white/5 hover:border-violet-500/20 rounded text-[9px] font-mono uppercase transition-all text-left flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              Slides
            </button>
            <button 
              onClick={() => createNewFile("code")}
              className="px-2 py-1.5 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 rounded text-[9px] font-mono uppercase transition-all text-left flex items-center gap-1 cursor-pointer"
            >
              <AppWindow className="w-3.5 h-3.5" />
              Code
            </button>
          </div>
        </div>

        {/* File Registry List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {files.map((f) => {
            const isActive = f.id === activeFileId;
            return (
              <div
                key={f.id}
                onClick={() => setActiveFileId(f.id)}
                className={cn(
                  "p-2.5 rounded-md hover:bg-white/[0.03] transition-all cursor-pointer group flex items-center justify-between",
                  isActive ? "bg-white/[0.04] border border-white/10" : "border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {f.type === "spreadsheet" && <FileSpreadsheet className="w-4 h-4 text-[#FF3E00]" />}
                  {f.type === "diagram" && <GitCommit className="w-4 h-4 text-blue-400" />}
                  {f.type === "presentation" && <Layers className="w-4 h-4 text-violet-400" />}
                  {f.type === "code" && <AppWindow className="w-4 h-4 text-emerald-400" />}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-mono tracking-wide text-white/90 truncate">{f.title}</span>
                    <span className="text-[8px] uppercase tracking-wider text-white/30 font-mono scale-95 origin-left">
                      {f.type} // {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => deleteFile(f.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-white/40 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {files.length === 0 && (
            <div className="text-center py-12 text-white/20 text-xs font-mono">
              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-white/10" />
              Empty Platform Canvas
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Workspace Window */}
      <div className="flex-1 flex flex-col h-full bg-[#050507] overflow-hidden">
        {activeFile ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header / Meta bar */}
            <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-[#070709]">
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={activeFile.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, title: newTitle } : f));
                  }}
                  className="bg-transparent border-b border-transparent focus:border-[#FF3E00] hover:border-white/10 px-1 text-sm font-mono tracking-wide text-white focus:outline-none transition-all"
                />
                <span className="inline-block bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[8px] uppercase font-mono text-white/40 tracking-widest">
                  Live System Node
                </span>
              </div>

              {/* General Control Action Panel */}
              <div className="flex items-center gap-2">
                {onSendMessage && (
                  <button 
                    onClick={() => {
                      onSendMessage(`Review and enhance my active platform document "${activeFile.title}" (ID: ${activeFile.id}), then output suggested optimizations or modifications.`);
                    }}
                    className="px-3 py-1.5 bg-[#FF3E00]/10 hover:bg-[#FF3E00]/20 text-[#FF3E00] border border-[#FF3E00]/20 rounded text-[10px] font-mono uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    System Analysis
                  </button>
                )}
                <Exporter file={activeFile} />
              </div>
            </div>

            {/* View Switching Component Nodes */}
            <div className="flex-1 overflow-hidden relative">
              {activeFile.type === "spreadsheet" && (
                <SpreadsheetView 
                  data={activeFile.data} 
                  onChange={updateActiveFileData} 
                />
              )}
              {activeFile.type === "diagram" && (
                <DiagramView 
                  data={activeFile.data} 
                  onChange={updateActiveFileData} 
                />
              )}
              {activeFile.type === "presentation" && (
                <PresentationView 
                  data={activeFile.data} 
                  onChange={updateActiveFileData} 
                />
              )}
              {activeFile.type === "code" && (
                <CodeView 
                  data={activeFile.data} 
                  onChange={updateActiveFileData} 
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white/30">
            <Sparkles className="w-10 h-10 text-[#FF3E00]/30 mb-4 animate-pulse" />
            <h3 className="text-sm font-mono uppercase tracking-widest text-white/70">CORTEX WORKSPACE INACTIVE</h3>
            <p className="text-xs font-mono text-white/30 tracking-wide max-w-sm mt-2 leading-relaxed">
              Launch one of the productivity project cores from the left panel or ask KONDA AI to generate spreadsheet arrays, flow diagrams, or document slides.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 📊 SPREADSHEET & SORTABLE TABLE & CHART VIEW
 */
function SpreadsheetView({ data, onChange }: { data: { headers: string[], rows: string[][] }, onChange: (val: any) => void }) {
  const [activeCell, setActiveCell] = useState<{ r: number, c: number } | null>(null);
  const [cellInput, setCellInput] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "scatter">("bar");
  const [xAxisCol, setXAxisCol] = useState(0);
  const [yAxisCol, setYAxisCol] = useState(1);
  const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
  const [headerInput, setHeaderInput] = useState("");
  const blockInputRef = useRef<HTMLInputElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    setIsChartReady(true);
  }, []);

  // Evaluate formula calculations on data matrix (e.g. SUM or math multipliers)
  const evaluateCell = (val: string, rIndex: number) => {
    if (!val || !val.startsWith("=")) return val;
    try {
      const formula = val.slice(1).toUpperCase().trim();
      
      // Simple SUM formulation parser: SUM(B1:D1)
      if (formula.startsWith("SUM(") && formula.endsWith(")")) {
        const range = formula.slice(4, -1);
        const [start, end] = range.split(":");
        if (start && end) {
          // Parse columns and rows manually (e.g., B1 to D1)
          const startColCode = start.charCodeAt(0) - 65; // 'B' -> 1
          const startRowIndex = parseInt(start.slice(1)) - 1; // '1' -> 0
          const endColCode = end.charCodeAt(0) - 65;
          const endRowIndex = parseInt(end.slice(1)) - 1;

          let sum = 0;
          for (let col = startColCode; col <= endColCode; col++) {
            for (let row = startRowIndex; row <= endRowIndex; row++) {
              // Ensure we don't cause infinite recursion loops
              if (row === rIndex) {
                // If it's evaluating values on own row, fetch the string directly
                const cellVal = parseFloat(data.rows[row]?.[col] || "0");
                if (!isNaN(cellVal)) sum += cellVal;
              } else {
                const cellVal = parseFloat(evaluateCell(data.rows[row]?.[col] || "0", row));
                if (!isNaN(cellVal)) sum += cellVal;
              }
            }
          }
          return sum.toFixed(2).replace(/\.00$/, "");
        }
      }

      // Simple multiplier math expressions (like B1*E1)
      const mathMatch = formula.match(/([A-Z]\d+)\s*([\+\-\*\/])\s*([A-Z]\d+)/);
      if (mathMatch) {
        const [, op1, operator, op2] = mathMatch;
        const colVal = (op: string) => {
          const colIdx = op.charCodeAt(0) - 65;
          const rowIdx = parseInt(op.slice(1)) - 1;
          const raw = rowIdx === rIndex ? data.rows[rowIdx]?.[colIdx] : evaluateCell(data.rows[rowIdx]?.[colIdx], rowIdx);
          return parseFloat(raw || "0");
        };

        const v1 = colVal(op1);
        const v2 = colVal(op2);
        let res = 0;
        if (operator === "+") res = v1 + v2;
        if (operator === "-") res = v1 - v2;
        if (operator === "*") res = v1 * v2;
        if (operator === "/") res = v1 / (v2 || 1);
        return res.toFixed(2).replace(/\.00$/, "");
      }
    } catch (e) {
      return "Formula Error";
    }
    return val;
  };

  const handleCellClick = (r: number, c: number) => {
    setActiveCell({ r, c });
    setCellInput(data.rows[r][c] || "");
  };

  const saveCellEdit = () => {
    if (!activeCell) return;
    const updatedRows = data.rows.map((row, rIdx) => 
      row.map((cell, cIdx) => (rIdx === activeCell.r && cIdx === activeCell.c) ? cellInput : cell)
    );
    onChange({ ...data, rows: updatedRows });
    setActiveCell(null);
  };

  const addColumn = () => {
    const nextColChar = String.fromCharCode(65 + data.headers.length);
    const updatedHeaders = [...data.headers, `Series ${nextColChar}`];
    const updatedRows = data.rows.map(row => [...row, "0"]);
    onChange({ headers: updatedHeaders, rows: updatedRows });
  };

  const addRow = () => {
    const emptyRow = data.headers.map(() => "0");
    onChange({ ...data, rows: [...data.rows, emptyRow] });
  };

  const deleteRow = (idx: number) => {
    const updatedRows = data.rows.filter((_, i) => i !== idx);
    onChange({ ...data, rows: updatedRows });
  };

  const handleSort = (colIndex: number) => {
    const sortedRows = [...data.rows].sort((a, b) => {
      const valA = isNaN(Number(a[colIndex])) ? a[colIndex] : Number(a[colIndex]);
      const valB = isNaN(Number(b[colIndex])) ? b[colIndex] : Number(b[colIndex]);
      if (typeof valA === "number" && typeof valB === "number") {
        return valA - valB;
      }
      return String(valA).localeCompare(String(valB));
    });
    onChange({ ...data, rows: sortedRows });
  };

  // Convert table structure to recharts-friendly data array
  const chartData = data.rows.map((row) => {
    const item: any = { name: row[xAxisCol] || "Label" };
    data.headers.forEach((h, colIdx) => {
      if (colIdx !== xAxisCol) {
        const raw = evaluateCell(row[colIdx], colIdx);
        const num = parseFloat(raw);
        item[h] = isNaN(num) ? 0 : num;
      }
    });
    return item;
  });

  const colors = ["#FF3E00", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

  return (
    <div id="spreadsheet-container" className="flex flex-col h-full bg-[#050507]">
      {/* Dynamic Sub-tab Selector */}
      <div className="flex px-4 py-2 border-b border-white/5 bg-black/30 items-center justify-between">
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "px-3 py-1 font-mono text-[10px] tracking-widest uppercase border rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              viewMode === "table" ? "bg-[#FF3E00]/10 border-[#FF3E00]/30 text-[#FF3E00]" : "border-white/5 text-white/50 hover:bg-white/5"
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            Active Sheet
          </button>
          <button 
            type="button"
            onClick={() => setViewMode("chart")}
            className={cn(
              "px-3 py-1 font-mono text-[10px] tracking-widest uppercase border rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              viewMode === "chart" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "border-white/5 text-white/50 hover:bg-white/5"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Neural Visualizer
          </button>
        </div>

        {viewMode === "table" ? (
          <div className="flex gap-1.5">
            <button 
              onClick={addRow}
              className="px-2 py-1 border border-white/5 bg-white/[0.02] hover:bg-white/5 rounded text-[9px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-[#FF3E00]" />
              Add Row
            </button>
            <button 
              onClick={addColumn}
              className="px-2 py-1 border border-white/5 bg-white/[0.02] hover:bg-white/5 rounded text-[9px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-blue-400" />
              Add Column
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            {/* Chart Type Selector */}
            <div className="flex border border-white/5 rounded-md overflow-hidden bg-black/40">
              {(["bar", "line", "pie", "scatter"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={cn(
                    "px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer",
                    chartType === t ? "bg-white/10 text-[#FF3E00]" : "text-white/40 hover:bg-white/5"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Field Mapping Selection */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-white/30 mr-1 uppercase">X-Axis:</span>
              <select 
                value={xAxisCol}
                onChange={(e) => setXAxisCol(parseInt(e.target.value))}
                className="bg-black/80 border border-white/5 text-white rounded text-[10px] font-mono p-1 focus:outline-none focus:border-[#FF3E00]"
              >
                {data.headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Primary Area */}
      <div className="flex-1 overflow-auto p-6 max-h-[calc(100vh-160px)] custom-scrollbar">
        {viewMode === "table" ? (
          <div className="flex flex-col gap-4">
            {/* Formula Edit Line */}
            <div className="bg-black/30 border border-white/5 rounded-lg p-2.5 flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-[#FF3E00] uppercase tracking-wider select-none">fx Formula Line:</span>
              {activeCell ? (
                <div className="flex-1 flex gap-2">
                  <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded">
                    {String.fromCharCode(65 + activeCell.c)}{activeCell.r + 1}
                  </span>
                  <input 
                    ref={blockInputRef}
                    type="text" 
                    value={cellInput}
                    onChange={(e) => setCellInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCellEdit();
                    }}
                    placeholder="Enter mathematical numerical formula or value (e.g., =SUM(B1:D1))"
                    className="flex-1 bg-black/60 border border-white/10 rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#FF3E00] transition-colors"
                  />
                  <button 
                    onClick={saveCellEdit}
                    className="px-3 py-1 bg-[#FF3E00] hover:bg-[#E03700] rounded text-[10px] font-mono uppercase tracking-widest font-bold cursor-pointer"
                  >
                    Commit
                  </button>
                </div>
              ) : (
                <span className="text-xs font-mono text-white/20 select-none">Select a numeric cell index to inject a macro or expression formulation.</span>
              )}
            </div>

            {/* High Density Table Frame */}
            <div className="overflow-x-auto border border-white/5 rounded-lg bg-black/20">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-3 text-[10px] text-white/30 text-center w-12 border-r border-white/5">Num</th>
                    {data.headers.map((h, i) => (
                      <th 
                        key={i} 
                        className="p-3 text-[10px] text-white/60 tracking-wider uppercase font-bold text-left group/hdr cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {editingHeaderIndex === i ? (
                            <input 
                              type="text" 
                              value={headerInput}
                              onChange={(e) => setHeaderInput(e.target.value)}
                              onBlur={() => {
                                if (headerInput.trim()) {
                                  const updated = [...data.headers];
                                  updated[i] = headerInput;
                                  onChange({ ...data, headers: updated });
                                }
                                setEditingHeaderIndex(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const updated = [...data.headers];
                                  updated[i] = headerInput;
                                  onChange({ ...data, headers: updated });
                                  setEditingHeaderIndex(null);
                                }
                              }}
                              autoFocus
                              className="bg-black/80 border border-white/10 text-white p-1 text-xs focus:outline-none focus:border-[#FF3E00] rounded"
                            />
                          ) : (
                            <span 
                              onClick={() => {
                                setEditingHeaderIndex(i);
                                setHeaderInput(h);
                              }}
                              className="hover:text-white transition-colors"
                            >
                              {h}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 opacity-0 group-hover/hdr:opacity-100 transition-opacity">
                            <button onClick={() => handleSort(i)} className="hover:text-[#FF3E00] p-1 rounded" title="Sort Column">
                              <ArrowLeftRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 text-[10px] text-white/30 text-right w-16">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {data.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="p-3 text-center border-r border-white/5 text-white/20 select-none bg-black/20">{rIdx + 1}</td>
                      {row.map((cell, cIdx) => {
                        const evaluated = evaluateCell(cell, rIdx);
                        const isFormula = cell && cell.startsWith("=");
                        const isSelected = activeCell && activeCell.r === rIdx && activeCell.c === cIdx;
                        return (
                          <td 
                            key={cIdx} 
                            onClick={() => handleCellClick(rIdx, cIdx)}
                            className={cn(
                              "p-3 cursor-pointer select-none transition-all border-r border-white/[0.02]",
                              isSelected ? "bg-[#FF3E00]/10 border-l border-r border-[#FF3E00]/30 outline outline-1 outline-[#FF3E00]/40 text-white" : "",
                              isFormula ? "text-blue-400 font-bold" : "text-white/70"
                            )}
                            title={isFormula ? `Formula Expr: ${cell}` : undefined}
                          >
                            <div className="flex items-center justify-between">
                              <span>{evaluated}</span>
                              {isFormula && !isSelected && (
                                <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded transform scale-90">fx</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 text-right">
                        <button 
                          onClick={() => deleteRow(rIdx)}
                          className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-[#070709] border border-white/5 rounded-xl p-8 max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-full text-center mb-6">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF3E00] font-bold">Neural Intelligence Multi-Axis Graph</h4>
              <p className="text-[10px] font-mono text-white/30 uppercase mt-0.5">X Axis mapping: {data.headers[xAxisCol]}</p>
            </div>
            
            <div className="w-full min-w-0 min-h-[384px] h-96 relative">
              {isChartReady && (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "bar" ? (
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#555" tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }} />
                      <YAxis stroke="#555" tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F0F12", borderColor: "rgba(255,62,0,0.2)", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                      {data.headers.map((h, i) => i !== xAxisCol && (
                        <Bar key={h} dataKey={h} fill={colors[(i - 1) % colors.length]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  ) : chartType === "line" ? (
                    <LineChart data={chartData}>
                      <XAxis dataKey="name" stroke="#555" tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }} />
                      <YAxis stroke="#555" tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F0F12", borderColor: "rgba(255, 62, 0, 0.2)", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                      {data.headers.map((h, i) => i !== xAxisCol && (
                        <Line key={h} type="monotone" dataKey={h} stroke={colors[(i - 1) % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                      ))}
                    </LineChart>
                  ) : chartType === "pie" ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey={data.headers[yAxisCol % data.headers.length]}
                        nameKey="name"
                        cx="51%"
                        cy="51%"
                        outerRadius={120}
                        fill="#FF3E00"
                        label={{ fill: "rgba(255,255,255,0.7)", fontSize: 10, fontFamily: "monospace" }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0F0F12", borderColor: "rgba(255, 62, 0, 0.2)", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                    </PieChart>
                  ) : (
                    <ScatterChart>
                      <XAxis type="number" dataKey={data.headers[xAxisCol]} stroke="#555" tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }} />
                      <YAxis type="number" dataKey={data.headers[yAxisCol]} stroke="#555" tick={{ fill: "#888", fontSize: 10, fontFamily: "monospace" }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0F0F12", borderColor: "rgba(255, 62, 0, 0.2)", borderRadius: 8 }} />
                      <Scatter name="Data Distribution" data={chartData} fill="#FF3E00">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Scatter>
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 🗺️ DRAGGABLE & EDITABLE DIAGRAMS VIEW
 */
interface DiagramNode {
  id: string;
  label: string;
  style: "rounded" | "rectangle" | "diamond" | "ellipse";
  x: number;
  y: number;
  bg: string;
  border: string;
}

interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

function DiagramView({ data, onChange }: { data: { nodes: DiagramNode[], edges: DiagramEdge[] }, onChange: (val: any) => void }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeStyle, setNodeStyle] = useState<DiagramNode["style"]>("rounded");
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const draggingNodeId = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const startDrag = (id: string) => {
    draggingNodeId.current = id;
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!draggingNodeId.current || !canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - canvasBounds.left - 80), canvasBounds.width - 160);
    const y = Math.min(Math.max(0, e.clientY - canvasBounds.top - 24), canvasBounds.height - 48);

    const updatedNodes = data.nodes.map(n => n.id === draggingNodeId.current ? { ...n, x: Math.round(x), y: Math.round(y) } : n);
    onChange({ ...data, nodes: updatedNodes });
  };

  const stopDrag = () => {
    draggingNodeId.current = null;
  };

  const createNode = () => {
    const nextId = `${data.nodes.length + 1}`;
    const newNode: DiagramNode = {
      id: nextId,
      label: `System Node ${nextId}`,
      style: "rounded",
      x: 200,
      y: 200,
      bg: "rgba(255, 255, 255, 0.05)",
      border: "#666"
    };
    onChange({ ...data, nodes: [...data.nodes, newNode] });
    setSelectedNodeId(nextId);
    setNodeLabel(newNode.label);
    setNodeStyle(newNode.style);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const filteredNodes = data.nodes.filter(n => n.id !== selectedNodeId);
    const filteredEdges = data.edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId);
    onChange({ nodes: filteredNodes, edges: filteredEdges });
    setSelectedNodeId(null);
  };

  const handleConnectClick = (nodeId: string) => {
    if (!connectingNodeId) {
      setConnectingNodeId(nodeId);
    } else {
      if (connectingNodeId !== nodeId) {
        // Create edge link
        const exist = data.edges.some(e => e.from === connectingNodeId && e.to === nodeId);
        if (!exist) {
          const newEdge: DiagramEdge = {
            id: `edge-${Date.now()}`,
            from: connectingNodeId,
            to: nodeId,
            label: "Uplink"
          };
          onChange({ ...data, edges: [...data.edges, newEdge] });
        }
      }
      setConnectingNodeId(null);
    }
  };

  const updateSelectedNodeMeta = (label: string, style: DiagramNode["style"], border: string) => {
    if (!selectedNodeId) return;
    const updated = data.nodes.map(n => {
      if (n.id === selectedNodeId) {
        let bgStyle = "rgba(255,255,255,0.05)";
        if (border === "#FF3E00") bgStyle = "rgba(255, 62, 0, 0.15)";
        else if (border === "#3B82F6") bgStyle = "rgba(59, 130, 246, 0.15)";
        else if (border === "#10B981") bgStyle = "rgba(16, 185, 129, 0.15)";
        else if (border === "#8B5CF6") bgStyle = "rgba(139, 92, 246, 0.15)";
        
        return { ...n, label, style, border, bg: bgStyle };
      }
      return n;
    });
    onChange({ ...data, nodes: updated });
  };

  const renderNodePath = (node: DiagramNode) => {
    const rx = 80;
    const ry = 25;
    const cx = node.x + rx;
    const cy = node.y + ry;

    if (node.style === "rounded") {
      return (
        <rect x={node.x} y={node.y} width={rx*2} height={ry*2} rx={10} fill={node.bg} stroke={node.border} strokeWidth={selectedNodeId === node.id ? 2 : 1} />
      );
    } else if (node.style === "diamond") {
      // Connect diamond points
      const points = `${cx},${node.y} ${node.x+rx*2},${cy} ${cx},${node.y+ry*2} ${node.x},${cy}`;
      return <polygon points={points} fill={node.bg} stroke={node.border} strokeWidth={selectedNodeId === node.id ? 2 : 1} />;
    } else if (node.style === "ellipse") {
      return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={node.bg} stroke={node.border} strokeWidth={selectedNodeId === node.id ? 2 : 1} />;
    } else {
      return (
        <rect x={node.x} y={node.y} width={rx*2} height={ry*2} fill={node.bg} stroke={node.border} strokeWidth={selectedNodeId === node.id ? 2 : 1} />
      );
    }
  };

  return (
    <div id="diagram-view" className="flex flex-col h-full bg-[#050507] overflow-hidden select-none" onMouseMove={handleDrag} onMouseUp={stopDrag}>
      {/* Sub-toolbar */}
      <div className="flex px-4 py-2 border-b border-white/5 bg-black/30 items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={createNode}
            className="px-2.5 py-1.5 border border-white/5 bg-white/[0.02] hover:bg-white/5 rounded text-[10px] uppercase font-mono tracking-widest flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            Add Node
          </button>
          {selectedNodeId && (
            <button 
              onClick={deleteSelectedNode}
              className="px-2.5 py-1.5 border border-white/5 bg-white/[0.02] hover:bg-red-500/10 hover:text-red-400 rounded text-[10px] uppercase font-mono tracking-widest flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selection
            </button>
          )}
        </div>

        {connectingNodeId && (
          <div className="text-[10px] font-mono uppercase bg-[#FF3E00]/15 text-[#FF3E00] px-3 py-1 border border-[#FF3E00]/30 rounded-md animate-pulse">
            Linking Link Core: Select child to construct Edge...
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Draggable canvas */}
        <div ref={canvasRef} className="flex-1 relative bg-[#030305] border border-white/5 m-4 rounded-xl overflow-hidden cursor-grab">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF3E00" />
              </marker>
            </defs>
            {data.edges.map((edge) => {
              const fromNode = data.nodes.find(n => n.id === edge.from);
              const toNode = data.nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + 80;
              const y1 = fromNode.y + 25;
              const x2 = toNode.x + 80;
              const y2 = toNode.y + 25;

              // Draw bezier curves
              const dx = x2 - x1;
              const dy = y2 - y1;
              const ctrlX = x1 + dx * 0.5;
              const ctrlY = y1 + dy * 0.2;

              return (
                <g key={edge.id} className="opacity-70 hover:opacity-100 transition-opacity">
                  <path d={`M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`} stroke="#FFA380" strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" />
                  <rect x={(x1+x2)/2 - 25} y={(y1+y2)/2 - 10} width={50} height={16} rx={3} fill="#0A0A0E" stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                  <text x={(x1+x2)/2} y={(y1+y2)/2 + 2} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8} fontFamily="monospace">{edge.label}</text>
                </g>
              );
            })}
          </svg>

          {data.nodes.map((n) => {
            const isSelected = selectedNodeId === n.id;
            const isConnectingSource = connectingNodeId === n.id;
            return (
              <div
                key={n.id}
                onMouseDown={() => startDrag(n.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(n.id);
                  setNodeLabel(n.label);
                  setNodeStyle(n.style);
                }}
                style={{ left: `${n.x}px`, top: `${n.y}px` }}
                className={cn(
                  "absolute w-[160px] h-[50px] flex flex-col justify-center items-center px-2 cursor-grab select-none group border rounded-md shadow-lg transition-shadow",
                  isSelected ? "shadow-[0_0_12px_rgba(255,62,0,0.15)] outline outline-2 outline-[#FF3E00]/40" : "",
                  n.border === "#FF3E00" ? "bg-[#FF3E00]/10 border-[#FF3E00]/40 text-[#FF3E00]" : 
                  n.border === "#3B82F6" ? "bg-blue-500/10 border-blue-500/40 text-blue-400" :
                  n.border === "#10B981" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" :
                  n.border === "#8B5CF6" ? "bg-violet-500/10 border-violet-500/40 text-violet-400" :
                  "bg-white/[0.03] border-white/10 text-white/80"
                )}
              >
                <span className="text-[11px] font-mono tracking-wide text-center leading-tight break-all select-none pointer-events-none font-bold">
                  {n.label}
                </span>

                {/* Hot Connector overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity rounded-md">
                  <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectClick(n.id);
                    }}
                    className={cn(
                      "p-1 rounded text-[8px] uppercase tracking-wider font-mono cursor-pointer border",
                      isConnectingSource ? "bg-[#FF3E00] text-white border-transparent" : "bg-white/10 hover:bg-[#FF3E00] border-white/5 text-white"
                    )}
                  >
                    Link
                  </button>
                  <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(n.id);
                    }}
                    className="p-1 bg-white/10 hover:bg-white/20 text-white border border-white/5 rounded text-[8px] uppercase tracking-wider font-mono cursor-pointer"
                  >
                    Meta
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected element inspector side column */}
        {selectedNodeId && (
          <div className="w-64 border-l border-white/5 bg-[#070709] p-4 flex flex-col gap-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF3E00]">Node Properties</div>
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Text Label:</span>
                <input 
                  type="text" 
                  value={nodeLabel}
                  onChange={(e) => {
                    setNodeLabel(e.target.value);
                    const n = data.nodes.find(i => i.id === selectedNodeId);
                    if (n) updateSelectedNodeMeta(e.target.value, n.style, n.border);
                  }}
                  className="bg-black/60 border border-white/5 text-white rounded p-2 text-xs font-mono focus:outline-none focus:border-[#FF3E00] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Geometric Style:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["rounded", "rectangle", "diamond", "ellipse"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setNodeStyle(s);
                        const n = data.nodes.find(i => i.id === selectedNodeId);
                        if (n) updateSelectedNodeMeta(nodeLabel, s, n.border);
                      }}
                      className={cn(
                        "px-2 py-1 text-[8px] font-mono uppercase tracking-wider border rounded cursor-pointer",
                        nodeStyle === s ? "border-blue-400 bg-blue-500/10 text-blue-400" : "border-white/5 hover:bg-white/5 text-white/40"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Aesthetic Palette:</span>
                <div className="flex gap-2">
                  {["#FF3E00", "#3B82F6", "#10B981", "#8B5CF6", "#666666"].map((col) => {
                    const n = data.nodes.find(i => i.id === selectedNodeId);
                    const isBorderMatch = n && n.border === col;
                    return (
                      <button 
                        key={col}
                        onClick={() => {
                          if (n) updateSelectedNodeMeta(nodeLabel, n.style, col);
                        }}
                        style={{ backgroundColor: col }}
                        className={cn(
                          "w-6 h-6 rounded-full cursor-pointer focus:outline-none border-2",
                          isBorderMatch ? "border-white" : "border-transparent"
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 🗺️ DOCUMENT, PowerPoint (PPT) & SLIDE PRESENTATION LAYOUT VIEW
 */
function PresentationView({ data, onChange }: { data: { slides: any[] }, onChange: (val: any) => void }) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [themeMode, setThemeMode] = useState<"dark-slate" | "minimal-white" | "orange-crush">("dark-slate");

  const activeSlide = data.slides[activeSlideIndex] || data.slides[0];

  const updateSlideContent = (index: number, key: string, val: any) => {
    const updated = data.slides.map((slide, i) => i === index ? { ...slide, [key]: val } : slide);
    onChange({ slides: updated });
  };

  const addSlide = () => {
    const nextCode = `${data.slides.length + 1}`;
    const newSlide = {
      id: `slide-${Date.now()}`,
      title: `Project Core Segment ${nextCode}`,
      subtitle: "Universal Strategic Metrics Overview",
      bullets: ["Structured data loops indicating high efficiency.", "Dynamic visual rendering active across containers."],
      layout: "content"
    };
    onChange({ slides: [...data.slides, newSlide] });
    setActiveSlideIndex(data.slides.length);
  };

  const removeSlide = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.slides.length <= 1) return;
    const filtered = data.slides.filter((_, i) => i !== idx);
    onChange({ slides: filtered });
    setActiveSlideIndex(prev => Math.min(prev, filtered.length - 1));
  };

  return (
    <div id="presentation-view" className="flex h-full bg-[#050507] overflow-hidden">
      {/* Thumbnails rail left side */}
      <div className="w-56 border-r border-white/5 bg-[#070709] flex flex-col h-full shrink-0">
        <div className="p-3 border-b border-white/5 flex justify-between items-center bg-black/20">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">Deck Sequence</span>
          <button 
            onClick={addSlide}
            className="p-1 border border-white/10 hover:border-[#FF3E00] rounded text-white/40 hover:text-[#FF3E00] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {data.slides.map((s, idx) => {
            const isActive = idx === activeSlideIndex;
            return (
              <div
                key={s.id || idx}
                onClick={() => setActiveSlideIndex(idx)}
                className={cn(
                  "relative aspect-video rounded-md border text-left p-2.5 transition-all cursor-pointer overflow-hidden group/thumb flex flex-col justify-between",
                  isActive 
                    ? "bg-[#FF3E00]/10 border-[#FF3E00] shadow-md"
                    : "bg-[#0A0A0E] border-white/5 hover:border-white/10"
                )}
              >
                <div className="text-[8px] font-mono tracking-wide text-white/50 leading-tight truncate">{s.title || "Untitled slide"}</div>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[7px] font-mono text-white/20">SLIDE_0{idx + 1}</span>
                  <button 
                    onClick={(e) => removeSlide(idx, e)}
                    className="opacity-0 group-hover/thumb:opacity-100 p-0.5 hover:bg-white/10 rounded text-white/40 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide Workstation Canvas */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Theme Settings Bar */}
        <div className="flex justify-between items-center mb-4 shrink-0 px-4">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-white/30 uppercase mr-2 font-bold">Theme Preset:</span>
            {([
              { id: "dark-slate", bg: "#0D0E15", text: "Slate Dark" },
              { id: "minimal-white", bg: "#F8F9FA", text: "White Minimalist" },
              { id: "orange-crush", bg: "#1D0B04", text: "Entropy Orange" }
            ] as const).map((th) => (
              <button
                key={th.id}
                onClick={() => setThemeMode(th.id)}
                className={cn(
                  "px-2.5 py-1 text-[8px] font-mono uppercase tracking-wider rounded border cursor-pointer transition-all",
                  themeMode === th.id ? "border-[#FF3E00] bg-white/5 text-[#FF3E00]" : "border-white/5 text-white/40 hover:bg-white/5"
                )}
              >
                {th.text}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
              className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white disabled:opacity-10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-white/50 select-none">Slide {activeSlideIndex + 1} of {data.slides.length}</span>
            <button 
              onClick={() => setActiveSlideIndex(prev => Math.min(data.slides.length - 1, prev + 1))}
              disabled={activeSlideIndex === data.slides.length - 1}
              className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white disabled:opacity-10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeSlide ? (
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Visual Slide Output */}
            <div className="flex-1 flex items-center justify-center p-4 bg-black/40 border border-white/5 rounded-xl">
              <div 
                id="widescreen-slide"
                className={cn(
                  "aspect-video w-full max-w-4xl rounded-lg border shadow-2xl p-8 flex flex-col justify-between transition-colors relative overflow-hidden select-text",
                  themeMode === "dark-slate" ? "bg-[#0D0E15] text-white border-white/5" :
                  themeMode === "minimal-white" ? "bg-white text-black border-neutral-300" :
                  "bg-[#110502] text-white border-orange-950"
                )}
              >
                {/* Branding corner indicators */}
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "font-mono text-[8px] tracking-[0.25em] uppercase font-bold",
                    themeMode === "minimal-white" ? "text-neutral-400" : "text-[#FF3E00]"
                  )}>
                    KONDA_OS // ROADMAP_DECK
                  </span>
                  <span className={cn(
                    "font-mono text-[8px] tracking-widest",
                    themeMode === "minimal-white" ? "text-neutral-400" : "text-white/40"
                  )}>
                    SLIDE_0{activeSlideIndex + 1}
                  </span>
                </div>

                {activeSlide.layout === "title" ? (
                  <div className="space-y-4 my-auto">
                    <h1 className="text-4xl font-serif italic tracking-tight font-medium select-text">{activeSlide.title}</h1>
                    <p className={cn(
                      "text-sm font-mono uppercase tracking-widest",
                      themeMode === "minimal-white" ? "text-neutral-500" : "text-[#FF3E00]/60"
                    )}>
                      {activeSlide.subtitle}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 my-auto">
                    <div>
                      <h2 className="text-2xl font-serif italic tracking-tight font-medium select-text">{activeSlide.title}</h2>
                      <p className={cn(
                        "text-[10px] uppercase font-mono tracking-wider mt-1.5",
                        themeMode === "minimal-white" ? "text-neutral-400" : "text-white/30"
                      )}>
                        {activeSlide.subtitle}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeSlide.bullets && activeSlide.bullets.map((b: string, i: number) => (
                        <div key={i} className="flex gap-2.5 items-start">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mt-1.5",
                            themeMode === "minimal-white" ? "bg-[#FF3E00]" : "bg-[#FF3E00]"
                          )} />
                          <p className={cn(
                            "text-xs leading-relaxed tracking-wide select-text",
                            themeMode === "minimal-white" ? "text-neutral-700" : "text-white/70"
                          )}>
                            {b}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className={cn(
                    "font-mono text-[7px] uppercase tracking-wider",
                    themeMode === "minimal-white" ? "text-neutral-400" : "text-white/20"
                  )}>
                    Internal Enterprise Circulation Only
                  </span>
                  <span className={cn(
                    "font-mono text-[8px]",
                    themeMode === "minimal-white" ? "text-neutral-400" : "text-white/20"
                  )}>
                    Secured by Cortex Core
                  </span>
                </div>
              </div>
            </div>

            {/* Slide Editor Panel / Input overlays */}
            <div className="w-72 border-l border-white/5 bg-[#070709] p-4 flex flex-col gap-4">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FF3E00]">Segment Editor</div>
              
              <div className="space-y-3.5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Slide Title:</span>
                  <input 
                    type="text" 
                    value={activeSlide.title || ""}
                    onChange={(e) => updateSlideContent(activeSlideIndex, "title", e.target.value)}
                    className="bg-black/60 border border-white/5 text-white rounded p-2 text-xs font-mono focus:outline-none focus:border-[#FF3E00] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Subtitle:</span>
                  <input 
                    type="text" 
                    value={activeSlide.subtitle || ""}
                    onChange={(e) => updateSlideContent(activeSlideIndex, "subtitle", e.target.value)}
                    className="bg-black/60 border border-white/5 text-white rounded p-2 text-xs font-mono focus:outline-none focus:border-[#FF3E00] transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Bullet Points:</span>
                    <button 
                      onClick={() => {
                        const updated = [...(activeSlide.bullets || []), "New metric bullet point."];
                        updateSlideContent(activeSlideIndex, "bullets", updated);
                      }}
                      className="text-[9px] font-mono text-[#FF3E00] hover:underline"
                    >
                      + Add List Match
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeSlide.bullets && activeSlide.bullets.map((b: string, bIdx: number) => (
                      <div key={bIdx} className="flex gap-1.5">
                        <textarea 
                          value={b}
                          onChange={(e) => {
                            const updated = [...(activeSlide.bullets || [])];
                            updated[bIdx] = e.target.value;
                            updateSlideContent(activeSlideIndex, "bullets", updated);
                          }}
                          className="flex-1 bg-black/60 border border-white/5 text-white rounded p-2 text-xs font-mono focus:outline-none focus:border-[#FF3E00] h-16 resize-none"
                        />
                        <button 
                          onClick={() => {
                            const updated = (activeSlide.bullets || []).filter((_: any, i: any) => i !== bIdx);
                            updateSlideContent(activeSlideIndex, "bullets", updated);
                          }}
                          className="p-1 text-white/20 hover:text-red-400 border border-white/10 hover:border-red-400 rounded cursor-pointer self-start"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Visual Layout:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateSlideContent(activeSlideIndex, "layout", "title")}
                      className={cn(
                        "px-2.5 py-1 text-[8px] font-mono uppercase tracking-widest border rounded cursor-pointer",
                        activeSlide.layout === "title" ? "border-[#FF3E00] text-[#FF3E00] bg-white/5" : "border-white/5 text-white/50"
                      )}
                    >
                      Title Cover
                    </button>
                    <button
                      onClick={() => updateSlideContent(activeSlideIndex, "layout", "content")}
                      className={cn(
                        "px-2.5 py-1 text-[8px] font-mono uppercase tracking-widest border rounded cursor-pointer",
                        activeSlide.layout !== "title" ? "border-[#FF3E00] text-[#FF3E00] bg-white/5" : "border-white/5 text-white/50"
                      )}
                    >
                      Bullet Grid
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 💻 LIVE CODE EXECUTION SANDBOX VIEW
 */
function CodeView({ data, onChange }: { data: { code: string }, onChange: (val: any) => void }) {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);
  const sandboxRef = useRef<HTMLIFrameElement>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="code-sandbox-view" className="flex flex-col h-full bg-[#050507]">
      {/* Tab select slider */}
      <div className="flex px-4 py-2 border-b border-white/5 bg-black/30 items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("code")}
            className={cn(
              "px-3 py-1 font-mono text-[10px] tracking-widest uppercase border rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "code" ? "bg-[#FF3E00]/10 border-[#FF3E00]/30 text-[#FF3E00]" : "border-white/5 text-white/50 hover:bg-white/5"
            )}
          >
            Code Assembler
          </button>
          <button 
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-3 py-1 font-mono text-[10px] tracking-widest uppercase border rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "preview" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/5 text-white/50 hover:bg-white/5"
            )}
          >
            Sandbox Preview
          </button>
        </div>

        <button 
          onClick={copyToClipboard}
          className="px-2 py-1 border border-white/5 bg-white/[0.02] hover:bg-white/5 rounded text-[9px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
        >
          {copied ? "COPIED" : "COPY CODE"}
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === "code" ? (
          <textarea 
            value={data.code}
            onChange={(e) => onChange({ code: e.target.value })}
            className="w-full h-full bg-[#030305] text-white/90 p-6 font-mono text-xs focus:outline-none resize-none overflow-y-auto leading-relaxed custom-scrollbar"
            placeholder="Write production HTML / CSS / JS code block templates here..."
          />
        ) : (
          <div className="w-full h-full bg-slate-950 flex flex-col">
            <div className="h-6 bg-black/40 border-b border-white/5 px-4 flex items-center gap-2 text-[9px] font-mono text-white/30 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="ml-2 uppercase tracking-wide">SANDBOX ENGINE RE-RUNS AUTOMATICALLY ON EDITS</span>
            </div>
            <iframe 
              ref={sandboxRef}
              srcDoc={data.code}
              title="Execution Sandpit sandbox"
              className="flex-1 w-full border-none bg-white font-sans text-black"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 📦 SYSTEM EXPORTER ACTION BUTTONS
 */
function Exporter({ file }: { file: WorkspaceFile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [infographicFilter, setInfographicFilter] = useState("none");
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const triggerExport = (format: string) => {
    setIsOpen(false);
    
    triggerSystemNotification(
      "Asset Export Initiated",
      `Converting and downloading "${file.title}" in ${format.toUpperCase()} format.`,
      "/favicon.ico"
    ).catch(console.warn);
    
    if (format === "csv" && file.type === "spreadsheet") {
      const headers = file.data.headers.join(",");
      const rows = file.data.rows.map((r: string[]) => r.join(",")).join("\n");
      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(`${headers}\n${rows}`);
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", `${file.title.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } 

    else if (format === "xlsx" && file.type === "spreadsheet") {
      const formatted = [file.data.headers, ...file.data.rows];
      const ws = XLSX.utils.aoa_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet 1");
      XLSX.writeFile(wb, `${file.title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
    }

    else if (format === "pdf" && file.type === "presentation") {
      const doc = new jsPDF({ orientation: "landscape", format: "a4" });
      file.data.slides.forEach((slide: any, idx: number) => {
        if (idx > 0) doc.addPage();
        
        // Custom branding background style colors
        doc.setFillColor("#0D0E15");
        doc.rect(0, 0, 297, 210, "F");
        
        // Branding heading strings
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor("#FF3E00");
        doc.text("KONDA AI // Roadmaps Presentation", 15, 15);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor("#666666");
        doc.text(`Slide 0${idx + 1}`, 275, 15);

        // Core text layout
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(32);
        doc.setTextColor("#FFFFFF");
        doc.text(slide.title || "Subject Frame", 20, 70);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor("#FF3E00");
        doc.text(slide.subtitle || "", 20, 85);

        if (slide.bullets && slide.bullets.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor("#CCCCCC");
          let bulletY = 110;
          slide.bullets.forEach((bullet: string) => {
            doc.text(`- ${bullet}`, 20, bulletY);
            bulletY += 12;
          });
        }

        // Slide footers
        doc.setLineWidth(0.5);
        doc.setDrawColor("#222222");
        doc.line(15, 195, 282, 195);
        doc.setFontSize(7);
        doc.setTextColor("#444444");
        doc.text("Enterprise Level Multimodal Intelligence System Hub", 15, 201);
      });
      doc.save(`${file.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    }

    else if (format === "pdf" && file.type === "spreadsheet") {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text(file.title, 14, 15);
      
      const tableData = file.data.rows;
      (doc as any).autoTable({
        head: [file.data.headers],
        body: tableData,
        startY: 22,
        theme: "striped",
        headStyles: { fillColor: [255, 62, 0] }
      });
      doc.save(`${file.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    }

    else if (format === "txt") {
      let content = `${file.title}\n${"=".repeat(file.title.length)}\n\n`;
      if (file.type === "spreadsheet") {
        content += `${file.data.headers.join(" | ")}\n`;
        content += `${"-".repeat(file.data.headers.join(" | ").length)}\n`;
        file.data.rows.forEach((r: string[]) => { content += `${r.join(" | ")}\n`; });
      } else if (file.type === "code") {
        content += file.data.code;
      } else if (file.type === "presentation") {
        file.data.slides.forEach((slide: any, idx: number) => {
          content += `Slide 0${idx + 1}: ${slide.title}\n`;
          content += `Subtitle: ${slide.subtitle}\n`;
          slide.bullets.forEach((b: string) => { content += `* ${b}\n`; });
          content += `\n`;
        });
      }
      const textBlob = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
      const link = document.createElement("a");
      link.setAttribute("href", textBlob);
      link.setAttribute("download", `${file.title.toLowerCase().replace(/\s+/g, '_')}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    else if (format === "svg" && file.type === "diagram") {
      // Build dynamic scalable vector graphics template xml text buffer
      let svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" style="background:#050507; font-family:monospace; color:#fff;">`;
      
      // Arrow marker definitions
      svgText += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#FF3E00"/></marker></defs>`;
      
      // Draw Connections first
      file.data.edges.forEach((edge: any) => {
        const from = file.data.nodes.find((n: any) => n.id === edge.from);
        const to = file.data.nodes.find((n: any) => n.id === edge.to);
        if (from && to) {
          const x1 = from.x + 80; const y1 = from.y + 25;
          const x2 = to.x + 80; const y2 = to.y + 25;
          svgText += `<path d="M ${x1} ${y1} Q ${(x1+x2)/2} ${(y1+y2)/2 - 30} ${x2} ${y2}" stroke="#FF3E00" stroke-width="1.5" fill="none" marker-end="url(#arrow)" />`;
          svgText += `<text x="${(x1+x2)/2}" y="${(y1+y2)/2 - 14}" fill="#FFA380" font-size="9" text-anchor="middle">${edge.label}</text>`;
        }
      });

      // Draw Nodes
      file.data.nodes.forEach((node: any) => {
        const fill = node.bg || "rgba(255,255,255,0.05)";
        const border = node.border || "#fff";
        svgText += `<g><rect x="${node.x}" y="${node.y}" width="160" height="50" rx="6" fill="${fill}" stroke="${border}" stroke-width="1.5" />`;
        svgText += `<text x="${node.x + 80}" y="${node.y + 29}" fill="#FFF" font-size="10" font-weight="bold" text-anchor="middle">${node.label}</text></g>`;
      });

      svgText += `</svg>`;
      const svgContent = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
      const link = document.createElement("a");
      link.setAttribute("href", svgContent);
      link.setAttribute("download", `${file.title.toLowerCase().replace(/\s+/g, '_')}.svg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div ref={ddRef} className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-1.5 bg-[#FF3E00] hover:bg-[#E03700] text-white rounded text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Export Node
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-1.5 w-48 bg-[#0F0F12] border border-white/10 rounded-lg shadow-2xl p-2 z-[100]"
          >
            <div className="px-3 py-1.5 border-b border-white/5 mb-1 text-[8px] font-mono uppercase text-white/30 tracking-widest">
              Available Pipes
            </div>
            
            {file.type === "spreadsheet" && (
              <>
                <button 
                  onClick={() => triggerExport("xlsx")}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 text-white/70 hover:text-[#FF3E00] transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm cursor-pointer"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Excel Workbook (XLSX)
                </button>
                <button 
                  onClick={() => triggerExport("csv")}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 text-white/70 hover:text-[#FF3E00] transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Structured CSV
                </button>
              </>
            )}

            {file.type === "diagram" && (
              <button 
                onClick={() => triggerExport("svg")}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 text-white/70 hover:text-blue-400 transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm cursor-pointer"
              >
                <GitCommit className="w-3.5 h-3.5" />
                Scalable SVG
              </button>
            )}

            {file.type === "presentation" && (
              <button 
                onClick={() => triggerExport("pdf")}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 text-white/70 hover:text-violet-400 transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                Print Presentation PDF
              </button>
            )}

            {file.type === "spreadsheet" && (
              <button 
                onClick={() => triggerExport("pdf")}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 text-white/70 hover:text-violet-400 transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Data Report PDF
              </button>
            )}

            <button 
              onClick={() => triggerExport("txt")}
              className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 text-white/70 hover:text-neutral-300 transition-all text-[10px] font-mono tracking-widest uppercase rounded-sm cursor-pointer"
            >
              <FilePlay className="w-3.5 h-3.5" />
              Plain Text (TXT)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
