export const PYTORCH_CODE_SNIPPETS = {
  physics_loss: `import torch
import torch.nn as nn

class PhysicsInformedNeupertLoss(nn.Module):
    """
    Physics-Informed Loss incorporating the Neupert Effect.
    The Neupert Effect states that the Soft X-ray (SXR) flux derivative is proportional 
    to the Hard X-ray (HXR) flux (energy deposition rate):
        d(SXR)/dt ≈ α * HXR(t) - β * SXR(t) (where β is cooling rate)
    """
    def __init__(self, alpha=1.2, beta=0.15, lambda_phys=0.5):
        super(PhysicsInformedNeupertLoss, self).__init__()
        self.alpha = alpha
        self.beta = beta
        self.lambda_phys = lambda_phys
        self.mse_loss = nn.MSELoss()

    def forward(self, pred_sxr, raw_hxr, target_sxr, dt=1.0):
        # 1. Standard Data-Driven Loss (MSE)
        data_loss = self.mse_loss(pred_sxr, target_sxr)
        
        # 2. Physics-Based Consistency Term
        # SXR temporal derivative: [batch_size, seq_len - 1]
        dsxr_dt = (pred_sxr[:, 1:] - pred_sxr[:, :-1]) / dt
        
        # SXR middle point approximation for cooling term
        sxr_mid = pred_sxr[:, :-1]
        
        # HXR driver term
        hxr_mid = raw_hxr[:, :-1]
        
        # Physical discrepancy: d(SXR)/dt - (α * HXR - β * SXR)
        physical_residuals = dsxr_dt - (self.alpha * hxr_mid - self.beta * sxr_mid)
        physics_loss = torch.mean(physical_residuals ** 2)
        
        # Total Weighted Loss
        total_loss = data_loss + self.lambda_phys * physics_loss
        return total_loss, data_loss, physics_loss

class PhysicsInputLayer(nn.Module):
    """
    Physics Layer sitting between raw telemetry inputs and the Neural Network.
    Computes domain-specific parameters like Estimated Magnetic Energy Build-up (Em) 
    and Heating Rate (Q) explicitly.
    """
    def __init__(self, input_dim):
        super(PhysicsInputLayer, self).__init__()
        
    def forward(self, flux_solexs, flux_hel1os, b_field_gradient):
        # Estimated Magnetic Energy Build-up: Em ∝ (dB/dt) * SXR
        # Heating Rate (Neupert proxy): Q = SXR_derivative + cooling
        flux_derivative = torch.gradient(flux_solexs, dim=-1)[0]
        heating_rate = flux_derivative + 0.1 * flux_solexs
        magnetic_energy = b_field_gradient ** 2 * flux_hel1os
        
        # Concatenate domain features alongside raw features
        physics_features = torch.stack([heating_rate, magnetic_energy], dim=-1)
        return physics_features`,

  multi_horizon: `import torch
import torch.nn as nn

class MultiHorizonFlarePredictor(nn.Module):
    """
    Hybrid (CNN + Transformer + Bi-LSTM) with Multi-Head outputs 
    for multi-horizon forecasting (5, 15, 30, and 60 minutes).
    """
    def __init__(self, feature_dim, hidden_dim=128):
        super(MultiHorizonFlarePredictor, self).__init__()
        # 1. Spatio-Temporal Hybrid Backbone
        self.conv1d = nn.Conv1d(feature_dim, 64, kernel_size=3, padding=1)
        self.lstm = nn.LSTM(64, hidden_dim, batch_first=True, bidirectional=True)
        
        # Transformer Encoder layer
        encoder_layer = nn.TransformerEncoderLayer(d_model=hidden_dim*2, nhead=4, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=2)
        
        # 2. Multi-Horizon Forecasting Heads
        # Each head predicts the probability of flare occurrence in that window
        self.head_5m = nn.Linear(hidden_dim * 2, 1)
        self.head_15m = nn.Linear(hidden_dim * 2, 1)
        self.head_30m = nn.Linear(hidden_dim * 2, 1)
        self.head_60m = nn.Linear(hidden_dim * 2, 1)
        
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        # x shape: [Batch, SeqLen, Features]
        # Transpose for Conv1d
        x_conv = self.conv1d(x.transpose(1, 2)).transpose(1, 2)
        
        # Bi-LSTM Layer
        lstm_out, _ = self.lstm(x_conv)
        
        # Transformer Layer
        feat = self.transformer(lstm_out)
        
        # Aggregate temporal features (e.g., mean pooling)
        feat_pooled = torch.mean(feat, dim=1)
        
        # Compute multi-horizon predictions
        p5 = self.sigmoid(self.head_5m(feat_pooled))
        p15 = self.sigmoid(self.head_15m(feat_pooled))
        p30 = self.sigmoid(self.head_30m(feat_pooled))
        p60 = self.sigmoid(self.head_60m(feat_pooled))
        
        return torch.cat([p5, p15, p30, p60], dim=-1) # Shape: [Batch, 4]

class WeightedHorizonLoss(nn.Module):
    """
    Weighted BCE Loss that prioritizes shorter horizons (5m, 15m) 
    while preserving longer horizons (30m, 60m).
    """
    def __init__(self, weights=[1.0, 0.8, 0.5, 0.3]):
        super(WeightedHorizonLoss, self).__init__()
        self.weights = torch.tensor(weights)
        self.bce = nn.BCELoss(reduction='none')

    def forward(self, pred, targets):
        # pred, targets: [Batch, 4]
        loss = self.bce(pred, targets)
        weighted_loss = loss * self.weights.to(pred.device)
        return torch.mean(weighted_loss)

# Training Strategy: Curriculum Learning Warm-up
# 1. Train only on 5m prediction head for epochs 0-5
# 2. Add 15m and 30m heads for epochs 5-15
# 3. Enable all heads (including 60m) for epochs 15+`,

  mc_dropout: `import torch
import torch.nn as nn
import numpy as np

class MCDropoutPredictor:
    """
    Wraps standard PyTorch model with MC Dropout inference wrapper.
    Ensures dropout remains active at test time to sample posterior predictive distribution.
    """
    def __init__(self, model, num_samples=25):
        self.model = model
        self.num_samples = num_samples

    def enable_dropout(self):
        # Force keep dropout active in evaluation mode
        for m in self.model.modules():
            if m.__class__.__name__.startswith('Dropout'):
                m.train()

    def predict_with_uncertainty(self, input_tensor):
        self.model.eval()
        self.enable_dropout() # Reactivate dropout
        
        predictions = []
        with torch.no_grad():
            for _ in range(self.num_samples):
                # Forward pass through model with random dropout masks
                pred = self.model(input_tensor) # Shape: [Batch, 4]
                predictions.append(pred.cpu().numpy())
                
        predictions = np.stack(predictions, axis=0) # [T_Samples, Batch, 4]
        
        # Calculate Predictive Mean and Epistemic Uncertainty (Variance)
        pred_mean = np.mean(predictions, axis=0)
        pred_var = np.var(predictions, axis=0)
        pred_std = np.sqrt(pred_var)
        
        # Calculate Confidence Score (Normalized to 0-100)
        # Higher variance translates directly to lower confidence score
        confidence_score = np.clip(100.0 - (pred_std * 2.0 * 100.0), 0.0, 100.0)
        
        return pred_mean, pred_std, confidence_score`,

  state_catalogue: `-- PostgreSQL / TimescaleDB Database Schema
-- Optimized for high-velocity telemetry logs and catalogued events

-- 1. Enable TimescaleDB extension (if available)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Master Event Catalogue Table
CREATE TABLE flare_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ NOT NULL,
    peak_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    flare_class CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'M', 'X'
    magnitude NUMERIC(4,2) NOT NULL, -- e.g., 3.4 for M3.4
    peak_intensity_sxr DOUBLE PRECISION NOT NULL,
    peak_intensity_hxr DOUBLE PRECISION NOT NULL,
    catalogue_confidence NUMERIC(5,2) NOT NULL,
    signal_to_noise_ratio DOUBLE PRECISION NOT NULL,
    active_region VARCHAR(16) DEFAULT 'AR13664',
    raw_data_ref VARCHAR(256) -- S3/Object Storage pointer
);

-- Indexing for rapid queries
CREATE INDEX idx_flare_class ON flare_events(flare_class, magnitude);
CREATE INDEX idx_event_time_range ON flare_events(start_time, end_time);

-- 3. High-Frequency Telemetry Hypertable
CREATE TABLE aditya_telemetry (
    time TIMESTAMPTZ NOT NULL,
    solexs_flux DOUBLE PRECISION NOT NULL,
    hel1os_flux DOUBLE PRECISION NOT NULL,
    b_gradient DOUBLE PRECISION,
    shear_angle DOUBLE PRECISION
);

-- Transform aditya_telemetry to hypertable partitioned by time
SELECT create_hypertable('aditya_telemetry', 'time');`,

  anomaly_detector: `import torch
import torch.nn as nn

class LSTMAutoencoder(nn.Module):
    """
    Unsupervised Reconstruction-Based Anomaly Detector for X-ray Telemetry.
    High reconstruction error indicates highly unseen physical configurations.
    """
    def __init__(self, input_dim=2, seq_len=60, hidden_dim=32):
        super(LSTMAutoencoder, self).__init__()
        self.seq_len = seq_len
        
        # Encoder Module
        self.encoder_lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        
        # Decoder Module
        self.decoder_lstm = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
        self.reconstruction_head = nn.Linear(hidden_dim, input_dim)

    def forward(self, x):
        # x shape: [Batch, SeqLen, InputDim]
        _, (hidden, _) = self.encoder_lstm(x)
        # Final hidden state shape: [1, Batch, HiddenDim]
        
        # Repeat hidden state to reconstruct the sequence
        repeat_hidden = hidden.transpose(0, 1).repeat(1, self.seq_len, 1)
        
        # Decoder
        decoder_out, _ = self.decoder_lstm(repeat_hidden)
        reconstruction = self.reconstruction_head(decoder_out)
        
        return reconstruction

class AnomalyScorer:
    def __init__(self, autoencoder_model, threshold_percentile=99.5):
        self.model = autoencoder_model
        self.threshold = None
        self.threshold_percentile = threshold_percentile

    def fit_threshold(self, validation_loader):
        # Compute reconstruction error on non-anomalous normal data
        self.model.eval()
        errors = []
        with torch.no_grad():
            for x, _ in validation_loader:
                recon = self.model(x)
                mse = torch.mean((recon - x) ** 2, dim=(1,2))
                errors.extend(mse.cpu().numpy())
        self.threshold = np.percentile(errors, self.threshold_percentile)

    def score(self, x):
        self.model.eval()
        with torch.no_grad():
            recon = self.model(x)
            recon_error = torch.mean((recon - x) ** 2, dim=(1,2)).cpu().numpy()
        
        # Normalized anomaly score (percentage of threshold)
        anomaly_score = (recon_error / self.threshold) * 50.0
        is_anomaly = recon_error > self.threshold
        return anomaly_score, is_anomaly, recon`,

  synthetic_gan: `import torch
import torch.nn as nn

class ConditionalTimeGenerator(nn.Module):
    """
    Conditional Generator architecture for synthesizing realistic Aditya-L1 SXR/HXR curves.
    Conditions on flare class and peak duration.
    """
    def __init__(self, latent_dim=100, cond_dim=2, output_len=60, output_dim=2):
        super(ConditionalTimeGenerator, self).__init__()
        self.output_len = output_len
        self.output_dim = output_dim
        
        # Inject physical conditions alongside latent noise
        self.input_layer = nn.Linear(latent_dim + cond_dim, 128 * 15)
        
        self.conv_blocks = nn.Sequential(
            nn.BatchNorm1d(128),
            nn.Upsample(scale_factor=2), # Length 30
            nn.Conv1d(128, 64, kernel_size=3, padding=1),
            nn.LeakyReLU(0.2, inplace=True),
            
            nn.BatchNorm1d(64),
            nn.Upsample(scale_factor=2), # Length 60
            nn.Conv1d(64, 32, kernel_size=3, padding=1),
            nn.LeakyReLU(0.2, inplace=True),
            
            nn.Conv1d(32, output_dim, kernel_size=3, padding=1),
            nn.Tanh() # Symmetrical scaling for X-ray dynamics
        )

    def forward(self, noise, conditions):
        # noise: [Batch, LatentDim], conditions: [Batch, CondDim]
        gen_input = torch.cat((noise, conditions), -1)
        x = self.input_layer(gen_input)
        x = x.view(-1, 128, 15) # Reshape for ConvTrans/Upsample
        
        synthetic_series = self.conv_blocks(x) # Shape: [Batch, 2, 60]
        return synthetic_series.transpose(1, 2) # [Batch, 60, 2]

# Turing Metric: Maximum Mean Discrepancy (MMD)
# Compares raw X-ray data distributions vs. synthetic samples in RKHS.
# If MMD < 0.05, synthetic samples are statistically indistinguishable.`,

  active_learning: `import numpy as np

class ActiveLearningEngine:
    """
    Active Learning selection system using Query-by-Committee 
    and predictive entropy for real-time telemetry events.
    """
    def __init__(self, model_committee, buffer_size=100):
        self.committee = model_committee # List of trained models with different initializations
        self.uncertainty_buffer = []
        self.buffer_size = buffer_size

    def evaluate_entropy(self, telemetry_slice):
        predictions = []
        for model in self.committee:
            pred = model(telemetry_slice) # shape: [1, 4]
            predictions.append(pred.numpy())
            
        predictions = np.stack(predictions, axis=0) # [NumModels, 1, 4]
        mean_pred = np.mean(predictions, axis=0)[0]
        
        # Calculate Predictive Entropy: H(y|x) = - Σ p_i * log2(p_i)
        entropy = -np.sum(mean_pred * np.log2(mean_pred + 1e-12))
        return entropy

    def check_for_buffer_insertion(self, event_id, telemetry_slice, raw_data):
        entropy = self.evaluate_entropy(telemetry_slice)
        
        # High entropy indicates extreme model disagreement
        if entropy > 1.2: 
            self.uncertainty_buffer.append({
                "id": event_id,
                "entropy": entropy,
                "telemetry": raw_data,
                "timestamp": datetime.now().isoformat()
            })
            # Limit buffer to avoid overflowing RAM
            if len(self.uncertainty_buffer) > self.buffer_size:
                self.uncertainty_buffer.pop(0) # FIFO
                
# incremental training: Fine-tuning strategy with elastic weight consolidation (EWC) 
# to mitigate catastrophic forgetting when training on expert corrections.`,

  digital_twin: `import numpy as np

class DigitalTwinSimulator:
    """
    Propagates user perturbations through the Hybrid forecasting models.
    Supports counter-factual simulation modeling for solar active regions.
    """
    def __init__(self, prediction_model):
        self.model = prediction_model

    def propagate_perturbation(self, base_telemetry, field_name, delta_percent):
        """
        Perturb an input feature (e.g. increase Magnetic Shear +30%)
        and see the downstream forecast trajectory and delta changes.
        """
        perturbed_telemetry = base_telemetry.copy()
        
        # Apply perturbation
        scale_factor = 1.0 + (delta_percent / 100.0)
        perturbed_telemetry[field_name] *= scale_factor
        
        # Run forecast
        predictions = self.model.predict(perturbed_telemetry)
        return perturbed_telemetry, predictions

    def compute_fidelity(self, observation, simulation):
        """
        Computes Mean Absolute Percentage Error (MAPE) to evaluate Digital Twin simulation accuracy.
        Fidelity Score = Max(0, 100 - MAPE)
        """
        mape = np.mean(np.abs((observation - simulation) / (observation + 1e-12))) * 100
        return max(0.0, 100.0 - mape)`,

  space_risk: `class ImpactEstimator:
    """
    Maps flare magnitude and solar wind conditions into action-oriented 
    space weather hazard scores (1-5 scale) across four vital sectors.
    """
    def __init__(self):
        # Base multiplier per class
        self.class_mult = {'A': 1, 'B': 2, 'C': 3, 'M': 4, 'X': 5}

    def estimate_risks(self, flare_class, magnitude, lat=45.0, alt=400):
        # 1. Base Score derived from flare class & magnitude
        base = self.class_mult.get(flare_class, 1) + (magnitude * 0.1)
        
        # 2. Satellites: Sensitive to drag (lower altitude = higher density)
        drag_trigger = 1.2 if alt < 500 else 1.0
        satellite_risk = min(5, round(base * 0.9 * drag_trigger))
        
        # 3. GPS/GNSS: Driven by Ionospheric scintillation (flare intensity)
        gps_risk = min(5, round(base * 1.1))
        
        # 4. HF Radio Blackout: Directly driven by Soft X-ray burst ionization
        hf_risk = min(5, round(base * 1.3))
        
        # 5. Power Grid GIC: Higher risks at high geographic latitudes
        lat_effect = 1.4 if abs(lat) > 55 else 0.8
        power_risk = min(5, round(base * 0.8 * lat_effect))
        
        return {
            "satellite": satellite_risk,
            "gps": gps_risk,
            "hf_radio": hf_risk,
            "power_grid": power_risk
        }

    def resolve_alerts(self, risks, confidence):
        # Escalate state and emit notifications dynamically if risk crosses critical thresholds
        escalation_flag = False
        alert_payload = {}
        for sector, score in risks.items():
            if score >= 4 and confidence > 75.0:
                escalation_flag = True
                alert_payload[sector] = "RED_CRITICAL"
            elif score >= 3:
                alert_payload[sector] = "YELLOW_WARNING"
            else:
                alert_payload[sector] = "GREEN_STABLE"
        return escalation_flag, alert_payload`,

  data_communicator: `import jinja2

class ExplanationGenerator:
    """
    Generates natural-language scientific summaries of flare forecasts, 
    mapping feature derivatives and SHAP importances to plain-English narratives.
    """
    def __init__(self):
        self.template_string = """
        A **{{ confidence_tier }}** alert indicates a **{{ class_val }}-class** solar flare 
        is anticipated within **{{ horizon }}** minutes with a **{{ probability }}%** prediction likelihood. 
        
        This forecast is driven by {{ key_mechanism }}. The anomaly scoring pipeline is reporting 
        **{{ anomaly_state }}** status, while the Digital Twin computes a **{{ twin_fidelity }}%** 
        physical consistency metric. Mission control should **{{ guidance }}**.
        """
        self.template = jinja2.Template(self.template_string)

    def generate_narrative(self, pred_prob, confidence, anomalies, shap_dict, horizon=15):
        # Translate confidence score to professional tier
        if confidence >= 85:
            conf_tier = "HIGH-CONFIDENCE CRITICAL"
            guidance = "escalate to standard alert channels and prepare satellites for drag expansion"
        elif confidence >= 60:
            conf_tier = "MODERATE-CONFIDENCE VALIDATED"
            guidance = "monitor active region magnetograms closely for spectral hardening"
        else:
            conf_tier = "PRELIMINARY TENTATIVE"
            guidance = "stand by for additional high-frequency Heliophysical validation passes"

        # Map SHAP feature names to physical terms
        top_feature = max(shap_dict, key=shap_dict.get)
        if top_feature == "hel1os_flux_derivative":
            key_mechanism = "a rapid spectral hardening of the Hard X-ray emission band (HEL1OS)"
        elif top_feature == "b_gradient":
            key_mechanism = "extreme magnetic shearing and intense field gradients in active region AR13664"
        else:
            key_mechanism = "sustained Soft X-ray flux build-up violating baseline thermal equilibrium"

        # Flare class approximation
        class_val = "M" if pred_prob > 0.4 else "X" if pred_prob > 0.75 else "C"
        
        # Render narrative report
        return self.template.render(
            confidence_tier=conf_tier,
            class_val=class_val,
            horizon=horizon,
            probability=int(pred_prob * 100),
            key_mechanism=key_mechanism,
            anomaly_state="ABNORMAL" if anomalies > 70 else "NOMINAL",
            twin_fidelity=89,
            guidance=guidance
        )`
};

