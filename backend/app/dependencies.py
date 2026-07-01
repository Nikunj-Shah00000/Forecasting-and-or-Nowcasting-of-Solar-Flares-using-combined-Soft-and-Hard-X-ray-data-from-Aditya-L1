from functools import lru_cache

from app.config import Settings, get_settings
from app.services.alerts import AlertService
from app.services.catalogue import CatalogueService
from app.services.ingestion import ArchiveIngestionService
from app.services.modeling import PredictionService
from app.services.preprocessing import PreprocessingService


@lru_cache
def get_ingestion_service() -> ArchiveIngestionService:
    settings = get_settings()
    return ArchiveIngestionService(settings.data_root, settings.solexs_archive, settings.hel1os_archive)


@lru_cache
def get_preprocessing_service() -> PreprocessingService:
    return PreprocessingService()


@lru_cache
def get_prediction_service() -> PredictionService:
    settings = get_settings()
    return PredictionService(
        preprocessing=get_preprocessing_service(),
        horizons=settings.forecast_horizons_minutes,
        nowcast_threshold=settings.nowcast_threshold,
    )


@lru_cache
def get_catalogue_service() -> CatalogueService:
    return CatalogueService(get_prediction_service())


@lru_cache
def get_alert_service() -> AlertService:
    settings = get_settings()
    return AlertService(
        threshold=settings.alert_probability_threshold,
        dedupe_minutes=settings.alert_dedupe_minutes,
    )


def settings_dependency() -> Settings:
    return get_settings()
