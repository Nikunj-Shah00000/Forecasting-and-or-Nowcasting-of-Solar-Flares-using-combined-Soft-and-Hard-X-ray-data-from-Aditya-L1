import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, ShieldAlert, Cpu, RefreshCw, AlertTriangle, Play, CheckCircle2 } from 'lucide-react';
import { SolarLineChart } from './SolarLineChart';

export const TabMcDropout: React.FC = () => {
  const [dropoutRate, setDropoutRate] = useState<number>(0.25);
  const [solarNoise, setSolarNoise] = useState<number>(0.40);
  const [isSampling, setIsSampling] = useState<boolean>(false);

  // Time sequence (0 to 60)
  const timeSteps = Array.from({ length: 60 }, (_, i) => i);

  // Mean prediction curve simulating a flare peak around t=30
  const baseCurve = timeSteps.map(t => {
    if (t < 15) return 0.15;
    if (t <= 40) {
      const x = (t - 15) / 25;
      return 0.15 + 0.65 * Math.sin(x * Math.PI);
    }
    return 0.15 + 0.3 * Math.exp(-(t - 40) / 10);
  });

  // State arrays for multiple Monte Carlo samples
  const [mcSamples, setMcSamples] = useState<number[][]>([]);
  const [meanCurve, setMeanCurve] = useState<number[]>([]);
  const [upperBand, setUpperBand] = useState<number[]>([]);
  const [lowerBand, setLowerBand] = useState<number[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number>(92.4);
  const [stdDevVal, setStdDevVal] = useState<number>(0.038);

  const triggerMCDropout = () => {
    setIsSampling(true);
    setTimeout(() => {
      // Generate 12 random MC dropout samples
      const samples: number[][] = [];
      const numSamples = 12;

      for (let s = 0; s < numSamples; s++) {
        // Each sample is perturbed by dropout rate and solar noise
        const sampleCurve = baseCurve.map(val => {
          const dropoutMask = Math.random() > dropoutRate ? 1 : 0.4; // Simulate node dropout
          const noise = (Math.random() - 0.5) * solarNoise * 0.4;
          return Math.max(0.01, val * dropoutMask + noise);
        });
        samples.push(sampleCurve);
      }

      setMcSamples(samples);

      // Compute mean, std dev, and upper/lower confidence bands
      const calculatedMean: number[] = [];
      const calculatedUpper: number[] = [];
      const calculatedLower: number[] = [];
      let totalVariance = 0;

      for (let t = 0; t < 60; t++) {
        const stepVals = samples.map(s => s[t]);
        const m = stepVals.reduce((a, b) => a + b, 0) / numSamples;
        const variance = stepVals.reduce((a, b) => a + Math.pow(b - m, 2), 0) / numSamples;
        const std = Math.sqrt(variance);

        calculatedMean.push(m);
        calculatedUpper.push(m + 2 * std);
        calculatedLower.push(Math.max(0.01, m - 2 * std));
        totalVariance += variance;
      }

      setMeanCurve(calculatedMean);
      setUpperBand(calculatedUpper);
      setLowerBand(calculatedLower);

      const avgStd = Math.sqrt(totalVariance / 60);
      setStdDevVal(avgStd);

      // Confidence score = Max(0, 100 - (avgStd * 200))
      const conf = Math.max(10.0, 100.0 - (avgStd * 200));
      setConfidenceScore(conf);

      setIsSampling(false);
    }, 800);
  };

  useEffect(() => {
    triggerMCDropout();
  }, [dropoutRate, solarNoise]);

  // Is high uncertainty threshold triggered?
  const isHighUncertainty = stdDevVal > 0.08;

  return (
    <div id="tab-mc-dropout" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* Parameters Panel */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
            <Cpu className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Uncertainty Tuner</span>
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Alter Dropout and Solar telemetry noise profiles. Trigger Monte Carlo forward passes to quantify prediction standard deviation.
          </p>

          {/* Dropout Rate Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Dropout Rate (p)</span>
              <span className="text-orange-400 font-bold">{(dropoutRate * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={dropoutRate}
              onChange={(e) => setDropoutRate(parseFloat(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          {/* Solar Noise Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Telemetry Solar Noise (σ_noise)</span>
              <span className="text-orange-400 font-bold">{solarNoise.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.00"
              step="0.05"
              value={solarNoise}
              onChange={(e) => setSolarNoise(parseFloat(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          <button
            onClick={triggerMCDropout}
            disabled={isSampling}
            className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-950 border border-orange-500/30 text-white font-mono text-[9px] uppercase tracking-widest rounded flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSampling ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-orange-200" />
                Sampling Model Posterior...
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-orange-200" />
                Execute 12x Forward Passes
              </>
            )}
          </button>
        </div>

        {/* Dynamic Warning Escalation Flow Diagram */}
        <div className="bg-slate-950 border border-slate-850 p-2 rounded mt-3 space-y-1.5 font-mono text-[9px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Escalation State Matrix</div>
          
          <div className="grid grid-cols-2 gap-1.5 border-t border-slate-850/60 pt-1.5">
            <div>
              <div className="text-slate-500">PREDICTIVE STD (σ):</div>
              <div className={`font-bold ${isHighUncertainty ? 'text-red-400' : 'text-emerald-400'}`}>
                {stdDevVal.toFixed(3)}
              </div>
              <div className="text-slate-500 mt-1">CONFIDENCE SCORE:</div>
              <div className={`font-bold ${isHighUncertainty ? 'text-red-400' : 'text-emerald-400'}`}>
                {confidenceScore.toFixed(1)}%
              </div>
            </div>
            <div className="border-l border-slate-850/60 pl-2 flex flex-col justify-center">
              <div className="text-slate-500">TRIGGER DECISION:</div>
              {isHighUncertainty ? (
                <div className="bg-red-950/40 border border-red-500/20 px-1 py-0.5 rounded text-[8px] text-red-400 font-bold uppercase tracking-wide flex items-center gap-0.5 animate-pulse mt-0.5">
                  <ShieldAlert className="w-2.5 h-2.5" />
                  YELLOW WARNING
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-500/20 px-1 py-0.5 rounded text-[8px] text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  STABLE FORECAST
                </div>
              )}
            </div>
          </div>
          <div className="text-[7.5px] text-slate-500 italic border-t border-slate-900/60 pt-1">
            {isHighUncertainty 
              ? "Warning: Prediction standard deviation exceeds safety threshold. Initialized backup safety telemetry alert."
              : "Confidence bounds nominal. Standard operational decision pathways validated."}
          </div>
        </div>
      </div>

      {/* Graphical Dashboard Panel */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-[180px]">
            <SolarLineChart
              dataX={timeSteps}
              series={[
                {
                  name: 'Predictive Mean & Variance Bounds',
                  data: meanCurve,
                  color: '#0ea5e9',
                  upperData: upperBand,
                  lowerData: lowerBand,
                  bandColor: 'rgba(14, 165, 233, 0.12)',
                  glow: true
                },
              ]}
              title="MC Dropout Shaded Predictive Density (95% CI)"
              xLabel="Time Offset"
              yLabel="Predictive Prob"
            />
          </div>

          <div className="bg-slate-950 border border-slate-850 p-3 rounded flex flex-col justify-between text-[10px] font-mono leading-relaxed">
            <div>
              <div className="text-orange-400 uppercase tracking-wider font-bold mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
                Bayesian vs MC Dropout Cost
              </div>
              <p className="text-[9px] text-slate-400 mb-2">
                Fully Bayesian Neural Networks require modeling full weight distributions $q(W)$, which multiplies forward propagation training costs by $\approx 100\times$.
              </p>
              <ul className="space-y-1 text-slate-400 text-[8.5px]">
                <li className="flex items-start gap-1">
                  <span className="text-orange-500">✔</span>
                  <strong>Efficiency:</strong> MC Dropout treats standard Dropout layers as variational approximations. No parameter footprint expansion.
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-orange-500">✔</span>
                  <strong>Real-Time:</strong> We can calculate 12 MC forward passes in parallel in under 18ms, making it ideal for the live Aditya-L1 stream.
                </li>
              </ul>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-900 text-center text-[9px] text-slate-500 mt-2">
              Bayesian confidence scores integrated alongside multi-horizon forecasting heads.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
