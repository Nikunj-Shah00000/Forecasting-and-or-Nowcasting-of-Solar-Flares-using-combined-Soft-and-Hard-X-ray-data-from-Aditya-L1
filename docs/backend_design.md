# SuryaDrishti-AI Backend Design

## Goals

The backend turns Aditya-L1 X-ray observations into operational space-weather products:

- Nowcast ongoing flares from recent SoLEXS and HEL1OS light curves.
- Forecast flare probability for the next 5, 15, 30, and 60 minutes.
- Maintain an automated flare catalogue with start, peak, end, class, intensity, and confidence.
- Serve dashboard-ready time series, predictions, alerts, and historical analysis.

## Data Reality In This Repository

The current workspace contains two mission-data archives:

- `solexs_2026Jul01T104914063.zip`
  - Nested daily ZIPs such as `AL1_SLX_L1_20260628_v1.0.zip`.
  - Contains compressed FITS-like science products, including `.lc.gz`, `.pi.gz`, and `.gti.gz`.
- `hel1os_2026Jul01T104510245.zip`
  - Nested 12-hour ZIPs such as `HLS_20260629_120005_43187sec_lev1_V111.zip`.
  - Contains FITS light curves and spectra such as `lightcurve_czt1.fits`, `lightcurve_cdte1.fits`, and auxiliary GTI files.

Because both instruments publish time-series science products, the backend is designed around a FITS-aware ingestion pipeline.

## Architecture

```text
Data Archives / Live Feed
        |
        v
Ingestion Service
  - Discover nested ZIP products
  - Read FITS / compressed FITS products
  - Normalize instrument metadata
        |
        v
Preprocessing Service
  - Apply GTI filtering
  - Resample to common cadence
  - Align SoLEXS soft X-ray and HEL1OS hard X-ray timelines
  - Remove bad values and compute rolling background
        |
        v
Feature Service
  - Flux levels
  - Derivatives and rise rates
  - Soft/hard ratios
  - Burstiness and peak candidates
  - Rolling statistics over multiple windows
        |
        v
Prediction Engine
  - Nowcast: ongoing flare detection
  - Forecast: probability for 5, 15, 30, 60 minute horizons
  - Baseline rules now, trained ML/DL models later
        |
        v
Catalogue + Alerts
  - Flare event lifecycle
  - Confidence and class assignment
  - Alert severity and deduplication
        |
        v
FastAPI REST API / Dashboard
```

## Backend Modules

```text
backend/
  app/
    main.py                 FastAPI application setup
    config.py               Runtime configuration
    schemas.py              Shared API contracts
    routers/
      health.py             Service health
      observations.py       Data product discovery and time-series access
      predictions.py        Nowcast and forecast endpoints
      catalogue.py          Flare catalogue endpoints
      alerts.py             Alert endpoints
    services/
      ingestion.py          Archive and FITS product discovery
      preprocessing.py      Time alignment and feature engineering baseline
      modeling.py           Baseline prediction engine / model interface
      catalogue.py          Event catalogue logic
      alerts.py             Alert generation
```

## API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Health and version metadata |
| `GET` | `/observations/products` | List detected SoLEXS and HEL1OS products |
| `GET` | `/observations/window` | Return fused observation features for a time window |
| `POST` | `/predictions/nowcast` | Detect current flare state from recent samples |
| `POST` | `/predictions/forecast` | Forecast flare probabilities for configured horizons |
| `GET` | `/catalogue/flares` | List generated flare events |
| `POST` | `/catalogue/generate` | Generate catalogue entries from a time window |
| `GET` | `/alerts` | List recent alerts |
| `POST` | `/alerts/evaluate` | Evaluate forecast output and create alert candidates |

## Model Strategy

Start with a transparent baseline:

- Compute rolling background and z-scores from fused X-ray flux.
- Mark nowcast positive when flux rises significantly above local background.
- Forecast probabilities from precursor features:
  - soft X-ray rise rate,
  - hard X-ray burst score,
  - soft/hard flux ratio changes,
  - recent maximum z-score.

Then replace the baseline with trained models:

- Sequence model: TCN, LSTM, Transformer encoder, or Temporal Fusion Transformer.
- Inputs: fixed-length multichannel windows from SoLEXS and HEL1OS.
- Outputs: calibrated probabilities for 5, 15, 30, 60 minute horizons.
- Store model artifacts under `models/` with a versioned registry.

## Storage

Recommended production storage:

- Object storage for raw mission products.
- PostgreSQL for catalogues, alerts, product metadata, and model runs.
- TimescaleDB or Parquet partitions for normalized time-series features.
- Redis for recent live-window cache and alert deduplication.

The scaffold currently keeps data in memory and scans local archives so development can start immediately.

## Operational Notes

- Keep raw data immutable.
- Record every model version used for a prediction.
- Store quality flags and GTI filtering decisions with derived features.
- Calibrate probabilities before alerting.
- Separate scientific validation metrics from web-service uptime metrics.

