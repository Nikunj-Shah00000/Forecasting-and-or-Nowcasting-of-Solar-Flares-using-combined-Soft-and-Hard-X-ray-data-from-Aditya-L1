import React, { useState } from 'react';
import { Sliders, Sparkles, User, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { SolarLineChart } from './SolarLineChart';

interface UncertainEvent {
  id: string;
  entropy: number;
  class_probs: string;
  data: number[];
  active_region: string;
}

const INITIAL_QUEUE: UncertainEvent[] = [
  { id: 'AL-ERR-101', entropy: 1.48, class_probs: 'C: 41% | M: 48%', data: [1.2, 1.5, 2.2, 3.8, 3.2, 2.1, 1.5, 1.3], active_region: 'AR13664' },
  { id: 'AL-ERR-102', entropy: 1.32, class_probs: 'M: 44% | X: 42%', data: [1.5, 2.8, 4.2, 5.1, 4.8, 3.5, 2.2, 1.8], active_region: 'AR13665' },
  { id: 'AL-ERR-103', entropy: 1.21, class_probs: 'B: 38% | C: 49%', data: [0.8, 1.1, 1.4, 2.1, 1.8, 1.2, 0.9, 0.8], active_region: 'AR13662' },
];

export const TabActiveLearning: React.FC = () => {
  const [queue, setQueue] = useState<UncertainEvent[]>(INITIAL_QUEUE);
  const [selectedEvent, setSelectedEvent] = useState<UncertainEvent | null>(INITIAL_QUEUE[0]);
  const [learningGain, setLearningGain] = useState<number>(14.2);
  const [committedCount, setCommittedCount] = useState<number>(42);

  const handleManualResolve = (resolvedClass: string) => {
    if (!selectedEvent) return;

    // Remove from queue
    const updatedQueue = queue.filter(e => e.id !== selectedEvent.id);
    setQueue(updatedQueue);

    // Update committed counts and gains
    setCommittedCount(prev => prev + 1);
    setLearningGain(prev => prev + 0.35);

    // Auto-select next item
    if (updatedQueue.length > 0) {
      setSelectedEvent(updatedQueue[0]);
    } else {
      setSelectedEvent(null);
    }
  };

  const handleResetQueue = () => {
    setQueue(INITIAL_QUEUE);
    setSelectedEvent(INITIAL_QUEUE[0]);
  };

  // TimeSteps for the small mini chart
  const steps = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div id="tab-active-learning" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* HITL Labeling Queue Panel */}
      <div className="xl:col-span-5 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between min-h-[300px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Expert Annotation Queue</span>
            </div>
            {queue.length > 0 && (
              <span className="text-[8px] bg-sky-950 text-sky-400 font-mono px-1.5 py-0.5 rounded border border-sky-500/15">
                {queue.length} PENDING
              </span>
            )}
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Models flag highly ambiguous predictions (high entropy $H(y|x) &gt; 1.2$) into an Uncertainty Buffer for manual evaluation.
          </p>

          {/* Pending Queue List */}
          {queue.length > 0 ? (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {queue.map(event => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full p-2 text-left font-mono text-[9px] border rounded transition-all flex items-center justify-between cursor-pointer ${
                    selectedEvent?.id === event.id
                      ? 'bg-orange-600/15 border-orange-500 text-orange-400'
                      : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1 text-sky-400">
                      <AlertCircle className="w-3 h-3 text-orange-400" />
                      {event.id}
                    </div>
                    <div className="text-[8px] text-slate-500">{event.class_probs}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-500 text-[8px]">ENTROPY</div>
                    <div className="font-bold text-orange-400">{event.entropy.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-950/40 rounded border border-dashed border-slate-850 flex flex-col items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-[9px] text-slate-500">Uncertainty Buffer Is Empty.</span>
              <button
                onClick={handleResetQueue}
                className="mt-1 px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded font-mono text-[8px] uppercase tracking-wide cursor-pointer"
              >
                Reload Mock Cases
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Learning Statistics */}
        <div className="bg-slate-950 border border-slate-850 p-2 rounded mt-3 space-y-1 font-mono text-[9px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Annotation Performance Gain</div>
          <div className="grid grid-cols-2 gap-1.5 border-t border-slate-900/60 pt-1.5">
            <div>
              <div className="text-slate-500">RESOLVED LABELS:</div>
              <div className="text-slate-300 font-bold">{committedCount} events</div>
            </div>
            <div className="border-l border-slate-900/60 pl-2">
              <div className="text-sky-400 font-bold">ANNOTATION EFFICIENCY:</div>
              <div className="text-emerald-400 font-bold">+{learningGain.toFixed(2)}% acc</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Resolution workspace & Code */}
      <div className="xl:col-span-7 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between gap-3">
        {selectedEvent ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            {/* Visualizer */}
            <div className="h-[140px] md:h-full min-h-[140px]">
              <SolarLineChart
                dataX={steps}
                series={[
                  { name: 'SXR telemetry curve', data: selectedEvent.data, color: '#f97316', glow: true },
                ]}
                title={`${selectedEvent.id} Light Curve`}
                xLabel="Delta Step"
                yLabel="Flux"
              />
            </div>

            {/* Resolution Buttons */}
            <div className="bg-slate-950 border border-slate-850 p-3 rounded flex flex-col justify-between font-mono text-[10px]">
              <div>
                <div className="text-orange-400 uppercase tracking-wider font-bold mb-1 border-b border-slate-800 pb-1">
                  Resolve Classification
                </div>
                <p className="text-[9px] text-slate-500 leading-relaxed mb-3">
                  Inspect the temporal shape above. Rapid flux gradients indicate M/X class flares, while long slow rises are C-class.
                </p>

                <div className="grid grid-cols-3 gap-1">
                  {(['C', 'M', 'X'] as const).map(cls => (
                    <button
                      key={cls}
                      onClick={() => handleManualResolve(cls)}
                      className="py-1.5 bg-slate-900 hover:bg-slate-800 hover:text-orange-400 border border-slate-800 font-bold rounded text-[9px] cursor-pointer"
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 p-1.5 rounded text-[8px] text-slate-500 mt-2">
                Region: <strong className="text-slate-300">{selectedEvent.active_region}</strong> | Elastic Weight Consolidation (EWC) active to prevent catastrophic forgetting.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-slate-950/40 rounded border border-dashed border-slate-850 flex items-center justify-center p-6 text-slate-500 text-[10px] font-mono">
            Please reload or select an uncertain event to resolve.
          </div>
        )}
      </div>
    </div>
  );
};
