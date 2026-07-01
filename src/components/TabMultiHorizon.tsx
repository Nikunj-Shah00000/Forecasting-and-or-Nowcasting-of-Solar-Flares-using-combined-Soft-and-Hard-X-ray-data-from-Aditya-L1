import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Activity, Layers, CheckCircle } from 'lucide-react';
import { SolarLineChart } from './SolarLineChart';

export const TabMultiHorizon: React.FC = () => {
  const [magGradient, setMagGradient] = useState<number>(3.5);
  const [shearAngle, setShearAngle] = useState<number>(32);
  const [heatingRate, setHeatingRate] = useState<number>(1.2);

  // Computed probability arrays for the heads
  const [prob5m, setProb5m] = useState<number>(0);
  const [prob15m, setProb15m] = useState<number>(0);
  const [prob30m, setProb30m] = useState<number>(0);
  const [prob60m, setProb60m] = useState<number>(0);

  useEffect(() => {
    // Basic heuristic simulation representing multi-horizon predictive relationships
    const baseEnergy = (magGradient / 10.0) * 0.4 + (shearAngle / 90.0) * 0.4 + (heatingRate / 5.0) * 0.2;
    
    // Closer horizons respond faster to sudden triggers (mag gradient, heating)
    setProb5m(Math.min(0.99, Math.max(0.01, baseEnergy * 1.3)));
    setProb15m(Math.min(0.99, Math.max(0.01, baseEnergy * 1.1 + 0.1)));
    setProb30m(Math.min(0.99, Math.max(0.01, baseEnergy * 0.9 + 0.15)));
    setProb60m(Math.min(0.99, Math.max(0.01, baseEnergy * 0.7 + 0.2)));
  }, [magGradient, shearAngle, heatingRate]);

  // Forecast graph data
  const horizonsX = [5, 15, 30, 60];
  const predictions = [prob5m * 100, prob15m * 100, prob30m * 100, prob60m * 100];

  return (
    <div id="tab-multi-horizon" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* Parameter perturbation sliders */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Prediction Perturbator</span>
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Simulate real-time magnetic field gradients and heat shifts to observe immediate variations across all four multi-horizon heads.
          </p>

          {/* Magnetic Field Gradient */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>B-Field Gradient (G/km)</span>
              <span className="text-orange-400 font-bold">{magGradient.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="10.0"
              step="0.1"
              value={magGradient}
              onChange={(e) => setMagGradient(parseFloat(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          {/* Shear Angle */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Magnetic Shear Angle (θ)</span>
              <span className="text-orange-400 font-bold">{shearAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={shearAngle}
              onChange={(e) => setShearAngle(parseInt(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          {/* Heating Rate */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Plasma Heating Rate (Q)</span>
              <span className="text-orange-400 font-bold">{heatingRate.toFixed(1)} MW</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={heatingRate}
              onChange={(e) => setHeatingRate(parseFloat(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>
        </div>

        {/* Dynamic Multi-Head Output Bars */}
        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded mt-3 space-y-2 font-mono text-[9px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Parallel Output Heads</div>
          
          <div className="space-y-1.5">
            {/* 5 min */}
            <div>
              <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                <span>5-MINUTE HORIZON (NOWCASTING)</span>
                <span className="text-emerald-400 font-bold">{(prob5m * 100).toFixed(0)}% PROB</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-emerald-500 h-full rounded transition-all duration-300" style={{ width: `${prob5m * 100}%` }} />
              </div>
            </div>

            {/* 15 min */}
            <div>
              <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                <span>15-MINUTE HORIZON (ALERT-MED)</span>
                <span className="text-emerald-400 font-bold">{(prob15m * 100).toFixed(0)}% PROB</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-emerald-500 h-full rounded transition-all duration-300" style={{ width: `${prob15m * 100}%` }} />
              </div>
            </div>

            {/* 30 min */}
            <div>
              <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                <span>30-MINUTE HORIZON (ALERT-HIGH)</span>
                <span className="text-sky-400 font-bold">{(prob30m * 100).toFixed(0)}% PROB</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-sky-500 h-full rounded transition-all duration-300" style={{ width: `${prob30m * 100}%` }} />
              </div>
            </div>

            {/* 60 min */}
            <div>
              <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                <span>60-MINUTE HORIZON (LONG-RANGE)</span>
                <span className="text-sky-400 font-bold">{(prob60m * 100).toFixed(0)}% PROB</span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                <div className="bg-sky-500 h-full rounded transition-all duration-300" style={{ width: `${prob60m * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Chart & Code Snippets */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-[180px]">
            <SolarLineChart
              dataX={horizonsX}
              series={[
                { name: 'Predicted probability path', data: predictions, color: '#0ea5e9', glow: true },
              ]}
              title="Multi-Horizon Forecast Trajectory"
              xLabel="Horizon Time"
              yLabel="Probability (%)"
            />
          </div>

          {/* Curriculum Learning & Weighted Loss Details */}
          <div className="bg-slate-950 border border-slate-850 p-3 rounded flex flex-col justify-between text-[10px] font-mono leading-relaxed">
            <div>
              <div className="text-orange-400 uppercase tracking-wider font-bold mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-500" />
                Curriculum Training Matrix
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[9px]">
                <li className="flex items-start gap-1">
                  <span className="text-orange-500">✔</span>
                  <strong>Horizon Weighing:</strong> BCE weighted with weights <code>[1.0, 0.8, 0.5, 0.3]</code> favoring earlier stability.
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-orange-500">✔</span>
                  <strong>Epochs 0-5 (Warmup):</strong> Freeze 15/30/60m heads. Learn 5m nowcasting strictly.
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-orange-500">✔</span>
                  <strong>Epochs 5-15 (Mid-term):</strong> Unfreeze 15m & 30m heads. Backpropagate jointly.
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-orange-500">✔</span>
                  <strong>Epochs 15+ (Full):</strong> Activate 60m long-horizon predictions. Let weights settle.
                </li>
              </ul>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-900 text-center text-[9px] text-slate-500 mt-2">
              All multi-horizon predictions run concurrently in <span className="text-emerald-400">1.2ms</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
