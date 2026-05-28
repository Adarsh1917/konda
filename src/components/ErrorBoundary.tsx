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
  Clock,
  Send,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isStackVisible: boolean;
  telemetryState: 'idle' | 'sending' | 'sent' | 'failed';
  telemetryId: string | null;
  telemetryError: string | null;
  countdown: number;
}

export class ErrorBoundary extends Component<Props, State> {
  timerId: any = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isStackVisible: false,
      telemetryState: 'idle',
      telemetryId: null,
      telemetryError: null,
      countdown: -1
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('Bujji Kernel Encountered Runtime Crash:', error, errorInfo);
    this.sendTelemetry(error, errorInfo);
    this.startAutoRecoveryTimer();
  }

  componentWillUnmount() {
    this.clearAutoRecoveryTimer();
  }

  startAutoRecoveryTimer = () => {
    this.clearAutoRecoveryTimer();
    this.setState({ countdown: 10 });
    
    this.timerId = setInterval(() => {
      this.setState(prevState => {
        if (prevState.countdown <= 1) {
          this.clearAutoRecoveryTimer();
          console.warn('Auto-recovery timer finished: executing soft-refresh reload.');
          this.handleRestart();
          return { countdown: 0 };
        }
        return { countdown: prevState.countdown - 1 };
      });
    }, 1000);
  };

  clearAutoRecoveryTimer = () => {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  };

  handlePauseCountdown = () => {
    this.clearAutoRecoveryTimer();
    this.setState({ countdown: -1 });
  };

  sendTelemetry = async (error: Error, errorInfo: ErrorInfo | null) => {
    this.setState({ telemetryState: 'sending', telemetryError: null });
    try {
      const response = await fetch('/api/diagnostics/crash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorName: error.name || 'ComponentFatalException',
          errorMessage: error.message || error.toString(),
          errorStack: error.stack || 'No stack trace recorded at browser.',
          componentStack: errorInfo?.componentStack || 'No react component stack context available.',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.recorded && data.id) {
        this.setState({ 
          telemetryState: 'sent', 
          telemetryId: data.id 
        });
      } else {
        throw new Error('Telemetry payload was validated but missing registered ID.');
      }
    } catch (err: any) {
      console.error('Failed to submit telemetry stream:', err);
      this.setState({ 
        telemetryState: 'failed', 
        telemetryError: err.message || String(err) 
      });
    }
  };

  handleManualRetryTelemetry = () => {
    if (this.state.error) {
      this.sendTelemetry(this.state.error, this.state.errorInfo);
    }
  };

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
                  Kernel Logic Loop Interruption
                </h1>
                <p className="text-sm text-white/50 leading-relaxed max-w-md">
                  A logic fault has been intercepted within the active running container. Let's execute standard system recovery protocols and reload the workspace.
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

            {/* Dynamic Cybernetic Auto-Recovery Panel */}
            {this.state.countdown >= 0 ? (
              <div className="mb-6 p-4 rounded-xl border border-[#FF3E00]/20 bg-[#FF3E00]/5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF3E00] animate-ping shrink-0" />
                  <span className="font-sans text-white/80 leading-relaxed">
                    Auto-Recovery engaged: Performing soft-refresh in <strong className="text-white font-mono text-[13px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10">{this.state.countdown}s</strong>...
                  </span>
                </div>
                <button 
                  onClick={this.handlePauseCountdown}
                  className="w-full sm:w-auto text-[9px] font-mono tracking-wide uppercase px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm text-center font-bold"
                >
                  Pause Countdown
                </button>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-xl border border-white/5 bg-white/[0.02] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-white/40 font-mono tracking-wide">
                  Autonomous timer paused by operator. Automatic soft-refresh disabled.
                </span>
                <button 
                  onClick={this.startAutoRecoveryTimer}
                  className="w-full sm:w-auto text-[9px] font-mono tracking-wide uppercase px-3 py-1.5 bg-[#FF3E00]/10 hover:bg-[#FF3E00]/20 border border-[#FF3E00]/20 text-[#FF551C] font-semibold rounded-lg cursor-pointer transition-all active:scale-95 text-center font-bold"
                >
                  Resume Countdown
                </button>
              </div>
            )}

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

            {/* Real-time Telemetry Dispatcher Panel */}
            <div className="mb-6 p-4 rounded-xl border bg-black/20 text-xs flex flex-col gap-2 transition-all duration-300 border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className={`w-3.5 h-3.5 ${this.state.telemetryState === 'sending' ? 'text-blue-400 animate-spin' : this.state.telemetryState === 'sent' ? 'text-emerald-400' : 'text-white/40'}`} />
                  <span className="font-mono text-[9px] tracking-wider uppercase text-white/60">External Telemetry Monitor Sync</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {this.state.telemetryState === 'sending' && (
                    <span className="text-[9px] text-blue-400 font-mono animate-pulse">Syncing...</span>
                  )}
                  {this.state.telemetryState === 'sent' && (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span>SECURE SYNC: ACTIVE</span>
                    </div>
                  )}
                  {this.state.telemetryState === 'failed' && (
                    <div className="flex items-center gap-1 text-[9px] text-red-400 font-mono font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      <AlertOctagon className="w-2.5 h-2.5 text-red-400" />
                      <span>SYNC FAIL</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-white/50 leading-relaxed font-sans">
                {this.state.telemetryState === 'sending' && (
                  <p>Attempting connection to telemetry receptor `/api/diagnostics/crash` to stream active register buffers and call frames...</p>
                )}
                {this.state.telemetryState === 'sent' && (
                  <div className="space-y-1">
                    <p>Fault report successfully transmitted and cataloged inside database core logs.</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-white/30 font-mono">Telemetry Track ID:</span>
                      <code className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/20 select-all">{this.state.telemetryId}</code>
                    </div>
                  </div>
                )}
                {this.state.telemetryState === 'failed' && (
                  <div className="space-y-1.5">
                    <p>Unable to push raw diagnostic parameters. Error: <span className="text-red-300 font-mono">{this.state.telemetryError || "Unknown Connection Failure"}</span></p>
                    <button
                      onClick={this.handleManualRetryTelemetry}
                      className="text-[10px] font-semibold text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 cursor-pointer bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/15 rounded-lg px-2 py-1 mt-1 font-mono active:scale-95 transition-all"
                    >
                      <span>⚡ Re-initialize Telemetry Transmission</span>
                    </button>
                  </div>
                )}
                {this.state.telemetryState === 'idle' && (
                  <p>Awaiting fatal signature evaluation engine initialization...</p>
                )}
              </div>
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
