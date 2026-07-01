import React, { useState, useEffect } from 'react';
import { Database, Sparkles, RefreshCw, Layers, CheckCircle2, Play, Table, Download, Server } from 'lucide-react';
import { DEFAULT_FLARE_CATALOGUE, PYTORCH_CODE_SNIPPETS } from '../data';
import { CataloguedFlare } from '../types';
import { CodeViewer } from './CodeViewer';

export const TabStateCatalogue: React.FC = () => {
  const [catalogue, setCatalogue] = useState<CataloguedFlare[]>(DEFAULT_FLARE_CATALOGUE);
  const [currentStep, setCurrentStep] = useState<'QUIESCENT' | 'RISE' | 'PEAK' | 'DECAY'>('QUIESCENT');
  const [fluxVal, setFluxVal] = useState<number>(1.2);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ledger' | 'schema'>('ledger');

  // Trigger state-machine flare simulation sequence
  const startFlareSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    let step = 0;
    
    const interval = setInterval(() => {
      step += 1;
      if (step <= 5) {
        // Quiescent
        setCurrentStep('QUIESCENT');
        setFluxVal(1.0 + Math.random() * 0.2);
      } else if (step <= 12) {
        // Rise
        setCurrentStep('RISE');
        setFluxVal(1.5 + (step - 5) * 1.2);
      } else if (step <= 16) {
        // Peak
        setCurrentStep('PEAK');
        setFluxVal(9.8 - (step - 12) * 0.1 + Math.random() * 0.5);
      } else if (step <= 24) {
        // Decay
        setCurrentStep('DECAY');
        setFluxVal(8.0 * Math.exp(-(step - 16) / 4));
      } else {
        // Back to quiescent
        setCurrentStep('QUIESCENT');
        setFluxVal(1.2);
        clearInterval(interval);
        setIsSimulating(false);

        // Append newly catalogued flare dynamically to ledger!
        const newFlare: CataloguedFlare = {
          id: `FL-2026-0${catalogue.length + 1}`,
          start_time: '04:31:20',
          peak_time: '04:36:45',
          end_time: '04:44:10',
          class: 'M',
          intensity: 4.8,
          confidence: 93.4,
          active_region: 'AR13664',
          snr: 31.2,
          status: 'COMPLETED'
        };
        setCatalogue(prev => [newFlare, ...prev]);
      }
    }, 400);
  };

  return (
    <div id="tab-state-catalogue" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* State Machine Status & Play Control */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">State Machine Engine</span>
            </div>
            {isSimulating && <span className="text-[8px] bg-orange-600/20 text-orange-400 font-mono px-1.5 py-0.5 rounded animate-pulse">ACTIVE</span>}
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Visualise the state transitions in real time as Soft X-ray flux exceeds the $N\sigma$ background threshold, identifying boundaries.
          </p>

          {/* Graphical State Flow Nodes */}
          <div className="grid grid-cols-4 gap-1 font-mono text-[9px] text-center pt-2">
            <div className={`p-1 border rounded flex flex-col items-center justify-center h-12 transition-all ${
              currentStep === 'QUIESCENT' 
                ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold shadow-lg shadow-sky-500/10' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}>
              <span>QUIESCENT</span>
              <span className="text-[7px] text-slate-400 font-normal mt-0.5">&lt; Baseline</span>
            </div>

            <div className={`p-1 border rounded flex flex-col items-center justify-center h-12 transition-all ${
              currentStep === 'RISE' 
                ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold shadow-lg shadow-orange-500/10' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}>
              <span>RISE</span>
              <span className="text-[7px] text-slate-400 font-normal mt-0.5">&gt; Thresh</span>
            </div>

            <div className={`p-1 border rounded flex flex-col items-center justify-center h-12 transition-all ${
              currentStep === 'PEAK' 
                ? 'bg-red-500/10 border-red-500 text-red-400 font-bold shadow-lg shadow-red-500/10 animate-pulse' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}>
              <span>PEAK</span>
              <span className="text-[7px] text-slate-400 font-normal mt-0.5">dI/dt ≈ 0</span>
            </div>

            <div className={`p-1 border rounded flex flex-col items-center justify-center h-12 transition-all ${
              currentStep === 'DECAY' 
                ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold shadow-lg shadow-amber-500/10' 
                : 'bg-slate-950 border-slate-850 text-slate-500'
            }`}>
              <span>DECAY</span>
              <span className="text-[7px] text-slate-400 font-normal mt-0.5">Cooling</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-2 rounded flex items-center justify-between font-mono text-[9px]">
            <span className="text-slate-500">SIMULATED SOLEXS FLUX:</span>
            <span className="text-orange-400 font-bold">{fluxVal.toFixed(2)} μW/m²</span>
          </div>

          <button
            onClick={startFlareSimulation}
            disabled={isSimulating}
            className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-950 border border-orange-500/30 text-white font-mono text-[9px] uppercase tracking-widest rounded flex items-center justify-center gap-1 cursor-pointer"
          >
            <Play className="w-3 h-3 text-orange-200" />
            Simulate Event Ingestion
          </button>
        </div>

        {/* Confidence Integration Metrics */}
        <div className="bg-slate-950 border border-slate-850 p-2 rounded mt-3 space-y-1 font-mono text-[9px] leading-relaxed text-slate-400">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Catalogue Confidence Integration</div>
          <p className="text-[8px] text-slate-500">
            Catalogue Confidence combines model accuracy with real-world SNR (Signal-to-Noise Ratio):
          </p>
          <code className="block bg-slate-900 p-1 text-sky-400 text-[8.5px] rounded mt-1 border border-slate-850">
            Conf = ModelProb * 0.7 + (1 - 1/SNR) * 30.0
          </code>
        </div>
      </div>

      {/* Database Schema / Ledger Panel */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-2">
        <div className="flex border-b border-slate-850 pb-1 flex-row shrink-0">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'ledger' 
                ? 'border-orange-500 text-orange-400' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Table className="w-3 h-3 inline mr-1" />
            Live Automated Catalogue
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'schema' 
                ? 'border-orange-500 text-orange-400' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Database className="w-3 h-3 inline mr-1" />
            TimescaleDB Relational Schema
          </button>
        </div>

        {activeTab === 'ledger' ? (
          <div className="flex-1 flex flex-col justify-between gap-3 min-h-[250px]">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500">
                    <th className="py-1.5 uppercase">ID</th>
                    <th className="py-1.5 uppercase">Start (UTC)</th>
                    <th className="py-1.5 uppercase">Peak (UTC)</th>
                    <th className="py-1.5 uppercase">End (UTC)</th>
                    <th className="py-1.5 uppercase">Class</th>
                    <th className="py-1.5 uppercase text-right">Confidence</th>
                    <th className="py-1.5 uppercase text-right">SNR</th>
                    <th className="py-1.5 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {catalogue.map((row, idx) => (
                    <tr key={row.id} className="text-slate-300 hover:bg-slate-950/40">
                      <td className="py-1.5 text-sky-400 font-bold">{row.id}</td>
                      <td className="py-1.5">{row.start_time}</td>
                      <td className="py-1.5">{row.peak_time}</td>
                      <td className="py-1.5">{row.end_time}</td>
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          row.class === 'X' 
                            ? 'bg-red-950 text-red-400 border border-red-500/20' 
                            : row.class === 'M' 
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/20' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {row.class}{row.intensity.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-1.5 text-right font-bold text-emerald-400">{row.confidence}%</td>
                      <td className="py-1.5 text-right text-slate-400">{row.snr} dB</td>
                      <td className="py-1.5 text-right">
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${
                          row.status === 'ONGOING' ? 'text-red-400 animate-pulse' : 'text-slate-500'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FastAPI Endpoint simulation block */}
            <div className="bg-slate-950 border border-slate-850 rounded p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <div className="font-mono text-[9px]">
                  <div className="text-slate-400 font-bold uppercase">FASTAPI CLOUD DISPATCHER</div>
                  <div className="text-slate-600 text-[8px]">GET /api/v1/catalogue/export?format=json</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(catalogue, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "suryadrishti_catalogue.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-mono text-[9px] rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <Download className="w-3 h-3 text-sky-400" />
                Download JSON Report
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <CodeViewer
              code={PYTORCH_CODE_SNIPPETS.state_catalogue}
              language="sql"
              title="PostgreSQL / TimescaleDB DDL Schema"
            />
          </div>
        )}
      </div>
    </div>
  );
};