export const DEFAULT_FLARE_CATALOGUE: any[] = [
  { id: 'FL-2026-001', start_time: '04:02:10', peak_time: '04:11:45', end_time: '04:28:15', class: 'M', intensity: 3.4, confidence: 91.2, active_region: 'AR13664', snr: 28.4, status: 'COMPLETED' },
  { id: 'FL-2026-002', start_time: '04:22:05', peak_time: '04:25:30', end_time: '--:--:--', class: 'X', intensity: 1.2, confidence: 84.7, active_region: 'AR13664', snr: 42.1, status: 'ONGOING' },
  { id: 'FL-2026-003', start_time: '03:15:20', peak_time: '03:19:00', end_time: '03:32:10', class: 'C', intensity: 8.5, confidence: 95.8, active_region: 'AR13662', snr: 15.2, status: 'COMPLETED' },
  { id: 'FL-2026-004', start_time: '02:40:00', peak_time: '02:45:12', end_time: '02:59:45', class: 'M', intensity: 1.1, confidence: 88.3, active_region: 'AR13665', snr: 21.7, status: 'COMPLETED' },
];

export const TEMPLATE_NARRATIVES = {
  high: "A **HIGH-CONFIDENCE CRITICAL** alert indicates an **X-class** solar flare is anticipated within **15** minutes with an **84%** prediction likelihood. This forecast is driven by extreme magnetic shearing and intense field gradients in active region AR13664. The anomaly scoring pipeline is reporting **NOMINAL** status, while the Digital Twin computes an **89%** physical consistency metric. Mission control should **escalate to standard alert channels and prepare satellites for drag expansion**.",
  moderate: "A **MODERATE-CONFIDENCE VALIDATED** alert indicates an **M-class** solar flare is anticipated within **15** minutes with a **58%** prediction likelihood. This forecast is driven by rapid spectral hardening of the Hard X-ray emission band (HEL1OS). The anomaly scoring pipeline is reporting **NOMINAL** status, while the Digital Twin computes an **85%** physical consistency metric. Mission control should **monitor active region magnetograms closely for spectral hardening**.",
  low: "A **PRELIMINARY TENTATIVE** observation suggests an **M-class** solar flare is anticipated within **15** minutes with a **42%** prediction likelihood. This forecast is driven by sustained Soft X-ray flux build-up violating baseline thermal equilibrium. The anomaly scoring pipeline is reporting **ABNORMAL** status, while the Digital Twin computes a **72%** physical consistency metric. Mission control should **stand by for additional high-frequency Heliophysical validation passes**."
};
