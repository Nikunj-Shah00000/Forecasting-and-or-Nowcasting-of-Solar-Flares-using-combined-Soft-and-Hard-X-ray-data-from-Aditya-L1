from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query

from app.config import Settings
from app.dependencies import get_ingestion_service, get_preprocessing_service, settings_dependency
from app.errors import DataUnavailableError
from app.schemas import ObservationWindow, Product, ProductSummary
from app.services.ingestion import ArchiveIngestionService
from app.services.preprocessing import PreprocessingService
from app.utils import ensure_utc

router = APIRouter(prefix="/observations", tags=["observations"])


@router.get("/products", response_model=list[Product])
def list_products(service: ArchiveIngestionService = Depends(get_ingestion_service)) -> list[Product]:
    return service.list_products()


@router.get("/products/summary", response_model=ProductSummary)
def product_summary(service: ArchiveIngestionService = Depends(get_ingestion_service)) -> ProductSummary:
    return service.summarize_products()


@router.get("/window", response_model=ObservationWindow)
def get_window(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    cadence_seconds: int = Query(default=60, ge=1),
    synthetic_fallback: bool | None = Query(default=None),
    service: PreprocessingService = Depends(get_preprocessing_service),
    ingestion: ArchiveIngestionService = Depends(get_ingestion_service),
    settings: Settings = Depends(settings_dependency),
) -> ObservationWindow:
    end_time = ensure_utc(end or datetime.now().astimezone())
    start_time = ensure_utc(start or end_time - timedelta(minutes=settings.default_window_minutes))
    window_minutes = (end_time - start_time).total_seconds() / 60
    if window_minutes > settings.max_window_minutes:
        raise DataUnavailableError(f"Requested window is too large. Maximum is {settings.max_window_minutes} minutes.")

    samples = ingestion.read_lightcurve_samples(
        start=start_time,
        end=end_time,
        max_products_per_instrument=settings.max_lightcurve_products_per_instrument,
    )
    if samples:
        return service.fuse_samples(samples, start_time, end_time, cadence_seconds)

    fallback_enabled = settings.synthetic_fallback_enabled if synthetic_fallback is None else synthetic_fallback
    if fallback_enabled:
        return service.build_placeholder_window(start_time, end_time, cadence_seconds)

    raise DataUnavailableError("No readable archive light-curve samples were available for the requested window.")
