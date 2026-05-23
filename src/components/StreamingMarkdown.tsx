import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMarkdownProps {
  content: string;
  shouldAnimate: boolean;
  onComplete?: () => void;
}

export function StreamingMarkdown({ content, shouldAnimate, onComplete }: StreamingMarkdownProps) {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (shouldAnimate) {
      // Defer completion call slightly to ensure parent state updates happen outside of the active render cycle
      const timer = setTimeout(() => {
        onCompleteRef.current?.();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
