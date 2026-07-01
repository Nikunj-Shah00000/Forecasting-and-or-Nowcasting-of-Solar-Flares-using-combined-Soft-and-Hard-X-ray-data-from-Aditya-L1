# SuryaDrishti-AI Backend

Production-shaped FastAPI backend for Aditya-L1 SoLEXS and HEL1OS solar flare nowcasting and forecasting.

The service can run in two modes:

- Core mode: API, archive discovery, synthetic fallback windows, predictions, catalogue, alerts, tests.
- Science mode: core mode plus Astropy-backed FITS light-curve decoding from the mission archives.

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Optional FITS support:

```powershell
pip install -r requirements-science.txt
```

On very long OneDrive paths, Astropy may hit Windows path-length limits during installation. If that happens, run the same project from a shorter folder or install the venv outside OneDrive and set `PYTHONPATH` to this `backend` directory.

## Run

```powershell
$env:PYTHONPATH='.'
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000/docs
```

## Test

```powershell
pytest
ruff check app tests scripts
python scripts\smoke_test.py
```

## Docker

From the repository root:

```powershell
docker compose up --build
```

Docker installs the science requirements and mounts the repository at `/data`, so the container can read the local SoLEXS and HEL1OS archives.

## Capabilities

- Discovers nested SoLEXS and HEL1OS ZIP products without extracting the full archives.
- Reads light-curve FITS products when `astropy` is installed.
- Fuses soft and hard X-ray observations into a common cadence.
- Computes rise rates, rolling backgrounds, z-scores, and soft/hard ratios.
- Serves nowcast and forecast predictions for 5, 15, 30, and 60 minute horizons.
- Generates in-memory flare catalogue entries.
- Evaluates alerts with severity levels and short-window deduplication.
- Falls back to deterministic synthetic windows when real science decoding is unavailable.

## Main Endpoints

```text
GET  /health
GET  /api/v1/observations/products
GET  /api/v1/observations/products/summary
GET  /api/v1/observations/window
POST /api/v1/predictions/nowcast
POST /api/v1/predictions/forecast
GET  /api/v1/catalogue/flares
POST /api/v1/catalogue/generate
GET  /api/v1/alerts
POST /api/v1/alerts/evaluate
```

## Configuration

Copy `.env.example` to `.env` and adjust values as needed. Important variables:

```text
SURYA_DATA_ROOT
SURYA_SOLEXS_ARCHIVE
SURYA_HEL1OS_ARCHIVE
SURYA_SYNTHETIC_FALLBACK_ENABLED
SURYA_NOWCAST_THRESHOLD
SURYA_ALERT_PROBABILITY_THRESHOLD
```
