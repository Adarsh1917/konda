import { useState, useEffect, KeyboardEvent, RefObject } from "react";

export interface TypingSuggestion {
  id: string;
  type: "correction" | "prediction" | "grammar";
  original: string;
  replacement: string;
  display: string;
}

const COMMON_TYPOS: Record<string, string> = {
  "teh": "the",
  "recieve": "receive",
  "recieved": "received",
  "seperate": "separate",
  "definately": "definitely",
  "dont": "don't",
  "cant": "can't",
  "wont": "won't",
  "im": "I'm",
  "whats": "what's",
  "ther": "there",
  "alot": "a lot",
  "toda": "today",
  "plz": "please",
  "pls": "please",
  "bcoz": "because",
  "ur": "your",
  "beleive": "believe",
  "acheive": "achieve",
  "tommorrow": "tomorrow",
  "wanna": "want to",
  "gonna": "going to",
  // Hinglish specific
  "smjh": "samajh",
  "smj": "samajh",
  "koy": "koi",
  "kya": "kya",
};

const PREDICTIONS: Record<string, string[]> = {
  "how": ["how to write a function", "how does it work", "how can I"],
  "write": ["write a react component", "write a typescript function", "write a system design"],
  "create": ["create a modular UI", "create an interactive", "create a dashboard"],
  "what": ["what is the difference", "what are the main features", "what of this code"],
  "design": ["design a modular system", "design a database schema"],
  "implement": ["implement state management", "implement this api"],
  "can": ["can you explain this", "can you code a"],
  "kya": ["kya ye code optimize", "kya chal raha hai"],
  "bujji": ["Bujji Boss, let's explore", "Bujji diagnostics"],
  "konda": ["Konda master universal", "Konda diagnostics"],
};

export function useTypingAssistant(
  input: string,
  setInput: (value: string) => void,
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>
) {
  const [suggestions, setSuggestions] = useState<TypingSuggestion[]>([]);

  // Function to perform safe replacement without cursor jumping
  const applyReplacement = (targetStr: string, replacementStr: string, isWordBoundary: boolean) => {
    const el = inputRef.current;
    if (!el) return;

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const textBefore = input.substring(0, start);
    const textAfter = input.substring(end);

    // Find the word to replace
    let newText = input;
    let newCursorPos = start;

    if (isWordBoundary) {
      // Replace last word before space/punctuation
      const words = textBefore.split(/\s+/);
      const lastWord = words[words.length - 2] || ""; // word before final space
      if (lastWord.toLowerCase() === targetStr.toLowerCase()) {
        const lastWordIndex = textBefore.toLowerCase().lastIndexOf(targetStr.toLowerCase());
        if (lastWordIndex !== -1) {
          const replacementWithCase = matchCase(lastWord, replacementStr);
          newText = textBefore.substring(0, lastWordIndex) + replacementWithCase + textBefore.substring(lastWordIndex + lastWord.length) + textAfter;
          newCursorPos = lastWordIndex + replacementWithCase.length + (textBefore.substring(lastWordIndex + lastWord.length).length);
        }
      }
    } else {
      // In-place word completion
      const wordStart = textBefore.search(/\S+$/);
      if (wordStart !== -1) {
        newText = textBefore.substring(0, wordStart) + replacementStr + textAfter;
        newCursorPos = wordStart + replacementStr.length;
      }
    }

    setInput(newText);
    
    // Defer cursor restoring so React renders first
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // Keep case integrity of replaced word
  const matchCase = (original: string, replacement: string): string => {
    if (!original) return replacement;
    if (original === original.toUpperCase()) return replacement.toUpperCase();
    if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
    return replacement.toLowerCase();
  };

  // Real-time spell check, auto-correction triggers, and predictive suggestions
  useEffect(() => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    const words = input.split(/\s+/);
    const lastWord = words[words.length - 1] || "";
    const activeWord = lastWord.toLowerCase().replace(/[^a-zA-Z]/g, "");

    const newSuggestions: TypingSuggestion[] = [];

    // 1. Silent spelling correction suggestions
    if (activeWord && COMMON_TYPOS[activeWord]) {
      newSuggestions.push({
        id: `corr-${activeWord}`,
        type: "correction",
        original: activeWord,
        replacement: COMMON_TYPOS[activeWord],
        display: `Fix: "${COMMON_TYPOS[activeWord]}"`,
      });
    }

    // 2. Predictive Auto-completion
    if (activeWord && activeWord.length >= 2) {
      // Find matching keys in predictions
      const predictionKey = Object.keys(PREDICTIONS).find(
        (key) => key.startsWith(activeWord) || activeWord.startsWith(key)
      );
      if (predictionKey && PREDICTIONS[predictionKey]) {
        PREDICTIONS[predictionKey].forEach((pred, i) => {
          newSuggestions.push({
            id: `pred-${activeWord}-${i}`,
            type: "prediction",
            original: activeWord,
            replacement: pred,
            display: `✨ ${pred}`,
          });
        });
      }
    }

    // 3. Simple grammar/capitalization assistance
    if (input.endsWith("i ") || input.endsWith(" i")) {
      newSuggestions.push({
        id: "cap-i",
        type: "grammar",
        original: "i",
        replacement: "I",
        display: "Capitalize: 'I'",
      });
    }

    setSuggestions(newSuggestions.slice(0, 3)); // Limit to max 3 relevant helpers to avoid clutter
  }, [input]);

  // Public methods to handle keys
  const handleKeyDown = (e: KeyboardEvent<any>) => {
    if (suggestions.length > 0) {
      // Intercept Tab or Right Arrow to complete the first suggestions
      if (e.key === "Tab") {
        e.preventDefault();
        acceptSuggestion(suggestions[0]);
      }
    }
  };

  const acceptSuggestion = (sug: TypingSuggestion) => {
    applyReplacement(sug.original, sug.replacement, false);
    setSuggestions([]);
  };

  return {
    suggestions,
    acceptSuggestion,
    handleKeyDown,
  };
}
