import React, { Component, ErrorInfo } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Brain,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Clock
} from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isStackVisible: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isStackVisible: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Bujji Kernel Encountered Runtime Crash:', error, errorInfo);
  }

  handleRestart = () => {
    window.location.reload();
  };

  handleFlushAndRestart = () => {
    try {
      // Clear key storage units
      localStorage.removeItem('konda_messages');
      localStorage.removeItem('bujji_mood');
      localStorage.removeItem('konda_theme');
      // Or simply clear all if it's corrupt
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to flush storage cache:', e);
    }
  };

  handleDownloadLogs = () => {
    try {
      const errorStr = this.state.error?.toString() || 'Unknown Error';
      const stackStr = this.state.error?.stack || 'No Stack Available';
      const componentStack = this.state.errorInfo?.componentStack || 'No Component Stack Info';
      
      const fileContent = `=====================================================
  BUJJI SYSTEM OS - FLIGHT RECOVERY DIAGNOSTIC LOG
=====================================================
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Status Code: SEVERE_FATAL_RENDER_FAULT
Model Pipeline: Dynamic AI Core

----- [CRITICAL FAULT STRING] -----
${errorStr}

----- [RUNTIME ERROR STACK] -----
${stackStr}

----- [REACT COMPONENT STRUCTURE STACK] -----
${componentStack}

----- [DEVICE CACHE PROFILE] -----
Session Storage Available: ${typeof sessionStorage !== 'undefined'}
Local Storage Length: ${typeof localStorage !== 'undefined' ? localStorage.length : 'N/A'}

=====================================================
END OF DIAGNOSTIC FLIGHT REPORT. BUJJI SAYS: 'STAY COOL, BOSS!'
=====================================================`;

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bujji_flight_history_crash_${Date.now()}.log`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Critical Recovery Fail: Unable to compile logs file: ${err}`);
    }
  };

  toggleStack = () => {
    this.setState(prev => ({ isStackVisible: !prev.isStackVisible }));
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'A severe algorithmic loop anomaly occurred.';
      const errorStack = this.state.error?.stack || '';

      return (
        <div id="error-boundary-screen" className="min-h-screen bg-[#040404] text-white flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-[#FF3E00]/30 selection:text-[#FF3E00]">
          {/* Futuristic Background Grids */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-[#FF3E00]/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Primary Dialog Shell */}
          <div id="error-boundary-card" className="w-full max-w-2xl bg-[#090909]/90 border border-red-500/15 rounded-3xl p-6 md:p-8 shadow-[0_0_100px_rgba(255,62,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.02)] relative z-10 overflow-hidden">
            
            {/* Upper Sci-fi Header Accent Bar */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF3E00] to-transparent shrink-0 opacity-80" />

            {/* Bujji Eye/Visual Center Failure Ring */}
            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center animate-pulse">
                  <ShieldAlert className="w-8 h-8 text-[#FF3E00]" />
                </div>
                {/* Secondary glowing ring */}
                <div className="absolute -inset-1 rounded-full border border-red-500/10 animate-ping opacity-70 pointer-events-none" />
              </div>

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#FF3E00] bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase">
                    Kernel Exception
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                <h1 className="text-xl md:text-2xl font-sans tracking-tight font-semibold text-white">
                  Bujji Kernel Logic Loop Interruption
                </h1>
                <p className="text-sm text-white/50 leading-relaxed max-w-md">
                  Hey Boss, some of my internal holographic neural pathways collided. Don't panic — let's execute system recovery protocols and reset the workspace.
                </p>
              </div>
            </div>

            {/* Error Message Box Formatted as Terminal output */}
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2 mb-6">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#FF3E00]/80">
                <Terminal className="w-3.5 h-3.5" />
                <span>STDERR::RUNTIME_CRASH_DUMP</span>
              </div>
              <div className="font-mono text-xs text-red-100 bg-red-950/20 p-3 rounded border border-red-500/10 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                {errorMsg}
              </div>
            </div>

            {/* Collaborative Recovery Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              
              <button
                id="reboot-os-btn"
                onClick={this.handleRestart}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-b from-white/10 to-white/[0.04] border border-white/10 hover:border-white/20 text-white font-medium text-xs hover:bg-white/5 transition-all duration-200 cursor-pointer shadow-md group active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4 text-white/70 group-hover:rotate-45 transition-transform duration-200" />
                <span>Hot Reboot OS</span>
              </button>

              <button
                id="flush-cache-btn"
                onClick={this.handleFlushAndRestart}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-950/20 hover:bg-orange-950/30 border border-orange-500/20 hover:border-orange-500/40 text-orange-200 font-medium text-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
                title="Clears local cache, messages, and states to wipe any corrupt storage."
              >
                <Trash2 className="w-4 h-4 text-orange-400" />
                <span>Flush Storage</span>
              </button>

              <button
                id="download-flight-log-btn"
                onClick={this.handleDownloadLogs}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF3E00]/10 hover:bg-[#FF3E00]/20 border border-[#FF3E00]/20 hover:border-[#FF3E00]/40 text-[#FF551C] font-semibold text-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 text-[#FF3E00]" />
                <span>Save Diagnostic File</span>
              </button>

            </div>

            {/* Collapsible Advanced Technical Fault Trace Area */}
            {errorStack && (
              <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/10">
                <button
                  onClick={this.toggleStack}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    <Brain className="w-3.5 h-3.5 text-white/30" />
                    <span>Raw Diagnostic Stack Trace Profile</span>
                  </div>
                  {this.state.isStackVisible ? (
                    <ChevronUp className="w-4 h-4 text-white/30" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  )}
                </button>

                {this.state.isStackVisible && (
                  <div className="p-4 bg-[#050505] border-t border-white/5 font-mono text-[10px] text-white/60 leading-relaxed overflow-x-auto max-h-60 custom-scrollbar whitespace-pre select-all">
                    {errorStack}
                  </div>
                )}
              </div>
            )}

            {/* Backwards footer accent */}
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/30">
              <span>DESIGNATION::BUJJI_COMPANION_V2</span>
              <span>OS STATUS::RECOVERY_MODE</span>
            </div>

          </div>
        </div>
      );
    }

    // Access class component children via props.children per rules constraint
    return this.props.children;
  }
}
