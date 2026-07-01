import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, BookOpen, Cpu, Info } from 'lucide-react';
import { SolarLineChart } from './SolarLineChart';

export const TabPhysicsLoss: React.FC = () => {
  const [alpha, setAlpha] = useState<number>(1.2);
  const [beta, setBeta] = useState<number>(0.15);
  const [lambdaPhys, setLambdaPhys] = useState<number>(0.50);

  // Time sequence
  const timeSteps = Array.from({ length: 60 }, (_, i) => i);
  
  // Base raw HXR Burst (Hard X-ray) simulating peak around t=20
  const hxrRaw = timeSteps.map(t => {
    if (t < 10) return 0.2 + Math.random() * 0.1;
    if (t <= 25) {
      const x = (t - 10) / 15;
      return 0.2 + 8.5 * Math.sin(x * Math.PI) + Math.random() * 0.3;
    }
    return 0.4 * Math.exp(-(t - 25) / 10) + Math.random() * 0.1;
  });

  // Calculate simulated target SXR (Soft X-ray) using standard Neupert Integration:
  // SXR[t] = SXR[t-1] + alpha * HXR[t] - beta * SXR[t-1]
  const [sxrTarget, setSxrTarget] = useState<number[]>([]);
  const [sxrPredPure, setSxrPredPure] = useState<number[]>([]);
  const [sxrPredPhys, setSxrPredPhys] = useState<number[]>([]);

  useEffect(() => {
    // Generate Target
    let currentSxr = 1.0;
    const target: number[] = [];
    for (let t = 0; t < 60; t++) {
      currentSxr = Math.max(1.0, currentSxr + 0.35 * hxrRaw[t] - 0.10 * currentSxr);
      target.push(currentSxr);
    }
    setSxrTarget(target);

    // Pure data-driven model prediction (slightly out-of-phase or violates Neupert relation)
    const pure: number[] = target.map((val, t) => {
      // Misaligned peak, fails to integrate HXR properly
      const delay = t < 15 ? 0 : t < 35 ? Math.sin((t - 15) / 10) * 1.8 : -1.2;
      return Math.max(1.0, val + delay + (Math.sin(t / 2) * 0.4));
    });
    setSxrPredPure(pure);

    // Physics-informed model prediction (adjusts closer as lambdaPhys increases)
    const phys: number[] = target.map((val, t) => {
      const errorFraction = Math.max(0, 1 - lambdaPhys);
      const shift = (Math.sin(t / 2) * 0.4 + (t < 15 ? 0 : t < 35 ? Math.sin((t - 15) / 10) * 1.8 : -1.2)) * errorFraction;
      return Math.max(1.0, val + shift);
    });
    setSxrPredPhys(phys);
  }, [alpha, beta, lambdaPhys]);

  // Compute mock losses
  const dataLossPure = 1.24;
  const physicsResidualPure = 2.45;

  const dataLossPhys = (0.02 + 0.25 * Math.max(0, 1 - lambdaPhys)).toFixed(3);
  const physicsResidualPhys = (0.12 * Math.max(0, 1 - lambdaPhys)).toFixed(3);

  return (
    <div id="tab-physics-loss" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* Parameter Controls Panel */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
            <Sliders className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Loss Constraint Controls</span>
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Configure parameters matching thermodynamics relationship between Soft X-ray (SOLEXS) & Hard X-ray (HEL1OS) bands.
          </p>

          {/* Alpha Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Conversion Factor (α)</span>
              <span className="text-orange-400 font-bold">{alpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          {/* Beta Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Cooling Coefficient (β)</span>
              <span className="text-orange-400 font-bold">{beta.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={beta}
              onChange={(e) => setBeta(parseFloat(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          {/* Physics Loss Weight Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Physics Penalty Weight (λ_phys)</span>
              <span className="text-sky-400 font-bold">{lambdaPhys.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="1.50"
              step="0.05"
              value={lambdaPhys}
              onChange={(e) => setLambdaPhys(parseFloat(e.target.value))}
              className="w-full h-1 accent-sky-500 bg-slate-800 rounded appearance-none"
            />
          </div>
        </div>

        {/* Live Loss Metrics Readout */}
        <div className="bg-slate-950 border border-slate-850 p-2 rounded mt-3 space-y-1.5 font-mono text-[9px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Telemetry Discrepancy</div>
          <div className="grid grid-cols-2 gap-1.5 border-t border-slate-850/60 pt-1.5">
            <div>
              <div className="text-slate-500">PURE DATA LOSS:</div>
              <div className="text-slate-300 font-bold">{dataLossPure}</div>
              <div className="text-slate-500 mt-1">PHYSICS MISMATCH:</div>
              <div className="text-red-400 font-bold">{physicsResidualPure}</div>
            </div>
            <div className="border-l border-slate-850/60 pl-2">
              <div className="text-sky-400 font-bold">HYBRID PHYSICS LOSS:</div>
              <div className="text-slate-300 font-bold">{dataLossPhys}</div>
              <div className="text-sky-400 font-bold mt-1">HYBRID DISCREPANCY:</div>
              <div className="text-emerald-400 font-bold">{physicsResidualPhys}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphical Simulation Panel */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-[180px]">
            <SolarLineChart
              dataX={timeSteps}
              series={[
                { name: 'HXR raw input (HEL1OS)', data: hxrRaw, color: '#f97316', glow: true },
              ]}
              title="HEL1OS Hard X-ray Energy Deposition"
              yLabel="Energy"
            />
          </div>
          <div className="h-[180px]">
            <SolarLineChart
              dataX={timeSteps}
              series={[
                { name: 'SXR actual target', data: sxrTarget, color: '#10b981' },
                { name: 'Pure Data Pred (λ=0)', data: sxrPredPure, color: '#ef4444', dashed: true },
                { name: 'Physics hybrid pred', data: sxrPredPhys, color: '#0ea5e9', glow: true },
              ]}
              title="Thermodynamic SXR Flux & Prediction Curve"
              yLabel="Flux"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
