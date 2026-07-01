from __future__ import annotations

from app.schemas import ForecastHorizon, ForecastResponse, NowcastResponse, ObservationPoint
from app.services.preprocessing import PreprocessingService
from app.utils import clamp


class PredictionService:
    """Baseline prediction interface that can later load trained model artifacts."""

    model_version = "hybrid-baseline-v1.0"

    def __init__(
        self,
        preprocessing: PreprocessingService,
        horizons: tuple[int, ...],
        nowcast_threshold: float,
    ) -> None:
        self.preprocessing = preprocessing
        self.horizons = horizons
        self.nowcast_threshold = nowcast_threshold

    def nowcast(self, points: list[ObservationPoint]) -> NowcastResponse:
        points = self.preprocessing.add_derived_features(points)
        features = self.preprocessing.summarize_features(points)
        score = self._risk_score(features)
        flare_detected = score >= self.nowcast_threshold
        flare_class = self._class_from_intensity(features["soft_flux_max"]) if flare_detected else None
        phase = self._phase(points) if flare_detected else None

        rationale = [
            f"soft_flux_max={features['soft_flux_max']:.3f}",
            f"hard_flux_max={features['hard_flux_max']:.3f}",
            f"soft_rise_rate_max={features['soft_rise_rate_max']:.3f}",
            f"hard_rise_rate_max={features['hard_rise_rate_max']:.3f}",
            f"soft_zscore_max={features['soft_zscore_max']:.3f}",
            f"hard_zscore_max={features['hard_zscore_max']:.3f}",
        ]

        return NowcastResponse(
            flare_detected=flare_detected,
            confidence=round(score, 3),
            flare_class=flare_class,
            phase=phase,
            model_version=self.model_version,
            rationale=rationale,
        )

    def forecast(self, points: list[ObservationPoint]) -> ForecastResponse:
        points = self.preprocessing.add_derived_features(points)
        features = self.preprocessing.summarize_features(points)
        base_score = self._risk_score(features)
        trend_bonus = clamp(features["soft_rise_rate_max"] * 10 + features["hard_rise_rate_max"] * 14, 0, 0.25)
        horizons = [
            ForecastHorizon(
                minutes=minutes,
                probability=round(clamp(base_score + trend_bonus - minutes * 0.003), 3),
            )
            for minutes in self.horizons
        ]
        return ForecastResponse(horizons=horizons, model_version=self.model_version, feature_summary=features)

    @staticmethod
    def _risk_score(features: dict[str, float]) -> float:
        score = (
            0.20 * clamp(features["soft_flux_max"] / max(features["soft_flux_mean"] * 1.8, 1.0))
            + 0.18 * clamp(features["hard_flux_max"] / max(features["hard_flux_mean"] * 1.8, 1.0))
            + 0.18 * clamp(features["soft_rise_rate_max"] / 0.02)
            + 0.18 * clamp(features["hard_rise_rate_max"] / 0.01)
            + 0.14 * clamp(features["soft_zscore_max"] / 6.0)
            + 0.12 * clamp(features["hard_zscore_max"] / 6.0)
        )
        return clamp(score)

    @staticmethod
    def _class_from_intensity(intensity: float) -> str:
        if intensity >= 8.0:
            return "X"
        if intensity >= 4.0:
            return "M"
        if intensity >= 2.0:
            return "C"
        return "B"

    @staticmethod
    def _phase(points: list[ObservationPoint]) -> str:
        recent_rates = [point.soft_rise_rate for point in points[-5:] if point.soft_rise_rate is not None]
        if not recent_rates:
            return "unknown"
        average_rate = sum(recent_rates) / len(recent_rates)
        if average_rate > 0.002:
            return "rising"
        if average_rate < -0.002:
            return "decay"
        return "peak"
