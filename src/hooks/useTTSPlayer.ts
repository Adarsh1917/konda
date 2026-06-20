import { useState, useEffect, useCallback } from 'react';

// High performance browser Audio Player supporting raw PCM & MP3 decoding via Web Audio API
class PCMPlayer {
  private audioCtx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private elapsedBeforePause: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private floatSamples: Float32Array | null = null;
  private onEndedCallback: (() => void) | null = null;

  initContext() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(e => console.warn("Error resuming AudioContext:", e));
      }
    } catch (e) {
      console.error("PCMPlayer AudioContext initialization failed:", e);
    }
  }

  async playAudio(base64Data: string, format: 'pcm' | 'mp3', onEnded: () => void) {
    this.stop();
    this.initContext();
    this.onEndedCallback = onEnded;

    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (format === 'mp3') {
        this.isPlaying = true;
        this.isPaused = false;
        this.elapsedBeforePause = 0;

        // Native highly optimized MP3 decoder in standard Web Audio API
        const bufferCopy = bytes.buffer.slice(0);
        this.audioBuffer = await this.audioCtx!.decodeAudioData(bufferCopy);

        this.startTime = this.audioCtx!.currentTime;
        this.sourceNode = this.audioCtx!.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.audioCtx!.destination);
        
        this.sourceNode.onended = () => {
          if (this.isPlaying && !this.isPaused) {
            this.isPlaying = false;
            this.isPaused = false;
            if (this.onEndedCallback) {
              this.onEndedCallback();
            }
          }
        };

        this.sourceNode.start(0);
        return;
      }

      const numSamples = len / 2;
      const dataView = new DataView(bytes.buffer);
      this.floatSamples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        // Linear 16-bit PCM conversion (little endian) normalized to [-1.0, 1.0]
        const intSample = dataView.getInt16(i * 2, true);
        this.floatSamples[i] = intSample / 32768;
      }

      this.audioBuffer = this.audioCtx!.createBuffer(1, numSamples, 24000);
      this.audioBuffer.copyToChannel(this.floatSamples, 0);

      this.isPlaying = true;
      this.isPaused = false;
      this.elapsedBeforePause = 0;
      this.startTime = this.audioCtx!.currentTime;

      this.sourceNode = this.audioCtx!.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      this.sourceNode.connect(this.audioCtx!.destination);
      
      this.sourceNode.onended = () => {
        // Trigger callback only if playback finished naturally (not stopped manually)
        if (this.isPlaying && !this.isPaused) {
          this.isPlaying = false;
          this.isPaused = false;
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        }
      };

      this.sourceNode.start(0);
    } catch (err) {
      console.error("Audio playback error:", err);
      this.stop();
    }
  }

  pause() {
    if (!this.isPlaying || this.isPaused || !this.sourceNode || !this.audioCtx) return;
    
    try {
      this.isPaused = true;
      // Record time elapsed since we started playing this chunk
      this.elapsedBeforePause += this.audioCtx.currentTime - this.startTime;
      this.sourceNode.onended = null;
      this.sourceNode.stop();
      this.sourceNode = null;
    } catch (err) {
      console.error("PCM pause error:", err);
    }
  }

  resume() {
    if (!this.isPlaying || !this.isPaused || !this.audioBuffer || !this.audioCtx) return;

    try {
      this.isPaused = false;
      this.startTime = this.audioCtx.currentTime;

      this.sourceNode = this.audioCtx.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      this.sourceNode.connect(this.audioCtx.destination);
      
      this.sourceNode.onended = () => {
        if (this.isPlaying && !this.isPaused) {
          this.isPlaying = false;
          this.isPaused = false;
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        }
      };

      // Restart playing offset from where we paused
      const offset = this.elapsedBeforePause % this.audioBuffer.duration;
      this.sourceNode.start(0, offset);
    } catch (err) {
      console.error("PCM resume error:", err);
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.elapsedBeforePause = 0;
    
    if (this.sourceNode) {
      try {
        this.sourceNode.onended = null;
        this.sourceNode.stop();
      } catch (e) {}
      this.sourceNode = null;
    }
    
    this.audioBuffer = null;
    this.floatSamples = null;
  }
}

const playerInstance = new PCMPlayer();

interface TTSState {
  playingId: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  engine: string | null;
  voice: string | null;
}

type Subscriber = (state: TTSState) => void;
const subscribers = new Set<Subscriber>();

let globalState: TTSState = {
  playingId: null,
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  error: null,
  engine: null,
  voice: null
};

function updateGlobalState(nextState: Partial<TTSState>) {
  globalState = { ...globalState, ...nextState };
  subscribers.forEach(sub => sub(globalState));
}

