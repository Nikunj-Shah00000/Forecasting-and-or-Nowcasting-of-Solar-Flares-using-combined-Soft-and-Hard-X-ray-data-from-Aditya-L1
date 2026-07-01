export type TabType =
  | 'physics_loss'
  | 'multi_horizon'
  | 'mc_dropout'
  | 'state_catalogue'
  | 'anomaly_detector'
  | 'synthetic_gan'
  | 'active_learning'
  | 'digital_twin'
  | 'space_risk'
  | 'data_communicator';

export interface TelemetryState {
  timestamp: string;
  solexsFlux: number; // 0.5 - 15 keV
  hel1osFlux: number; // 10 - 150 keV
  magneticEnergy: number; // erg/cm3
  magneticShear: number; // degrees
  spectralIndex: number; // gamma
  fluxGradient: number;
  hardToSoftRatio: number;
  activeRegion: string;
}

export interface CataloguedFlare {
  id: string;
  start_time: string;
  peak_time: string;
  end_time: string;
  class: 'A' | 'B' | 'C' | 'M' | 'X';
  intensity: number;
  confidence: number;
  active_region: string;
  snr: number;
  status: 'COMPLETED' | 'ONGOING';
}

export interface SimulationResult {
  timeSteps: number[];
  solexsCurve: number[];
  hel1osCurve: number[];
  predictionCurve: number[];
  uncertaintyUpper?: number[];
  uncertaintyLower?: number[];
}
