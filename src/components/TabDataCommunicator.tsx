import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Send, FileText, CheckCircle2, Cpu } from 'lucide-react';
import { TEMPLATE_NARRATIVES } from '../data';

export const TabDataCommunicator: React.FC = () => {
  const [confidenceTier, setConfidenceTier] = useState<'high' | 'moderate' | 'low'>('high');
  const [narrative, setNarrative] = useState<string>('');

  useEffect(() => {
    setNarrative(TEMPLATE_NARRATIVES[confidenceTier]);
  }, [confidenceTier]);

  return (
    <div id="tab-data-communicator" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* Parameter Control Panel */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Narrative Generator</span>
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Dynamically map machine-learning feature importance states (SHAP/LIME) and Bayesian confidence distributions to human-interpretable report paragraphs.
          </p>

          {/* Simulated Model Output State Selection */}
          <div className="space-y-2">
            <span className="text-[8px] text-slate-500 font-mono uppercase font-bold block">Choose Output State Model State:</span>
            
            <button
              onClick={() => setConfidenceTier('high')}
              className={`w-full py-2 px-2.5 text-left font-mono text-[9px] uppercase border rounded transition-all flex justify-between items-center cursor-pointer ${
                confidenceTier === 'high' 
                  ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-bold' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
              }`}
            >
              <span>1. HIGH CONFIDENCE FORECAST</span>
              <span className="text-[8px] opacity-80">X1.2 FLARE</span>
            </button>

            <button
              onClick={() => setConfidenceTier('moderate')}
              className={`w-full py-2 px-2.5 text-left font-mono text-[9px] uppercase border rounded transition-all flex justify-between items-center cursor-pointer ${
                confidenceTier === 'moderate' 
                  ? 'bg-amber-950/20 border-amber-500 text-amber-400 font-bold' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
              }`}
            >
              <span>2. MODERATE CONFIDENCE FORECAST</span>
              <span className="text-[8px] opacity-80">M3.4 FLARE</span>
            </button>

            <button
              onClick={() => setConfidenceTier('low')}
              className={`w-full py-2 px-2.5 text-left font-mono text-[9px] uppercase border rounded transition-all flex justify-between items-center cursor-pointer ${
                confidenceTier === 'low' 
                  ? 'bg-red-950/20 border-red-500 text-red-400 font-bold animate-pulse' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
              }`}
            >
              <span>3. LOW CONFIDENCE ANOMALOUS OBSERVATION</span>
              <span className="text-[8px] opacity-80">C8.5 FLARE</span>
            </button>
          </div>
        </div>

        {/* Integration details */}
        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded mt-3 space-y-1 font-mono text-[9px] leading-relaxed text-slate-400">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Frontend Transmission Mechanism</div>
          <p className="text-[8px] text-slate-500">
            Reports are generated server-side using Jinja templates and pushed to the React frontend alerts feed via Server-Sent Events (SSE) or standard REST payloads.
          </p>
        </div>
      </div>

      {/* Narrative Output Container & Python Code */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-3">
        
        {/* Dynamic Natural Language Report card */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded relative overflow-hidden flex flex-col gap-2">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 p-1.5 text-[8px] text-slate-600 font-mono uppercase font-bold tracking-widest bg-slate-900 border-l border-b border-slate-800">
            ISSDC Mission Report
          </div>
          
          <div className="text-[10px] text-orange-400 font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
            Astrophysicist Automated Narrative
          </div>

          <div 
            className="text-slate-300 font-serif leading-relaxed text-sm"
            dangerouslySetInnerHTML={{ 
              __html: narrative
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-orange-400 font-bold font-mono text-xs px-1.5 py-0.5 bg-orange-950/30 rounded border border-orange-500/10">$1</strong>') 
            }}
          />
        </div>
      </div>
    </div>
  );
};
