import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, title, language = 'python' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="code-viewer-container" className="bg-slate-950 rounded border border-slate-800 flex flex-col overflow-hidden text-xs">
      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between font-mono">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{title || `${language} implementation`}</span>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          title="Copy Code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span className="text-[10px]">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="p-3 overflow-x-auto max-h-[300px] font-mono leading-relaxed text-slate-300 bg-slate-950/60">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};
