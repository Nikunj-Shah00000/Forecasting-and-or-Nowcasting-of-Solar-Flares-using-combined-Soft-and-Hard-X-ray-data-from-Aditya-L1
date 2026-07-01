from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "SuryaDrishti-AI"
    version: str = "1.0.0"
    environment: str = "local"
    api_prefix: str = "/api/v1"

    data_root: Path = Field(default_factory=lambda: Path(__file__).resolve().parents[2])
    solexs_archive: str = "solexs_2026Jul01T104914063.zip"
    hel1os_archive: str = "hel1os_2026Jul01T104510245.zip"

    default_window_minutes: int = 60
    max_window_minutes: int = 24 * 60
    default_cadence_seconds: int = 60
    max_lightcurve_products_per_instrument: int = 6
    synthetic_fallback_enabled: bool = True

    forecast_horizons_minutes: tuple[int, ...] = (5, 15, 30, 60)
    nowcast_threshold: float = 0.65
    alert_probability_threshold: float = 0.70
    alert_dedupe_minutes: int = 10

    cors_origins: tuple[str, ...] = ("*",)

    model_config = SettingsConfigDict(
        env_prefix="SURYA_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
