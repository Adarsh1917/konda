import { useState, useCallback, useRef } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Stop any current speaking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    const getBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return voices.find(v => v.name.includes('Google UK English Female') || v.lang.includes('en-GB')) || voices[0];
    };

    const kondaVoice = getBestVoice();
    if (kondaVoice) utterance.voice = kondaVoice;
    utterance.pitch = 0.9; // Slightly lower pitch for sophistication
    utterance.rate = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }, []);

  const startListening = useCallback((onTranscript: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    speak
  };
}
