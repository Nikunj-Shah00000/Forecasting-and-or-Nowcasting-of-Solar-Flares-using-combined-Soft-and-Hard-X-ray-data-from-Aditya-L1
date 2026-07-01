import React, { useState, useEffect } from 'react';
import { Sliders, AlertCircle, RefreshCw, Cpu, Activity, Play } from 'lucide-react';
import { SolarLineChart } from './SolarLineChart';

export const TabAnomalyDetector: React.FC = () => {
  const [signalType, setSignalType] = useState<'nominal' | 'microflares' | 'glitch'>('nominal');
  const [reconstructionError, setReconstructionError] = useState<number>(1.24);

  // Time sequence (0 to 60)
  const timeSteps = Array.from({ length: 60 }, (_, i) => i);

  const [actualCurve, setActualCurve] = useState<number[]>([]);
  const [reconCurve, setReconCurve] = useState<number[]>([]);

  useEffect(() => {
    // Generate waveforms based on type
    let actual: number[] = [];
    let recon: number[] = [];
    let err = 1.0;

    if (signalType === 'nominal') {
      actual = timeSteps.map(t => 1.5 + Math.sin(t / 8) * 0.4 + Math.random() * 0.08);
      // High reconstruction matching normal behavior
      recon = actual.map(val => val + (Math.random() - 0.5) * 0.1);
      err = 0.85;
    } else if (signalType === 'microflares') {
      // Rapid multiple peaks (temporal sequence anomaly)
      actual = timeSteps.map(t => {
        let base = 1.5 + Math.sin(t / 8) * 0.4;
        if (t === 15 || t === 25 || t === 35 || t === 45) base += 2.8;
        if (t > 15 && t < 20) base += 1.5 * Math.exp(-(t-15)/2);
        if (t > 25 && t < 30) base += 1.5 * Math.exp(-(t-25)/2);
        if (t > 35 && t < 40) base += 1.5 * Math.exp(-(t-35)/2);
        if (t > 45 && t < 50) base += 1.5 * Math.exp(-(t-45)/2);
        return base + Math.random() * 0.1;
      });
      // Autoencoder fails to capture these rapid transitions, smoothing it out
      recon = timeSteps.map(t => 1.5 + Math.sin(t / 8) * 0.4 + (t > 15 && t < 48 ? 1.0 : 0));
      err = 8.12;
    } else {
      // High-frequency sensor glitch spike
      actual = timeSteps.map(t => {
        let base = 1.5 + Math.sin(t / 8) * 0.4;
        if (t === 30) base += 8.5; // Single-point glitch
        return base + Math.random() * 0.08;
      });
      recon = actual.map((val, t) => t === 30 ? val - 8.1 : val + (Math.random() - 0.5) * 0.1);
      err = 5.64;
    }

    setActualCurve(actual);
    setReconCurve(recon);
    setReconstructionError(err);
  }, [signalType]);

  const anomalyScore = Math.min(100, Math.max(5, (reconstructionError / 1.5) * 20));
  const isAnomaly = reconstructionError > 2.0;

  return (
    <div id="tab-anomaly-detector" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* Waveform Selector & Dashboard Controls */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Parallel Anomaly Scope</span>
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Evaluate parallel unsupervised LSTM-Autoencoders on normal patterns vs. complex anomalies.
          </p>

          {/* Test Signal Selector */}
          <div className="space-y-1">
            <div className="text-[8px] text-slate-500 font-mono uppercase tracking-wider font-bold">Inject Stream Pattern:</div>
            
            <button
              onClick={() => setSignalType('nominal')}
              className={`w-full py-1.5 px-2 text-left font-mono text-[9px] uppercase border rounded transition-all flex justify-between items-center cursor-pointer ${
                signalType === 'nominal' 
                  ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400 font-bold' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
              }`}
            >
              <span>1. NOMINAL SOLAR ACTIVITY</span>
              <span className="text-[8px] opacity-80">NOMINAL</span>
            </button>

            <button
              onClick={() => setSignalType('microflares')}
              className={`w-full py-1.5 px-2 text-left font-mono text-[9px] uppercase border rounded transition-all flex justify-between items-center cursor-pointer ${
                signalType === 'microflares' 
                  ? 'bg-red-950/20 border-red-500 text-red-400 font-bold animate-pulse' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
              }`}
            >
              <span>2. RAPID MICROFLARES</span>
              <span className="text-[8px] opacity-80">TEMPORAL OUTLIER</span>
            </button>

            <button
              onClick={() => setSignalType('glitch')}
              className={`w-full py-1.5 px-2 text-left font-mono text-[9px] uppercase border rounded transition-all flex justify-between items-center cursor-pointer ${
                signalType === 'glitch' 
                  ? 'bg-amber-950/20 border-amber-500 text-amber-400 font-bold' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
              }`}
            >
              <span>3. TELEMETRY SENSOR GLITCH</span>
              <span className="text-[8px] opacity-80">MAGNITUDE OUTLIER</span>
            </button>
          </div>
        </div>

        {/* Anomaly Score Matrix */}
        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded mt-3 space-y-1.5 font-mono text-[9px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Parallel Diagnostic</div>
          
          <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
            <div>
              <div className="text-slate-500">RECONSTRUCTION LOSS:</div>
              <div className={`font-bold ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>
                {reconstructionError.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">ANOMALY BIAS SCORE:</div>
              <div className={`font-bold ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>
                {anomalyScore.toFixed(0)}/100
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8px] font-bold">
            <span>DETECTOR STATUS:</span>
            {isAnomaly ? (
              <span className="text-red-400 bg-red-950/40 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">
                CRITICAL ANOMALY
              </span>
            ) : (
              <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                NOMINAL BEHAVIOR
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Graphical Chart & Autoencoder Code Panel */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-[180px]">
            <SolarLineChart
              dataX={timeSteps}
              series={[
                { name: 'Actual raw waveform', data: actualCurve, color: '#f97316' },
                { name: 'Autoencoder reconstruction', data: reconCurve, color: '#0ea5e9', dashed: true, glow: !isAnomaly },
              ]}
              title="Signal Reconstruction Discrepancy"
              xLabel="Sequence Index"
              yLabel="Flux Intensity"
            />
          </div>

          {/* Model Comparisons Table */}
          <div className="bg-slate-950 border border-slate-850 p-3 rounded flex flex-col justify-between text-[10px] font-mono leading-relaxed">
            <div>
              <div className="text-orange-400 uppercase tracking-wider font-bold mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-500" />
                Detector Model Comparison
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[8.5px] text-slate-400 mt-1">
                <div className="border-r border-slate-850/60 pr-1.5">
                  <span className="text-sky-400 font-bold uppercase block">LSTM Autoencoder</span>
                  - Excellent for sequential, out-of-phase temporal anomalies.<br/>
                  - High latency compared to forest methods.
                </div>
                <div className="pl-1.5">
                  <span className="text-sky-400 font-bold uppercase block">Isolation Forests</span>
                  - Extremely fast, ideal for instant magnitude outliers.<br/>
                  - Struggles with complex multi-peak sequences.
                </div>
              </div>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-900 text-center text-[9px] text-slate-500 mt-2">
              The anomaly detector operates asynchronously without delaying predictions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
