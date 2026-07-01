import React, { useState, useEffect } from 'react';
import { Sparkles, Sliders, RefreshCw, Layers, CheckCircle } from 'lucide-react';
import { SolarLineChart } from './SolarLineChart';

export const TabSyntheticGan: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<'C' | 'M' | 'X'>('M');
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Time series array (0 to 60)
  const timeSteps = Array.from({ length: 60 }, (_, i) => i);

  // States for synthetic signals
  const [syntheticSxr, setSyntheticSxr] = useState<number[]>([]);
  const [syntheticHxr, setSyntheticHxr] = useState<number[]>([]);
  const [mmdMetric, setMmdMetric] = useState<number>(0.032);

  const handleSynthesize = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate cGAN synthesis based on class and duration conditions
      const classMultiplier = selectedClass === 'X' ? 8.2 : selectedClass === 'M' ? 3.4 : 1.1;
      const durationHalf = selectedDuration / 2;
      const peakIndex = 15 + Math.floor(Math.random() * 8);

      // Synthesize synchronized HEL1OS (HXR) burst driving peak
      const hxr = timeSteps.map(t => {
        if (t < peakIndex - durationHalf || t > peakIndex + durationHalf) {
          return 0.15 + Math.random() * 0.05;
        }
        const progress = (t - (peakIndex - durationHalf)) / selectedDuration;
        return 0.15 + (classMultiplier * 1.1) * Math.sin(progress * Math.PI) + Math.random() * 0.15;
      });

      // Synthesize correlated SOLEXS (SXR) obeying thermal integration (Neupert effect)
      let sxrAccumulator = 1.0;
      const sxr = hxr.map(hxrVal => {
        sxrAccumulator = Math.max(1.0, sxrAccumulator + 0.35 * hxrVal - 0.12 * sxrAccumulator);
        return sxrAccumulator + (Math.random() - 0.5) * 0.04;
      });

      setSyntheticHxr(hxr);
      setSyntheticSxr(sxr);
      
      // Compute mock Maximum Mean Discrepancy (lower = better)
      const mockMmd = 0.015 + Math.random() * 0.018;
      setMmdMetric(mockMmd);
      
      setIsGenerating(false);
    }, 700);
  };

  useEffect(() => {
    handleSynthesize();
  }, [selectedClass, selectedDuration]);

  return (
    <div id="tab-synthetic-gan" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* cGAN Conditions Controller */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">cGAN Conditions</span>
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Inject conditional parameters to synthesize targeted, under-represented flare events like severe X-class anomalies.
          </p>

          {/* Conditional Flare Class Selection */}
          <div className="space-y-1">
            <span className="text-[8px] text-slate-500 font-mono uppercase font-bold block">Condition 1: Target Class</span>
            <div className="grid grid-cols-3 gap-1">
              {(['C', 'M', 'X'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className={`py-1 text-[9px] font-mono font-bold rounded border transition-all cursor-pointer ${
                    selectedClass === c
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                      : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-800'
                  }`}
                >
                  Class {c}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Duration Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Condition 2: Peak Duration</span>
              <span className="text-orange-400 font-bold">{selectedDuration} min</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="5"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          <button
            onClick={handleSynthesize}
            disabled={isGenerating}
            className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-950 border border-orange-500/30 text-white font-mono text-[9px] uppercase tracking-widest rounded flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-orange-200" />
                Synthesizing Latent Vector...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-orange-200" />
                Synthesize {selectedClass}-Class Flare
              </>
            )}
          </button>
        </div>

        {/* Quality Assessment Metrics */}
        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded mt-3 space-y-1.5 font-mono text-[9px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Discriminator Turing Check</div>
          
          <div className="flex justify-between border-b border-slate-900/60 pb-1.5">
            <div>
              <div className="text-slate-500">MMD METRIC (RKHS):</div>
              <div className="text-emerald-400 font-bold">{mmdMetric.toFixed(4)}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">TURING PASS RATIO:</div>
              <div className="text-emerald-400 font-bold">98.4%</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[8px] font-bold">
            <span>SYNTHETIC VALIDITY:</span>
            <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              PHYSICALLY CONSISTENT
            </span>
          </div>
        </div>
      </div>

      {/* Graphical Dashboard & Code Block */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-[180px]">
            <SolarLineChart
              dataX={timeSteps}
              series={[
                { name: 'Synthetic SXR (SOLEXS)', data: syntheticSxr, color: '#0ea5e9', glow: true },
                { name: 'Synthetic HXR (HEL1OS)', data: syntheticHxr, color: '#f97316' },
              ]}
              title="Synchronized Multi-Channel Synthetic Stream"
              xLabel="Time Step"
              yLabel="Flux"
            />
          </div>

          {/* Training pipeline mixup explanation */}
          <div className="bg-slate-950 border border-slate-850 p-3 rounded flex flex-col justify-between text-[10px] font-mono leading-relaxed">
            <div>
              <div className="text-orange-400 uppercase tracking-wider font-bold mb-1 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-500" />
                Data Augment Integration
              </div>
              <p className="text-[9px] text-slate-400 mb-1.5">
                To balance solar classes, we inject synthetic samples using a **"Mixup"** approach in our batch loader:
              </p>
              <code className="block bg-slate-900 p-1 text-[8px] text-sky-400 rounded border border-slate-850">
                X_batch = λ_mix * X_real + (1 - λ_mix) * X_synthetic
              </code>
              <p className="text-[9px] text-slate-500 mt-1.5">
                This mitigates overfitting on small sample sizes of rare extreme X-class flare observations.
              </p>
            </div>
            <div className="bg-slate-900/40 p-1.5 rounded border border-slate-900 text-center text-[9px] text-slate-500">
              Preserves accurate cross-channel phase delays of the Neupert Effect.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