export function useTTSPlayer() {
  const [state, setState] = useState<TTSState>(globalState);

  useEffect(() => {
    subscribers.add(setState);
    setState(globalState);
    return () => {
      subscribers.delete(setState);
    };
  }, []);

  const play = useCallback(async (messageId: string, text: string, voiceName: string) => {
    // 1. Pre-initialize/resume the AudioContext synchronously within user gesture context
    // This cleanly bypasses browsers' strict modern autoplay restrictions
    try {
      playerInstance.initContext();
    } catch (err) {
      console.warn("Autoplay context pre-init warning:", err);
    }

    // If clicking on already active message
    if (globalState.playingId === messageId) {
      if (globalState.isPaused) {
        playerInstance.resume();
        updateGlobalState({ isPaused: false });
      } else {
        playerInstance.pause();
        updateGlobalState({ isPaused: true });
      }
      return;
    }

    // 2. Extract and validate text existence
    if (!text || text.trim().length === 0) {
      console.warn("TTS skipped: Empty or missing speech text.");
      updateGlobalState({ error: "Cannot synthesize empty speech text." });
      return;
    }

    // 3. Sanitize markdown/urls and code blocks before sending to engine
    // VERY IMPORTANT: Strip code blocks before replacing backticks to ensure the block regex matches properly
    let sanitizedText = text
      .replace(/```[\s\S]*?```/g, ' [code snippet omitted] ')
      .replace(/[#*`_~=\-+\[\]()<>|\\]/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (sanitizedText.length === 0) {
      console.warn("TTS skipped: Cleaned speech text is empty.");
      updateGlobalState({ error: "No vocalizable content left after text sanitization." });
      return;
    }

    // New playback request: stop existing completely to ensure one active player at a time
    playerInstance.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    updateGlobalState({
      playingId: messageId,
      isPlaying: false,
      isPaused: false,
      isLoading: true,
      error: null,
      engine: null,
      voice: null
    });

    try {
      // 4. Properly await audio generation response from backend API
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: sanitizedText, voiceName })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to call premium voice synthesis pipeline.");
      }

      const data = await response.json();
      if (!data.audio) {
        throw new Error("No synthesized audio segment resolved by uplink.");
      }

      // Check if user clicked stop or another message in the meantime
      if (globalState.playingId !== messageId) {
        return; 
      }

      const format = data.format || 'pcm';

      await playerInstance.playAudio(data.audio, format, () => {
        updateGlobalState({
          playingId: null,
          isPlaying: false,
          isPaused: false,
          engine: null,
          voice: null
        });
      });

      // Verify that state hasn't changed during loading
      if (globalState.playingId === messageId) {
        updateGlobalState({
          isLoading: false,
          isPlaying: true,
          isPaused: false,
          engine: data.engine || 'Gemini Core',
          voice: data.voice || 'Aoede'
        });
      }
    } catch (err: any) {
      console.warn("[TTS_PLAY_FAILURE] Premium voice synthesis failed. Activating native Web Speech fallback...", err);
      
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && globalState.playingId === messageId) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(sanitizedText);
          
          // Select an appropriate conversational voice
          const voices = window.speechSynthesis.getVoices();
          const bujjiOpt = voices.find(v => 
            v.name.includes('Google UK English Female') || 
            v.lang.includes('en-GB') || 
            v.lang.includes('en-IN')
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
          
          if (bujjiOpt) {
            utterance.voice = bujjiOpt;
          }
          
          // Set standard, beautiful, natural rates
          utterance.pitch = 1.05;
          utterance.rate = 0.95;
          
          utterance.onend = () => {
            if (globalState.playingId === messageId) {
              updateGlobalState({
                playingId: null,
                isPlaying: false,
                isPaused: false,
                engine: null,
                voice: null
              });
            }
          };
          
          utterance.onerror = (e) => {
            console.error("[TTS_FALLBACK_ERROR] Web speech synthesis failed:", e);
            if (globalState.playingId === messageId) {
              updateGlobalState({
                playingId: null,
                isPlaying: false,
                isPaused: false,
                isLoading: false,
                error: "Web speech synthesis failed to vocalize.",
                engine: null,
                voice: null
              });
            }
          };
          
          window.speechSynthesis.speak(utterance);
          
          updateGlobalState({
            isLoading: false,
            isPlaying: true,
            isPaused: false,
            engine: "Web Speech Synthesis Fallback",
            voice: bujjiOpt ? `${bujjiOpt.name} (Local Browser)` : "Local Browser System"
          });
          return;
        } catch (fallbackErr) {
          console.error("[TTS_FALLBACK_CRITICAL] Web speech fallback execution crashed:", fallbackErr);
        }
      }

      if (globalState.playingId === messageId) {
        updateGlobalState({
          playingId: null,
          isPlaying: false,
          isPaused: false,
          isLoading: false,
          error: err.message || "Uplink Voice Engine Exception",
          engine: null,
          voice: null
        });
      }
    }
  }, []);

  const pause = useCallback(() => {
    playerInstance.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    updateGlobalState({ isPaused: true });
  }, []);

  const resume = useCallback(() => {
    playerInstance.resume();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    updateGlobalState({ isPaused: false });
  }, []);

  const stop = useCallback(() => {
    playerInstance.stop();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    updateGlobalState({
      playingId: null,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      engine: null,
      voice: null
    });
  }, []);

  return {
    ...state,
    play,
    pause,
    resume,
    stop
  };
}
