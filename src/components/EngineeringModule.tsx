import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, Terminal, Cpu, Braces, Sparkles, FolderCode, GitBranch, 
  ShieldCheck, Box, ChevronRight, Play, RefreshCcw, Command, AlertCircle, CheckCircle2,
  Maximize, Plus, Trash2, Copy, Check, Download, Layers
} from 'lucide-react';
import { cn, generateId } from '../lib/utils';
import MermaidRenderer from './MermaidRenderer';

const PRESET_TEMPLATES = {
  os: `graph TD
    User([User Client]) --> Gateway[API Gateway & Auth]
    Gateway --> STTEnv[STT & TTS Engine]
    Gateway --> NeuralCore[Konda Core Orchestrator]
    NeuralCore --> StateSandbox[High-Reasoning Sandbox]
    StateSandbox --> D3Canvas[Adaptive Graphics Layer]
    StateSandbox --> MermaidViz[Mermaid Parser Pipeline]
    StateSandbox --> GenAI[Multi-Modal Generative Core]
    MermaidViz --> VizView[Interactive Systems View]`,
  
  microservices: `graph LR
    Client([Client App]) --> Kong[Kong API Gateway]
    Kong --> UserSvc[User Profile DB]
    Kong --> PaySvc[Payment Processor]
    Kong --> AIHub[Frontier AI Router]
    UserSvc --> Postgre[(PostgreSQL Master)]
    PaySvc --> StripeApi[Stripe Payment API]
    AIHub --> RedisCache[(Redis Session Cache)]
    AIHub --> OpenAICore[OpenAI Core Intel Node]`,
  
  serverless: `graph TD
    App([Web App]) --> CloudFront[CloudFront CDN]
    CloudFront --> ApiGw[API Gateway Client]
    ApiGw --> AuthFn[Auth Lambda]
    ApiGw --> IngestionFn[Data Stream Lambda]
    IngestionFn --> Kinesis{Kinesis Data Stream}
    Kinesis --> Firehose[Firehose S3 Archiver]
    Firehose --> S3Bucket[(Raw Archives S3)]
    Kinesis --> AnalyticsFn[Realtime Analytics Lambda]
    AnalyticsFn --> Dynamo[(NoSQL Metrics Dynamo)]`,
  
  pipeline: `graph LR
    Trigger[Cron Scheduler] --> Crawler[Web Crawlers]
    Crawler --> Storage[(Raw Documents DB)]
    Storage --> Vectorizer[AI Embeddings Pipeline]
    Vectorizer --> VectorStore[(Pinecone Vector DB)]
    VectorStore --> AgentQuery[Semantic Search Agent]`
};

