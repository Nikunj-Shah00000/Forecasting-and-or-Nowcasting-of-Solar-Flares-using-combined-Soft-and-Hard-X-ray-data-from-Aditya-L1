from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

Instrument = Literal["SoLEXS", "HEL1OS"]
ProductType = Literal["lightcurve", "spectrum", "good_time_interval", "housekeeping", "auxiliary"]


class ApiMessage(BaseModel):
    message: str


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    environment: str


class Product(BaseModel):
    instrument: Instrument
    outer_archive: str
    nested_archive: str
    product_path: str
    product_type: ProductType
    size_bytes: int


class ProductSummary(BaseModel):
    total: int
    by_instrument: dict[str, int]
    by_type: dict[str, int]
    products: list[Product]


class RawLightcurveSample(BaseModel):
    instrument: Instrument
    timestamp: datetime
    flux: float
    source_product: str
    quality: str = "science"


class ObservationPoint(BaseModel):
    timestamp: datetime
    soft_flux: float | None = None
    hard_flux: float | None = None
    soft_rise_rate: float | None = None
    hard_rise_rate: float | None = None
    soft_background: float | None = None
    hard_background: float | None = None
    soft_zscore: float | None = None
    hard_zscore: float | None = None
    soft_hard_ratio: float | None = None
    quality: str = "science"


class ObservationWindow(BaseModel):
    start: datetime
    end: datetime
    cadence_seconds: int = 60
    source: Literal["archive", "synthetic", "request"]
    points: list[ObservationPoint]


class PredictionRequest(BaseModel):
    start: datetime | None = None
    end: datetime | None = None
    points: list[ObservationPoint] = Field(default_factory=list)


class NowcastResponse(BaseModel):
    flare_detected: bool
    confidence: float = Field(ge=0, le=1)
    flare_class: str | None = None
    phase: str | None = None
    model_version: str
    rationale: list[str]


class ForecastHorizon(BaseModel):
    minutes: int
    probability: float = Field(ge=0, le=1)


class ForecastResponse(BaseModel):
    horizons: list[ForecastHorizon]
    model_version: str
    feature_summary: dict[str, float]


class FlarePhase(StrEnum):
    rising = "rising"
    peak = "peak"
    decay = "decay"
    ended = "ended"


class FlareEvent(BaseModel):
    id: str
    start_time: datetime
    peak_time: datetime | None = None
    end_time: datetime | None = None
    flare_class: str
    intensity: float
    confidence: float = Field(ge=0, le=1)
    phase: FlarePhase


class AlertSeverity(StrEnum):
    watch = "watch"
    warning = "warning"
    critical = "critical"


class Alert(BaseModel):
    id: str
    created_at: datetime
    severity: AlertSeverity
    message: str
    probability: float = Field(ge=0, le=1)
    horizon_minutes: int
    dedupe_key: str


class AlertEvaluationRequest(BaseModel):
    forecast: ForecastResponse
