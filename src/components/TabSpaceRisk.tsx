import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, ShieldAlert, Cpu, AlertTriangle, Send, Mail } from 'lucide-react';

export const TabSpaceRisk: React.FC = () => {
  const [flareClass, setFlareClass] = useState<'C' | 'M' | 'X'>('M');
  const [latitude, setLatitude] = useState<number>(45);
  const [altitude, setAltitude] = useState<number>(400);

  // Calculated risks (1 to 5 scale)
  const [satelliteRisk, setSatelliteRisk] = useState<number>(2);
  const [gpsRisk, setGpsRisk] = useState<number>(3);
  const [hfRisk, setHfRisk] = useState<number>(3);
  const [powerRisk, setPowerRisk] = useState<number>(2);
  const [alertLogs, setAlertLogs] = useState<string[]>([]);

  useEffect(() => {
    // Logic matching our ImpactEstimator class rules
    let base = flareClass === 'X' ? 4.5 : flareClass === 'M' ? 3.0 : 1.5;

    const dragTrigger = altitude < 450 ? 1.3 : 1.0;
    const sat = Math.min(5, Math.round(base * 0.9 * dragTrigger));
    const gps = Math.min(5, Math.round(base * 1.1));
    const hf = Math.min(5, Math.round(base * 1.3));

    const latTrigger = Math.abs(latitude) > 55 ? 1.4 : 0.8;
    const power = Math.min(5, Math.round(base * 0.8 * latTrigger));

    setSatelliteRisk(sat);
    setGpsRisk(gps);
    setHfRisk(hf);
    setPowerRisk(power);

    // Dynamic escalation logger
    const logs: string[] = [];
    if (sat >= 4) logs.push(`[CRITICAL] High orbital atmospheric drag hazard detected at ${altitude}km LEO altitude.`);
    if (power >= 4) logs.push(`[CRITICAL] Geo-Induced Current (GIC) hazard triggered at polar latitude ${latitude}°N.`);
    if (hf >= 4) logs.push(`[CRITICAL] Prolonged high-frequency radio blackout alert broadcasted.`);
    
    if (logs.length === 0) {
      logs.push(`[NOMINAL] Systems reporting stable status levels across all evaluated sectors.`);
    }
    setAlertLogs(logs);
  }, [flareClass, latitude, altitude]);

  // Color mapping for risk scales
  const getRiskColor = (score: number) => {
    if (score >= 5) return 'text-red-500 bg-red-950/40 border-red-500/25';
    if (score >= 4) return 'text-red-400 bg-red-900/10 border-red-500/10 animate-pulse';
    if (score >= 3) return 'text-amber-400 bg-amber-950/20 border-amber-500/15';
    return 'text-emerald-400 bg-emerald-950/20 border-emerald-500/15';
  };

  return (
    <div id="tab-space-risk" className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 animate-fadeIn">
      
      {/* Parameter Control Panel */}
      <div className="xl:col-span-4 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">Dynamic Hazard Estimator</span>
          </div>

          <p className="text-[9px] text-slate-400 font-mono italic">
            Synthesize spatial indices (orbit altitude, power grid geographic latitude) to map predicted solar class into actionable hazard levels.
          </p>

          {/* Target Flare Class */}
          <div className="space-y-1">
            <span className="text-[8px] text-slate-500 font-mono uppercase font-bold block">Input: Predicted Flare Class</span>
            <div className="grid grid-cols-3 gap-1">
              {(['C', 'M', 'X'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setFlareClass(c)}
                  className={`py-1 text-[9px] font-mono font-bold rounded border transition-all cursor-pointer ${
                    flareClass === c
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                      : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-800'
                  }`}
                >
                  Class {c}
                </button>
              ))}
            </div>
          </div>

          {/* Latitude Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Grid Latitude Index</span>
              <span className="text-orange-400 font-bold">{latitude}°N</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={latitude}
              onChange={(e) => setLatitude(parseInt(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>

          {/* Orbit Altitude Slider */}
          <div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
              <span>Satellite Orbit Altitude</span>
              <span className="text-orange-400 font-bold">{altitude} km</span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              step="50"
              value={altitude}
              onChange={(e) => setAltitude(parseInt(e.target.value))}
              className="w-full h-1 accent-orange-500 bg-slate-800 rounded appearance-none"
            />
          </div>
        </div>

        {/* Actionable Dispatch Status */}
        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded mt-3 space-y-2 font-mono text-[9px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Automated Warning Broadcasts</div>
          <div className="space-y-1.5 max-h-[80px] overflow-y-auto text-[8px]">
            {alertLogs.map((log, idx) => (
              <div key={idx} className={`p-1.5 border rounded leading-relaxed ${
                log.includes('CRITICAL') ? 'text-red-400 bg-red-950/20 border-red-500/20' : 'text-slate-500 border-slate-900/60'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2x2 Risk Meter Grid & PyTorch Snippet */}
      <div className="xl:col-span-8 bg-slate-900 border border-slate-800 p-3 rounded flex flex-col gap-3">
        
        {/* Risk Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 font-mono">
          
          {/* Satellites */}
          <div className={`p-2.5 border rounded flex flex-col justify-between h-20 transition-all ${getRiskColor(satelliteRisk)}`}>
            <div>
              <div className="text-[8px] opacity-65 uppercase font-bold">Orbital Satellites</div>
              <div className="text-lg font-black tracking-tight">{satelliteRisk}/5</div>
            </div>
            <div className="text-[7.5px] uppercase font-bold opacity-80">
              {satelliteRisk >= 4 ? 'CRITICAL DRAG' : satelliteRisk >= 3 ? 'MODERATE DEGRADE' : 'NOMINAL SAFETY'}
            </div>
          </div>

          {/* GPS/GNSS */}
          <div className={`p-2.5 border rounded flex flex-col justify-between h-20 transition-all ${getRiskColor(gpsRisk)}`}>
            <div>
              <div className="text-[8px] opacity-65 uppercase font-bold">GPS/GNSS System</div>
              <div className="text-lg font-black tracking-tight">{gpsRisk}/5</div>
            </div>
            <div className="text-[7.5px] uppercase font-bold opacity-80">
              {gpsRisk >= 4 ? 'IONOSPHERIC SCINT' : gpsRisk >= 3 ? 'LATENCY DEVIATION' : 'NOMINAL PRECISION'}
            </div>
          </div>

          {/* HF Radio */}
          <div className={`p-2.5 border rounded flex flex-col justify-between h-20 transition-all ${getRiskColor(hfRisk)}`}>
            <div>
              <div className="text-[8px] opacity-65 uppercase font-bold">HF Radio Comms</div>
              <div className="text-lg font-black tracking-tight">{hfRisk}/5</div>
            </div>
            <div className="text-[7.5px] uppercase font-bold opacity-80">
              {hfRisk >= 4 ? 'COMPLETE BLACKOUT' : hfRisk >= 3 ? 'FADE / INTERFERENCE' : 'NOMINAL SIGNAL'}
            </div>
          </div>

          {/* Power Grid */}
          <div className={`p-2.5 border rounded flex flex-col justify-between h-20 transition-all ${getRiskColor(powerRisk)}`}>
            <div>
              <div className="text-[8px] opacity-65 uppercase font-bold">Power Grids (GIC)</div>
              <div className="text-lg font-black tracking-tight">{powerRisk}/5</div>
            </div>
            <div className="text-[7.5px] uppercase font-bold opacity-80">
              {powerRisk >= 4 ? 'TRANSFORMER GIC' : powerRisk >= 3 ? 'VOLTAGE SPIKE' : 'NOMINAL VOLTAGE'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