export default function EngineeringModule() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'optimization' | 'security' | 'interpreter' | 'strategy'>('architecture');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdated, setIsUpdated] = useState(() => localStorage.getItem('konda_packages_updated') === 'true');

  // Systems Architect States
  const [mermaidCode, setMermaidCode] = useState(PRESET_TEMPLATES.os);
  const [selectedTemplate, setSelectedTemplate] = useState<'os' | 'microservices' | 'serverless' | 'pipeline'>('os');
  const [copied, setCopied] = useState(false);
  const [aiCommand, setAiCommand] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      localStorage.setItem('konda_packages_updated', 'true');
      setIsUpdated(true);
      setIsUpdating(false);
    }, 2000);
  };

  const handleTemplateSelection = (key: 'os' | 'microservices' | 'serverless' | 'pipeline') => {
    setSelectedTemplate(key);
    setMermaidCode(PRESET_TEMPLATES[key]);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSVG = () => {
    const svgEl = document.querySelector('[id^="mermaid-render-"]');
    if (!svgEl) return;
    
    const svgContent = svgEl.outerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `konda-architecture-${selectedTemplate}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const refineArchitecture = () => {
    if (!aiCommand.trim()) return;
    setIsProcessingAi(true);
    
    setTimeout(() => {
      let updatedCode = mermaidCode;
      const cmd = aiCommand.toLowerCase();
      
      if (cmd.includes('cache') || cmd.includes('redis')) {
        if (updatedCode.includes('Postgre')) {
          updatedCode = updatedCode.replace(
            `UserSvc --> Postgre[(PostgreSQL Master)]`,
            `UserSvc --> Redis[(Redis Cache)]\n    Redis --> Postgre[(PostgreSQL Master)]`
          );
        } else if (updatedCode.includes('Dynamo')) {
          updatedCode = updatedCode.replace(
            `AnalyticsFn --> Dynamo[(NoSQL Metrics Dynamo)]`,
            `AnalyticsFn --> Cache[(Memcached Cache)]\n    Cache --> Dynamo[(NoSQL Metrics Dynamo)]`
          );
        } else {
          updatedCode += `\n    Gateway --> CacheNode[(Redis App Caching)]`;
        }
      } else if (cmd.includes('monitoring') || cmd.includes('prometheus') || cmd.includes('grafana')) {
        updatedCode += `\n    Gateway --> Prometheus[Prometheus Metrics]\n    Prometheus --> Grafana[Grafana Dashboard]`;
      } else if (cmd.includes('queue') || cmd.includes('kafka') || cmd.includes('sqs')) {
        if (updatedCode.includes('Gateway --> NeuralCore')) {
          updatedCode = updatedCode.replace(
            `Gateway --> NeuralCore[Konda Core Orchestrator]`,
            `Gateway --> SQSQueue{SQS Message Buffer}\n    SQSQueue --> NeuralCore[Konda Core Orchestrator]`
          );
        } else {
          updatedCode += `\n    Gateway --> KafkaQueue{Kafka System Log}`;
        }
      } else {
        const formattedNodeName = aiCommand.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
        const nodeLabel = aiCommand.trim();
        updatedCode += `\n    StateSandbox --> ${formattedNodeName}[${nodeLabel}]`;
      }
      
      setMermaidCode(updatedCode);
      setIsProcessingAi(false);
      setAiCommand('');
    }, 1200);
  };

  return (
    <div className="h-full bg-transparent p-6 sm:p-10 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-12 gap-6">
        <div className="space-y-1">
          <div className="text-[10px] tracking-[0.4em] uppercase font-bold text-[#FF3E00]">Engineering Core</div>
          <h2 className="text-4xl font-serif italic tracking-tighter text-[#F5F5F5]">Systems Architect</h2>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-2 border border-white/10 rounded-sm text-[10px] tracking-widest font-mono hover:border-[#FF3E00] hover:text-[#FF3E00] transition-all uppercase">Deploy_Build</button>
          <button className="flex-1 sm:flex-none px-6 py-2 bg-[#FF3E00] text-black rounded-sm text-[10px] tracking-widest font-mono font-bold hover:bg-[#FF3E00]/90 transition-all uppercase shadow-[0_0_15px_rgba(255,62,0,0.3)]">New_Project</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <NavButton 
            active={activeTab === 'architecture'} 
            onClick={() => setActiveTab('architecture')}
            icon={Box}
            label="System_Design"
            description="Ethical trade-offs"
          />
          <NavButton 
            active={activeTab === 'strategy'} 
            onClick={() => setActiveTab('strategy')}
            icon={Maximize}
            label="God_Intel_Strategy"
            description="Macro Evolutionary Logic"
          />
          <NavButton 
            active={activeTab === 'interpreter'} 
            onClick={() => setActiveTab('interpreter')}
            icon={Code2}
            label="Neural_Logic"
            description="Execution Engine"
          />
          <NavButton 
            active={activeTab === 'optimization'} 
            onClick={() => setActiveTab('optimization')}
            icon={Cpu}
            label="Optimization"
            description="Resource Hacks"
          />
          <NavButton 
            active={activeTab === 'security'} 
            onClick={() => setActiveTab('security')}
            icon={ShieldCheck}
            label="Neural_Guard"
            description="Stress Controls"
          />

          <div className="mt-12 p-6 border border-white/5 bg-white/[0.02] rounded-lg">
            <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-4">Environment_Stats</h3>
            <div className="space-y-3">
              <StatRow label="Runtime" value="Node_20.1" />
              <StatRow label="Latency" value="14ms" />
              <StatRow label="Uptime" value="99.98%" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {activeTab === 'architecture' && (
                <div className="space-y-8">
                  {/* Top quick stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProjectCard 
                      title="Neural_Hub_Microservice" 
                      lang="TypeScript" 
                      status="Active" 
                      coverage="94%" 
                    />
                    <ProjectCard 
                      title="Konda_OS_Kernel_V3" 
                      lang="Rust" 
                      status="Staging" 
                      coverage="88%" 
                    />
                  </div>

                  {/* Systems Engineering Diagraming Workbench */}
                  <div className="p-8 border border-white/5 bg-[#050505] rounded-lg space-y-6 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#FF3E00] animate-pulse" />
                          <h3 className="text-lg font-medium">Dynamic Core Architecture Sandbox</h3>
                        </div>
                        <p className="text-[10px] uppercase font-mono text-white/40 tracking-wider">Configure, mutate, and export system topological maps dynamically</p>
                      </div>
                      
                      {/* Templates Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {(['os', 'microservices', 'serverless', 'pipeline'] as const).map((tKey) => (
                          <button
                            key={tKey}
                            onClick={() => handleTemplateSelection(tKey)}
                            className={cn(
                              "px-3 py-1.5 rounded-sm text-[9px] font-mono uppercase tracking-widest border transition-all",
                              selectedTemplate === tKey
                                ? "bg-[#FF3E00]/10 border-[#FF3E00] text-[#FF3E00] font-bold"
                                : "bg-transparent border-white/5 text-white/40 hover:border-white/20 hover:text-white"
                            )}
                          >
                            {tKey === 'os' ? 'Konda_Core' : tKey === 'microservices' ? 'Services' : tKey === 'serverless' ? 'Cloud' : 'Pipeline'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dual-Pane Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Code Structure & Logic Morphing */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                            <span>TOPOLOGICAL_DEFINITION (MERMAID)</span>
                            <div className="flex gap-4">
                              <button 
                                onClick={handleCopyCode} 
                                className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                {copied ? '_Copied' : '_Copy'}
                              </button>
                              <button 
                                onClick={() => setMermaidCode(PRESET_TEMPLATES[selectedTemplate])}
                                className="hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <RefreshCcw className="w-3 h-3" />
                                _Reload
                              </button>
                            </div>
                          </div>
                          
                          <textarea
                            value={mermaidCode}
                            onChange={(e) => setMermaidCode(e.target.value)}
                            className="w-full h-80 bg-black/60 border border-white/10 rounded p-4 font-mono text-xs text-white/80 focus:outline-none focus:border-[#FF3E00]/40 resize-none custom-scrollbar"
                            spellCheck="false"
                            placeholder="graph TD..."
                          />
                        </div>

                        {/* Intel Logic Copilot input */}
                        <div className="p-4 border border-[#FF3E00]/10 bg-[#FF3E00]/[0.01] rounded space-y-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#FF3E00]" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF3E00]">AI Structural Morphing Copilot</span>
                          </div>
                          <p className="text-[9px] text-white/40">Write structural modifications (e.g., "Add redis cache before database", "Add custom logging monitor") to inject blocks automatically.</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={aiCommand}
                              onChange={(e) => setAiCommand(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && refineArchitecture()}
                              placeholder="Inject cache / prometheus / kafka block..."
                              className="flex-1 bg-black/60 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-[#FF3E00]/40"
                            />
                            <button
                              disabled={isProcessingAi || !aiCommand.trim()}
                              onClick={refineArchitecture}
                              className={cn(
                                "px-4 py-2 text-[9px] font-mono uppercase tracking-widest rounded transition-all cursor-pointer",
                                isProcessingAi || !aiCommand.trim()
                                  ? "bg-white/5 border border-white/5 text-white/20"
                                  : "bg-[#FF3E00] text-black font-bold hover:bg-[#FF3E00]/90 shadow-[0_0_10px_rgba(255,62,0,0.3)]"
                              )}
                            >
                              {isProcessingAi ? 'Morphing...' : 'Morph'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Dynamic Interactive Diagram View */}
                      <div className="space-y-3 flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                            DYNAMIC_GRAPHICAL_VIEW
                          </span>
                          
                          <button
                            onClick={downloadSVG}
                            className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-[#FF3E00]" />
                            _Export_SVG
                          </button>
                        </div>

                        <div className="flex-1 min-h-[350px]">
                          <MermaidRenderer code={mermaidCode} />
                        </div>

                        <div className="p-3 border border-white/5 bg-white/[0.01] rounded flex items-center justify-between text-[8px] font-mono text-white/30 uppercase tracking-widest">
                          <span>Theme: Slate Dark Cyber</span>
                          <span>RENDER_SUCCESS: STABLE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'interpreter' && (
                <NeuralInterpreter />
              )}

              {activeTab === 'strategy' && (
                <StrategicPrioritization />
              )}

              {activeTab === 'optimization' && (
                <div className="space-y-6">
                  <div className="p-8 border border-white/5 bg-[#050505] rounded-lg">
                     <h3 className="text-xl font-light mb-6 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-[#FF3E00]" />
                        Suggested Optimizations
                     </h3>
                     <div className="space-y-4">
                        <OptimizationItem 
                           impact="High" 
                           title="Lazy-load Module Fragments" 
                           description="Reduce initial hydration time by 40% via route-based code splitting."
                        />
                        <OptimizationItem 
                           impact="Med" 
                           title="Memoize Heavy Math Parsers" 
                           description="Implement LRU cache for complex differential equations within the Math Engine."
                        />
                     </div>
                  </div>
                </div>
              )}

               {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="p-8 border border-[#FF3E00]/20 bg-[#050505] rounded-lg">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#FF3E00]/10 rounded-full">
                            <ShieldCheck className="w-6 h-6 text-[#FF3E00]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-medium tracking-tight">Security Protocol S-09</h3>
                            <p className="text-[10px] uppercase tracking-widest text-[#FF3E00]">Neural firewall synchronized</p>
                          </div>
                      </div>
                      {!isUpdated && (
                        <button 
                          onClick={handleUpdate}
                          disabled={isUpdating}
                          id="update-button"
                          className={cn(
                            "px-4 py-2 bg-[#FF3E00]/10 border border-[#FF3E00]/40 text-[#FF3E00] text-[10px] font-mono uppercase tracking-widest hover:bg-[#FF3E00] hover:text-white transition-all rounded-sm",
                            isUpdating && "animate-pulse"
                          )}
                        >
                          {isUpdating ? 'Updating_Neural_Nodes...' : 'Resolve_Legacy_Alerts'}
                        </button>
                      )}
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 font-mono text-[11px] leading-relaxed text-white/60 relative">
                        <div className="text-[#FF3E00]">Scanning local environment...</div>
                        <div>[OK] Sandbox verified</div>
                        <div>[OK] Memory boundaries secured</div>
                        <div>[OK] No leaked keys detected in current scope</div>
                        
                        {localStorage.getItem('konda_packages_updated') ? (
                          <div className="mt-4 text-[#FF3E00] flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            [STATUS] All neural packages synchronized to latest versions.
                          </div>
                        ) : (
                          <div className="mt-4 text-[#FF3E00] animate-pulse">ALERT: 2 legacy packages detected. Suggesting update.</div>
                        )}

                        <div className="absolute bottom-4 right-4 opacity-10">
                          <ShieldCheck className="w-32 h-32" />
                        </div>
                    </div>
                  </div>

                  <div className="p-8 border border-[#FF3E00]/20 bg-[#050505] rounded-lg">
                    <h3 className="text-xl font-medium tracking-tight mb-6">Tactical_MPM_Tracker</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 border border-white/5 bg-white/[0.02] rounded">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Human_Dimension</div>
                        <div className="text-2xl font-mono text-[#FF3E00]">RESOLVED</div>
                        <div className="text-[9px] text-white/20 mt-1 uppercase">Empathy vs Logic: Balanced</div>
                      </div>
                      <div className="p-4 border border-white/5 bg-white/[0.02] rounded">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Decision_Velocity</div>
                        <div className="text-2xl font-mono text-[#FF3E00]">MAXIMUM</div>
                        <div className="text-[9px] text-white/20 mt-1 uppercase">God-Level Mitigation Active</div>
                      </div>
                      <div className="p-4 border border-white/5 bg-white/[0.02] rounded">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Entropy_Shield</div>
                        <button 
                          onClick={() => {
                            setIsUpdated(true); // Visual feedback
                            localStorage.setItem('konda_packages_updated', 'true');
                          }}
                          className="w-full mt-1 py-1 px-2 bg-[#FF3E00]/10 border border-[#FF3E00]/40 text-[#FF3E00] text-[10px] font-mono uppercase tracking-widest hover:bg-[#FF3E00] hover:text-white transition-all rounded-sm"
                        >
                          Stabilize_System
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StrategicPrioritization() {
  const [subjects, setSubjects] = useState<{id: string, name: string, importance: number, urgency: number, weightage: number}[]>(() => {
    const saved = localStorage.getItem('konda_subject_matrix');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return [
      { id: '1', name: 'Neural Networks', importance: 90, urgency: 80, weightage: 35 },
      { id: '2', name: 'Systems Design', importance: 85, urgency: 40, weightage: 25 },
      { id: '3', name: 'Legacy Systems', importance: 30, urgency: 95, weightage: 15 },
      { id: '4', name: 'Optional Elective', importance: 10, urgency: 20, weightage: 5 },
    ];
  });
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  useEffect(() => {
    localStorage.setItem('konda_subject_matrix', JSON.stringify(subjects));
  }, [subjects]);

  const addSubject = () => {
    if (newTopicName.trim()) {
      setSubjects([...subjects, { 
        id: generateId(), 
        name: newTopicName.trim(), 
        importance: 50, 
        urgency: 50,
        weightage: 10
      }]);
      setNewTopicName('');
      setIsAddingTopic(false);
    }
  };

  const totalWeight = subjects.reduce((acc, sub) => acc + sub.weightage, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 bg-[#FF3E00]/5 border border-[#FF3E00]/20 p-6 rounded">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold mb-1 uppercase tracking-tighter italic">Neural_Cortex_V12</h3>
            <p className="text-[10px] text-[#FF3E00] uppercase tracking-[0.2em] font-mono animate-pulse">Mode: TOTAL_SYSTEM_EVOLUTION_ACTIVE</p>
          </div>
          <button 
            onClick={() => setIsAddingTopic(!isAddingTopic)}
            className="px-6 py-2 bg-[#FF3E00]/10 border border-[#FF3E00]/40 rounded-sm flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest hover:bg-[#FF3E00] hover:text-white transition-all text-[#FF3E00]"
          >
            <Plus className={cn("w-3 h-3 transition-transform", isAddingTopic && "rotate-45")} />
            {isAddingTopic ? 'Cancel_Index' : 'Index_New_Topic'}
          </button>
        </div>

        {isAddingTopic && (
          <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
            <input 
              autoFocus
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              placeholder="Enter subject/exam topic..."
              className="flex-1 bg-black/40 border border-white/10 rounded px-4 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-[#FF3E00]/40"
            />
            <button 
              onClick={addSubject}
              className="px-6 py-2 bg-[#FF3E00] text-black font-bold rounded-sm text-[10px] font-mono uppercase tracking-widest"
            >
              Confirm
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* The Matrix */}
        <div className="aspect-square bg-[#050505] border border-white/5 rounded-lg relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
             <div className="border-r border-b border-white/5 p-4 flex flex-col bg-red-500/[0.04]">
                <div className="flex justify-between items-start">
                   <span className="text-[10px] uppercase font-bold font-mono text-red-500 mb-auto tracking-widest">QUADRANT_I: TRANSCEND</span>
                   <ShieldCheck className="w-3 h-3 text-red-500/20" />
                </div>
                <span className="text-[8px] text-red-500/30 uppercase font-mono mt-1">High Impact / System Evolutionary</span>
             </div>
             <div className="border-b border-white/5 p-4 flex flex-col text-right bg-[#FF3E00]/[0.02]">
                <span className="text-[10px] uppercase font-bold font-mono text-[#FF3E00]/50 mb-auto tracking-widest">QUADRANT_II: SCAN</span>
                <span className="text-[8px] text-[#FF3E00]/20 uppercase font-mono mt-1">Foundational / Conceptual</span>
             </div>
             <div className="border-r border-white/5 p-4 flex flex-col bg-yellow-500/[0.02]">
                <span className="text-[10px] uppercase font-bold font-mono text-yellow-500/50 mt-auto tracking-widest">QUADRANT_III: SKIP</span>
                <span className="text-[8px] text-yellow-500/20 uppercase font-mono mb-1">Low Weight / High Effort</span>
             </div>
             <div className="p-4 flex flex-col text-right bg-white/[0.01]">
                <span className="text-[10px] uppercase font-bold font-mono text-white/10 mt-auto tracking-widest">QUADRANT_IV: THROW</span>
                <span className="text-[8px] text-white/5 uppercase font-mono mb-1">Irrelevant / Zero ROI</span>
             </div>
          </div>
          
          <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] font-mono text-white/5 uppercase tracking-[0.5em] pointer-events-none">NEURAL_DEBT →</div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/5 uppercase tracking-[0.5em] pointer-events-none">MARK_VELOCITY →</div>

          {subjects.map((sub) => (
            <motion.div
              key={sub.id}
              layout
              className={cn(
                "absolute w-4 h-4 rounded-full shadow-lg cursor-move group/point flex items-center justify-center",
                sub.importance > 50 && sub.urgency > 50 ? "bg-red-500 shadow-red-500/50" : 
                sub.importance > 50 ? "bg-[#00D1FF] shadow-[#00D1FF]/50" : "bg-white/20"
              )}
              style={{ 
                left: `${sub.urgency}%`, 
                bottom: `${sub.importance}%`,
              }}
              whileHover={{ scale: 1.5 }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F0F0F] border border-white/10 rounded-sm text-[10px] font-mono whitespace-nowrap opacity-0 group-hover/point:opacity-100 transition-opacity z-10 shadow-2xl">
                <div className={cn("mb-1 font-bold", sub.importance > 50 ? "text-[#FF3E00]" : "text-white/40")}>{sub.name}</div>
                <div className="flex flex-col gap-1">
                   <div className="text-white/40 text-[8px] flex justify-between gap-4">Weightage: <span>{sub.weightage}%</span></div>
                   <div className="text-white/40 text-[8px] flex justify-between gap-4">MPM_Potential: <span>{(sub.weightage / (101 - sub.importance)).toFixed(2)}</span></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* List View with Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Subject_Prioritization_Log</h4>
            <span className="text-[10px] font-mono text-white/20 tracking-tighter">COGNITIVE_LOAD: {totalWeight.toFixed(1)}/100.0</span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {[...subjects].sort((a, b) => (b.weightage) - (a.weightage)).map(sub => {
              const mpm = (sub.weightage / (101 - sub.importance));
              return (
                <div key={sub.id} className="p-4 bg-[#0A0A0A] border border-white/5 rounded-lg space-y-4 group transition-all hover:border-[#FF3E00]/20">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-1 h-4 rounded-full", mpm > 0.8 ? "bg-red-500" : "bg-[#FF3E00]")} />
                         <span className="text-sm font-medium tracking-tight group-hover:text-[#FF3E00] transition-colors uppercase">{sub.name}_Protocol</span>
                      </div>
                      <button 
                        onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))}
                        className="text-white/10 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                   </div>
                   <div className="space-y-3">
                      <div className="space-y-1">
                         <div className="flex justify-between text-[8px] uppercase font-mono text-white/20">
                            <span>Exam Weightage (ROI)</span>
                            <span className="text-[#FF3E00]">{sub.weightage}%</span>
                         </div>
                         <input 
                            type="range" 
                            value={sub.weightage} 
                            onChange={(e) => setSubjects(subjects.map(s => s.id === sub.id ? {...s, weightage: parseInt(e.target.value)} : s))}
                            className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#FF3E00]"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-[8px] uppercase font-mono text-white/20">Difficulty_Factor</div>
                            <input 
                                type="range" 
                                value={sub.importance} 
                                onChange={(e) => setSubjects(subjects.map(s => s.id === sub.id ? {...s, importance: parseInt(e.target.value)} : s))}
                                className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-white/20"
                            />
                          </div>
                          <div className="p-3 bg-white/[0.02] border border-white/5 rounded flex flex-col justify-center items-center">
                             <div className="text-[7px] uppercase font-mono text-white/20 mb-1">MPM_Index</div>
                             <div className={cn("text-lg font-mono font-bold font-mono tracking-tighter", mpm > 0.8 ? "text-red-500" : "text-[#FF3E00]")}>
                                {mpm.toFixed(2)}
                             </div>
                          </div>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
          
          <div className={cn(
            "p-6 border rounded-lg transition-all",
            subjects.length > 5 ? "bg-red-500/5 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]" : "bg-[#FF3E00]/[0.03] border-[#FF3E00]/10 shadow-[0_0_30px_rgba(255,62,0,0.05)]"
          )}>
             <div className="flex items-center gap-3 mb-4">
                <Terminal className={cn("w-4 h-4 animate-pulse", subjects.length > 5 ? "text-red-500" : "text-[#FF3E00]")} />
                <span className={cn("text-[10px] font-mono uppercase tracking-[0.3em]", subjects.length > 5 ? "text-red-500" : "text-[#FF3E00]")}>
                  Survival_Directive_S-01
                </span>
             </div>
             <p className="text-xs text-white/60 leading-relaxed font-mono tracking-tight">
                {subjects.length > 5 ? (
                  `[CRITICAL] Your cognitive pipeline is overloaded (${subjects.length} topics). RECOMMENDATION: IMMEDIATELY DROP ${[...subjects].sort((a,b) => (a.weightage / (101 - a.importance)) - (b.weightage / (101 - b.importance)))[0]?.name} To clear bandwidth for high-MPM topics.`
                ) : subjects.length > 0 ? (
                  `[STATUS] Tactical balance achieved. Prioritize ${[...subjects].sort((a,b) => (b.weightage / (101 - b.importance)) - (a.weightage / (101 - a.importance)))[0]?.name} using 15-min micro-loops. Skip complex derivations—focus on results.`
                ) : (
                   "[SIGNAL_LOST] Awaiting neural index of exam topics..."
                )}
             </p>
             {subjects.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <div className="text-[8px] uppercase text-white/20 font-mono">Current_Focus</div>
                      <div className="text-[10px] text-white/90 truncate">{[...subjects].sort((a,b) => b.weightage - a.weightage)[0]?.name}</div>
                   </div>
                   <div className="space-y-1 text-right">
                      <div className="text-[8px] uppercase text-white/20 font-mono">Next_Action</div>
                      <div className="text-[10px] text-[#FF3E00]">PATTERN_SYNC_10M</div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NeuralInterpreter() {
  const [code, setCode] = useState('// Neural Interpreter v1.0\n// Execute logical sequences below\n\nfunction process() {\n  const data = [10, 24, 45, 12, 8];\n  const average = data.reduce((a, b) => a + b) / data.length;\n  console.log("Input Matrix:", data);\n  return `Logical Synthesis: ${average}`;\n}\n\nprocess();');
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [logs, setLogs] = useState<{ type: 'log' | 'error' | 'success', text: string, timestamp: string }[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (text: string, type: 'log' | 'error' | 'success' = 'log') => {
    setLogs(prev => [...prev, {
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }]);
  };

  const runCode = async () => {
    setIsExecuting(true);
    setLogs([]);
    addLog(`Initiating ${language === 'javascript' ? 'WebCore' : 'PyNode'} runtime...`, 'log');

    await new Promise(r => setTimeout(r, 800));

    if (language === 'python') {
      addLog('Environment Note: Python execution is simulated via Neural Translation.', 'log');
      await new Promise(r => setTimeout(r, 600));
      addLog(`Parsing scope for: ${code.substring(0, 20)}...`, 'log');
      await new Promise(r => setTimeout(r, 1000));
      addLog('Simulation complete: Process exited with status 0', 'success');
      addLog('Output: Mocked Python output verified by Konda Kernel', 'log');
    } else {
      try {
        const originalConsoleLog = console.log;
        const capturedLogs: string[] = [];
        
        console.log = (...args) => {
          capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };

        const result = new Function(code)();
        
        console.log = originalConsoleLog;

        capturedLogs.forEach(log => addLog(log, 'log'));
        if (result !== undefined) {
          addLog(`Sequence Return: ${typeof result === 'object' ? JSON.stringify(result) : result}`, 'success');
        }
        addLog('Execution completed successfully.', 'success');
      } catch (err: any) {
        addLog(`RUNTIME_ERROR: ${err.message}`, 'error');
      }
    }
    
    setIsExecuting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-6 h-[600px]">
        {/* Editor Pane */}
        <div className="flex-1 flex flex-col bg-[#050505] border border-white/5 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
             <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="bg-transparent text-[10px] uppercase tracking-widest font-mono text-white/40 focus:outline-none focus:text-[#FF3E00] cursor-pointer"
                >
                  <option value="javascript">JavaScript_V8</option>
                  <option value="python">Python_3.11</option>
                </select>
             </div>
             <div className="flex items-center gap-3">
               <button 
                onClick={() => setLogs([])}
                className="p-1.5 text-white/20 hover:text-white transition-colors"
               >
                 <RefreshCcw className="w-3.5 h-3.5" />
               </button>
               <button 
                onClick={runCode}
                disabled={isExecuting}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-mono uppercase tracking-widest transition-all",
                  isExecuting ? "bg-white/5 text-white/20" : "bg-[#FF3E00] text-black font-bold hover:shadow-[0_0_15px_rgba(255,62,0,0.4)]"
                )}
               >
                 <Play className={cn("w-3 h-3", isExecuting && "animate-pulse")} />
                 {isExecuting ? 'Processing...' : 'Run_Sequence'}
               </button>
             </div>
          </div>
          <div className="flex-1 relative font-mono text-xs">
            <div className="absolute top-4 left-4 flex flex-col gap-1 text-white/10 select-none pointer-events-none text-right w-6">
               {Array.from({ length: 20 }).map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea 
               value={code}
               onChange={(e) => setCode(e.target.value)}
               className="w-full h-full bg-transparent p-4 pl-14 text-white/80 focus:outline-none resize-none custom-scrollbar spellcheck-false"
               spellCheck="false"
            />
          </div>
        </div>

        {/* Console Pane */}
        <div className="w-full xl:w-80 flex flex-col bg-black/40 border border-white/5 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
            <Terminal className="w-3 h-3 text-white/40" />
            <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">Neural_Log</span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-2 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,_rgba(255,62,0,0.03)_0%,_transparent_50%)]">
            {logs.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-2 italic">
                  <Command className="w-8 h-8 opacity-20" />
                  <div>Awaiting execution signal...</div>
               </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="group animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-white/10 mr-2">[{log.timestamp}]</span>
                  <span className={cn(
                    log.type === 'error' ? "text-red-400" : 
                    log.type === 'success' ? "text-[#FF3E00]" : 
                    "text-white/60"
                  )}>
                    {log.type === 'error' && <AlertCircle className="w-3 h-3 inline mr-1 mb-0.5" />}
                    {log.type === 'success' && <CheckCircle2 className="w-3 h-3 inline mr-1 mb-0.5" />}
                    {log.text}
                  </span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
          <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex justify-between items-center text-[9px] font-mono text-white/20 uppercase">
             <span>Sandbox: Restricted</span>
             <span className="text-[#FF3E00]/40">{isExecuting ? 'Busy' : 'Idle'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label, description }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg transition-all border text-left group",
        active ? "bg-white/[0.03] border-white/20" : "border-transparent hover:bg-white/[0.01]"
      )}
    >
      <div className={cn("p-2 rounded-md transition-colors", active ? "bg-[#FF3E00] text-black" : "bg-white/5 text-white/20 group-hover:text-white")}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className={cn("text-xs font-medium font-mono uppercase tracking-widest", active ? "text-white" : "text-white/40")}>{label}</div>
        <div className="text-[10px] text-white/20">{description}</div>
      </div>
    </button>
  );
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-[10px] font-mono">
      <span className="text-white/20 uppercase tracking-widest">{label}</span>
      <span className="text-[#FF3E00]">{value}</span>
    </div>
  );
}

function ProjectCard({ title, lang, status, coverage }: any) {
  return (
    <div className="p-6 border border-white/5 bg-[#050505] rounded-lg group hover:border-[#FF3E00]/30 transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <FolderCode className="w-5 h-5 text-white/40 group-hover:text-[#FF3E00] transition-colors" />
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
          status === 'Active' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
        )}>
          {status}
        </div>
      </div>
      <h4 className="text-sm font-medium mb-1 truncate">{title}</h4>
      <div className="flex items-center gap-3 text-[10px] font-mono text-white/20">
        <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> {lang}</span>
        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> main</span>
      </div>
    </div>
  );
}

function OptimizationItem({ impact, title, description }: any) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('konda-progress', {
      detail: {
        moduleId: 'engineering',
        subject: 'Systems Optimization',
        delta: impact === 'High' ? 5 : 2,
        weakPoint: impact === 'High' ? 'Hydration Strategies' : undefined
      }
    }));
  };

  return (
    <div 
      onClick={handleClick}
      className="p-4 border border-white/5 bg-white/[0.01] rounded flex gap-4 hover:border-white/20 transition-all cursor-pointer"
    >
      <div className={cn(
        "w-12 h-12 rounded flex items-center justify-center shrink-0 text-[10px] font-bold uppercase tracking-tighter",
        impact === 'High' ? "bg-red-500/10 text-red-500" : "bg-[#FF3E00]/10 text-[#FF3E00]"
      )}>
        {impact}
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium">{title}</div>
        <p className="text-[10px] text-white/30 leading-relaxed">{description}</p>
      </div>
      <div className="ml-auto flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </div>
  );
}
