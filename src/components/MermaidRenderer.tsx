import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'monospace',
  themeVariables: {
    background: '#050505',
    primaryColor: '#FF3E00',
    primaryTextColor: '#F5F5F5',
    lineColor: '#FF3E00',
    nodeBorder: '#333333',
    mainBkg: '#0A0A0A',
  }
});

interface MermaidRendererProps {
  code: string;
}

export default function MermaidRenderer({ code }: MermaidRendererProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const renderDiagram = async () => {
      if (!code.trim()) {
        if (active) {
          setSvg('');
          setError(null);
        }
        return;
      }

      try {
        // Clear previous error
        setError(null);

        // Standard Mermaid render generates an SVG string.
        // We generate a deterministic unique ID to avoid duplicates.
        const elementId = `mermaid-render-${Math.random().toString(36).substring(2, 9)}`;
        
        // Render
        const { svg: renderedSvg } = await mermaid.render(elementId, code);

        if (active) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        console.error("Mermaid parsing error:", err);
        // Clear any bad HTML state
        if (active) {
          setError(err?.message || "Syntax error: Check your Mermaid diagram formatting.");
          
          // Clean up any stray element inserted by mermaid during errors
          const badElements = document.querySelectorAll('[id^="dmermaid-render"]');
          badElements.forEach(el => el.remove());
        }
      }
    };

    // Debounce compilation slightly to prevent stuttering while typing
    const timer = setTimeout(() => {
      renderDiagram();
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code]);

  if (error) {
    return (
      <div className="p-6 border border-red-500/20 bg-red-500/[0.02] rounded-lg font-mono text-[10px] text-red-400 space-y-3">
        <div className="font-bold flex items-center gap-2">
          <span>⚠️ Diagram Syntax Diagnostic Alert</span>
        </div>
        <p className="opacity-80 whitespace-pre-wrap">{error}</p>
        <p className="text-white/20 text-[8px] uppercase">
          TIP: Ensure shapes/nodes are correctly initialized, brackets are balanced, and relations use standard arrow markers (--&gt;, ==&gt;).
        </p>
      </div>
    );
  }

  return (
    <div 
      className="w-full flex justify-center items-center p-6 bg-[#050505] overflow-auto custom-scrollbar rounded-lg min-h-[350px] border border-white/5"
      dangerouslySetInnerHTML={{ __html: svg || '<div class="text-white/20 font-mono text-[11px] uppercase tracking-widest animate-pulse">Initializing Layout Parser...</div>' }}
    />
  );
}
