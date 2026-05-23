import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMarkdownProps {
  content: string;
  shouldAnimate: boolean;
  onComplete?: () => void;
}

export function StreamingMarkdown({ content, shouldAnimate, onComplete }: StreamingMarkdownProps) {
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : content);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedText(content);
      return;
    }

    const words = content.split(' ');
    let currentWordIndex = 0;
    setDisplayedText('');

    // Stream smoothly at a constant rate
    // Calculate adaptive timer speed based on message length for balanced visual speed
    const intervalTime = Math.max(8, Math.min(25, 300 / (words.length || 1)));

    const timer = setInterval(() => {
      if (currentWordIndex < words.length) {
        setDisplayedText(prev => (prev ? prev + ' ' : '') + words[currentWordIndex]);
        currentWordIndex++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [content, shouldAnimate, onComplete]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {displayedText}
    </ReactMarkdown>
  );
}
