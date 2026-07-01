import React, { useState, useEffect } from 'react';
import {
  Sun,
  Activity,
  Cpu,
  Layers,
  Database,
  AlertTriangle,
  Sparkles,
  UserCheck,
  RotateCw,
  ShieldAlert,
  FileText,
  Clock,
  Radio,
  HelpCircle,
  X
} from 'lucide-react';

import { TabType, TelemetryState } from './types';

// Tab components
import { TabPhysicsLoss } from './components/TabPhysicsLoss';
import { TabMultiHorizon } from './components/TabMultiHorizon';
import { TabMcDropout } from './components/TabMcDropout';
import { TabStateCatalogue } from './components/TabStateCatalogue';
import { TabAnomalyDetector } from './components/TabAnomalyDetector';
import { TabSyntheticGan } from './components/TabSyntheticGan';
import { TabActiveLearning } from './components/TabActiveLearning';
import { TabDigitalTwin } from './components/TabDigitalTwin';
import { TabSpaceRisk } from './components/TabSpaceRisk';
import { TabDataCommunicator } from './components/TabDataCommunicator';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('physics_loss');
  const [systemTime, setSystemTime] = useState<string>('');
  const [showHelperModal, setShowHelperModal] = useState<boolean>(false);

  // Live telemetry stream state
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    timestamp: '',
    solexsFlux: 3.42,
    hel1osFlux: 12.18,
    magneticEnergy: 842.15,
    magneticShear: 32.4,
    spectralIndex: 2.14,
    fluxGradient: 1.25,
    hardToSoftRatio: 3.56,
    activeRegion: 'AR13664',
  });

  // Clock ticks
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setSystemTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Soft slow variation in background telemetry to represent live satellite streams
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setTelemetry((prev) => {
        const deltaSxr = (Math.random() - 0.5) * 0.15;
        const deltaHxr = (Math.random() - 0.5) * 0.6;
        return {
          ...prev,
          solexsFlux: Math.max(0.5, prev.solexsFlux + deltaSxr),
          hel1osFlux: Math.max(2.0, prev.hel1osFlux + deltaHxr),
          magneticEnergy: Math.max(700, prev.magneticEnergy + (Math.random() - 0.5) * 5),
          hardToSoftRatio: Math.max(1.1, (prev.hel1osFlux / prev.solexsFlux))
        };
      });
    }, 4000);
    return () => clearInterval(telemetryInterval);
  }, []);

  // Render the selected tab component
  const renderTabContent = () => {
    switch (activeTab) {
      case 'physics_loss':
        return <TabPhysicsLoss />;
      case 'multi_horizon':
        return <TabMultiHorizon />;
      case 'mc_dropout':
        return <TabMcDropout />;
      case 'state_catalogue':
        return <TabStateCatalogue />;
      case 'anomaly_detector':
        return <TabAnomalyDetector />;
      case 'synthetic_gan':
        return <TabSyntheticGan />;
      case 'active_learning':
        return <TabActiveLearning />;
      case 'digital_twin':
        return <TabDigitalTwin />;
      case 'space_risk':
        return <TabSpaceRisk />;
      case 'data_communicator':
        return <TabDataCommunicator />;
      default:
        return <TabPhysicsLoss />;
    }
  };

  const tabsConfig = [
    { id: 'physics_loss', label: '1. Physics Loss', icon: Sun },
    { id: 'multi_horizon', label: '2. Multi-Horizon', icon: Layers },
    { id: 'mc_dropout', label: '3. MC Uncertainty', icon: Cpu },
    { id: 'state_catalogue', label: '4. State Catalogue', icon: Database },
    { id: 'anomaly_detector', label: '5. Anomaly Scope', icon: AlertTriangle },
    { id: 'synthetic_gan', label: '6. cGAN Generator', icon: Sparkles },
    { id: 'active_learning', label: '7. Active Learning', icon: UserCheck },
    { id: 'digital_twin', label: '8. Digital Twin', icon: RotateCw },
    { id: 'space_risk', label: '9. Weather Risk', icon: ShieldAlert },
    { id: 'data_communicator', label: '10. Narrative Report', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* Top Professional Mission Control Header */}
      <header className="flex items-center justify-between px-4 h-12 bg-slate-950 border-b border-slate-900 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-6.5 h-6.5 bg-orange-600 rounded flex items-center justify-center mr-2 shadow shadow-orange-950/40 animate-pulse">
              <Sun className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5 uppercase font-mono">
              SuryaDrishti-AI <span className="text-slate-500 font-mono text-[8px] tracking-widest">v1.2.4-BETA</span>
            </h1>
          </div>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center space-x-1.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider font-mono">ISSDC ADITYA-L1 TELEMETRY ONLINE</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden md:block font-mono">
            <div className="text-[7.5px] text-slate-500 uppercase font-bold tracking-wider leading-none">OBSERVATION TIMESTAMP</div>
            <div className="text-sky-400 text-[10px] mt-0.5">{systemTime || '0000-00-00 00:00:00 UTC'}</div>
          </div>
          <button
            onClick={() => setShowHelperModal(true)}
            className="p-1.5 hover:bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Heliophysics AI Reference Guide"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </header>

      {/* Primary Workspace Panel */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-1.5 p-1.5">
        
        {/* Left Side: Real-Time Stream Parameters & Live Diagnostic Ticker */}
        <div className="xl:col-span-3 bg-slate-950 border border-slate-900 rounded p-3 flex flex-col justify-between gap-3 font-mono">
          <div className="space-y-3">
            <div className="flex items-center gap-1 border-b border-slate-900 pb-1.5">
              <Radio className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Spacecraft Stream</span>
            </div>

            <div className="space-y-2">
              {/* Active region indicator */}
              <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-900">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Target Region:</span>
                <span className="text-[10px] text-orange-400 font-bold bg-orange-950/20 px-1.5 py-0.5 rounded border border-orange-500/15">
                  {telemetry.activeRegion}
                </span>
              </div>

              {/* SXR flux row */}
              <div className="flex justify-between items-center text-[9px] border-b border-slate-900/40 py-1">
                <span className="text-slate-500 font-bold">SOLEXS SXR FLUX:</span>
                <span className="text-slate-300 font-bold">{telemetry.solexsFlux.toFixed(2)} μW/m²</span>
              </div>

              {/* HXR flux row */}
              <div className="flex justify-between items-center text-[9px] border-b border-slate-900/40 py-1">
                <span className="text-slate-500 font-bold">HEL1OS HXR FLUX:</span>
                <span className="text-slate-300 font-bold">{telemetry.hel1osFlux.toFixed(2)} count/s</span>
              </div>

              {/* HXR to SXR Ratio */}
              <div className="flex justify-between items-center text-[9px] border-b border-slate-900/40 py-1">
                <span className="text-slate-500 font-bold">ENERGY RATIO:</span>
                <span className="text-sky-400 font-bold">{telemetry.hardToSoftRatio.toFixed(2)}</span>
              </div>

              {/* Mag energy */}
              <div className="flex justify-between items-center text-[9px] border-b border-slate-900/40 py-1">
                <span className="text-slate-500 font-bold">MAGNETIC ENERGY:</span>
                <span className="text-slate-300 font-bold">{telemetry.magneticEnergy.toFixed(1)} erg/cm³</span>
              </div>

              {/* Mag shear */}
              <div className="flex justify-between items-center text-[9px] border-b border-slate-900/40 py-1">
                <span className="text-slate-500 font-bold">SHEAR ANGLE (θ):</span>
                <span className="text-slate-300 font-bold">{telemetry.magneticShear}°</span>
              </div>
            </div>
          </div>

          {/* Quick status report footer inside telemetry column */}
          <div className="bg-slate-900/40 border border-slate-900 p-2.5 rounded font-mono text-[9px] space-y-1 text-slate-500">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-orange-500 animate-pulse" />
              Engine Pulse
            </div>
            <div className="flex justify-between">
              <span>CNN GPU INFERENCE:</span>
              <span className="text-emerald-400">1.8ms</span>
            </div>
            <div className="flex justify-between">
              <span>BI-LSTM TIMELINE:</span>
              <span className="text-emerald-400">2.1ms</span>
            </div>
            <div className="flex justify-between">
              <span>TRANSFORMER ATTN:</span>
              <span className="text-emerald-400">3.4ms</span>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Active Workspace Dashboard */}
        <div className="xl:col-span-9 flex flex-col gap-1.5">
          
          {/* Sub-Header Horizontal Tab Navigation Menu */}
          <div className="bg-slate-950 border border-slate-900 p-1 rounded-lg flex flex-wrap gap-1">
            {tabsConfig.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-3 py-1.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-orange-600/15 text-orange-400 border border-orange-500/20 shadow-md shadow-orange-950/20'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Main active tab container */}
          <div className="flex-1 bg-slate-950 border border-slate-900 p-3 rounded-lg overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Heliophysics AI Reference Modal */}
      {showHelperModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full overflow-hidden shadow-2xl font-mono text-[10px] leading-relaxed">
            <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
              <span className="text-orange-400 font-bold uppercase tracking-wider">Heliophysics AI Reference Guide</span>
              <button
                onClick={() => setShowHelperModal(false)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-slate-300 max-h-[350px] overflow-y-auto">
              <p>
                <strong>SuryaDrishti-AI</strong> integrates deep solar-physics relationships with spatio-temporal deep neural nets to forecast severe space weather flares.
              </p>
              
              <div className="space-y-1 bg-slate-950/50 p-2.5 rounded border border-slate-850">
                <span className="text-orange-400 font-bold block uppercase tracking-wider text-[9px]">1. The Neupert Effect</span>
                <p className="text-[9px] text-slate-400">
                  Thermal plasma emissions (Soft X-rays / SOLEXS) rise in proportional response to cumulative non-thermal electron beam bursts (Hard X-rays / HEL1OS):
                </p>
                <code className="text-sky-400 text-[9px]">d(SXR)/dt ∝ HXR(t)</code>
              </div>

              <div className="space-y-1 bg-slate-950/50 p-2.5 rounded border border-slate-850">
                <span className="text-orange-400 font-bold block uppercase tracking-wider text-[9px]">2. Epistemic Uncertainty Estimation</span>
                <p className="text-[9px] text-slate-400">
                  Calculated dynamically via <strong>Monte Carlo Dropout</strong> active at test-time. This provides predictive mean, variance, and confidence intervals to safety-critical operators.
                </p>
              </div>

              <div className="space-y-1 bg-slate-950/50 p-2.5 rounded border border-slate-850">
                <span className="text-orange-400 font-bold block uppercase tracking-wider text-[9px]">3. Active Learning & Twin Simulation</span>
                <p className="text-[9px] text-slate-400">
                  Enables researchers to perturbation-test input trajectories (such as increasing magnetic shearing index by +20%) and evaluate simulation consistency metrics relative to Magnetohydrodynamics (MHD) formulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
