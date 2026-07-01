from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean, pstdev

from app.schemas import ObservationPoint, ObservationWindow, RawLightcurveSample
from app.utils import ensure_utc


class PreprocessingService:
    """Builds fused features from aligned soft and hard X-ray observations."""

    def fuse_samples(
        self,
        samples: list[RawLightcurveSample],
        start: datetime,
        end: datetime,
        cadence_seconds: int,
    ) -> ObservationWindow:
        start = ensure_utc(start)
        end = ensure_utc(end)
        soft_buckets: dict[datetime, list[float]] = defaultdict(list)
        hard_buckets: dict[datetime, list[float]] = defaultdict(list)

        for sample in samples:
            bucket = self._bucket_timestamp(sample.timestamp, cadence_seconds)
            if sample.instrument == "SoLEXS":
                soft_buckets[bucket].append(sample.flux)
            else:
                hard_buckets[bucket].append(sample.flux)

        points: list[ObservationPoint] = []
        current = self._bucket_timestamp(start, cadence_seconds)
        while current <= end:
            soft_flux = mean(soft_buckets[current]) if soft_buckets[current] else None
            hard_flux = mean(hard_buckets[current]) if hard_buckets[current] else None
            points.append(ObservationPoint(timestamp=current, soft_flux=soft_flux, hard_flux=hard_flux))
            current += timedelta(seconds=cadence_seconds)

        points = self.add_derived_features(points)
        return ObservationWindow(start=start, end=end, cadence_seconds=cadence_seconds, source="archive", points=points)

    def build_placeholder_window(
        self,
        start: datetime,
        end: datetime,
        cadence_seconds: int = 60,
    ) -> ObservationWindow:
        points: list[ObservationPoint] = []
        current = ensure_utc(start)
        end_utc = ensure_utc(end)
        idx = 0

        while current <= end_utc:
            flare_boost = max(0, 16 - abs((idx % 48) - 24)) / 16
            soft_flux = 1.0 + (idx % 20) * 0.02 + flare_boost * 1.8
            hard_flux = 0.35 + (idx % 11) * 0.018 + flare_boost * 0.8
            points.append(
                ObservationPoint(
                    timestamp=current,
                    soft_flux=soft_flux,
                    hard_flux=hard_flux,
                    quality="synthetic_baseline",
                )
            )
            current += timedelta(seconds=cadence_seconds)
            idx += 1

        points = self.add_derived_features(points)
        return ObservationWindow(
            start=start,
            end=end,
            cadence_seconds=cadence_seconds,
            source="synthetic",
            points=points,
        )

    def request_window(self, points: list[ObservationPoint]) -> ObservationWindow:
        if not points:
            now = ensure_utc(datetime.now())
            return ObservationWindow(start=now, end=now, cadence_seconds=60, source="request", points=[])
        ordered = sorted(points, key=lambda point: point.timestamp)
        enriched = self.add_derived_features(ordered)
        return ObservationWindow(
            start=enriched[0].timestamp,
            end=enriched[-1].timestamp,
            cadence_seconds=self._infer_cadence(enriched),
            source="request",
            points=enriched,
        )

    def add_derived_features(self, points: list[ObservationPoint]) -> list[ObservationPoint]:
        if not points:
            return []

        enriched: list[ObservationPoint] = []
        soft_history: list[float] = []
        hard_history: list[float] = []
        previous: ObservationPoint | None = None

        for point in sorted(points, key=lambda item: item.timestamp):
            soft_background = self._rolling_mean(soft_history)
            hard_background = self._rolling_mean(hard_history)
            soft_zscore = self._zscore(point.soft_flux, soft_history)
            hard_zscore = self._zscore(point.hard_flux, hard_history)
            soft_rise_rate = self._rise_rate(previous, point, "soft_flux")
            hard_rise_rate = self._rise_rate(previous, point, "hard_flux")
            ratio = None
            if point.soft_flux is not None and point.hard_flux not in (None, 0):
                ratio = point.soft_flux / point.hard_flux

            enriched_point = point.model_copy(
                update={
                    "timestamp": ensure_utc(point.timestamp),
                    "soft_background": soft_background,
                    "hard_background": hard_background,
                    "soft_zscore": soft_zscore,
                    "hard_zscore": hard_zscore,
                    "soft_rise_rate": soft_rise_rate,
                    "hard_rise_rate": hard_rise_rate,
                    "soft_hard_ratio": ratio,
                }
            )
            enriched.append(enriched_point)

            if point.soft_flux is not None:
                soft_history.append(point.soft_flux)
            if point.hard_flux is not None:
                hard_history.append(point.hard_flux)
            soft_history = soft_history[-30:]
            hard_history = hard_history[-30:]
            previous = enriched_point

        return enriched

    def summarize_features(self, points: list[ObservationPoint]) -> dict[str, float]:
        soft_values = [point.soft_flux for point in points if point.soft_flux is not None]
        hard_values = [point.hard_flux for point in points if point.hard_flux is not None]
        soft_rates = [point.soft_rise_rate for point in points if point.soft_rise_rate is not None]
        hard_rates = [point.hard_rise_rate for point in points if point.hard_rise_rate is not None]
        soft_zscores = [point.soft_zscore for point in points if point.soft_zscore is not None]
        hard_zscores = [point.hard_zscore for point in points if point.hard_zscore is not None]
        ratios = [point.soft_hard_ratio for point in points if point.soft_hard_ratio is not None]

        return {
            "points": float(len(points)),
            "soft_flux_mean": mean(soft_values) if soft_values else 0.0,
            "soft_flux_max": max(soft_values) if soft_values else 0.0,
            "hard_flux_mean": mean(hard_values) if hard_values else 0.0,
            "hard_flux_max": max(hard_values) if hard_values else 0.0,
            "soft_rise_rate_max": max(soft_rates) if soft_rates else 0.0,
            "hard_rise_rate_max": max(hard_rates) if hard_rates else 0.0,
            "soft_zscore_max": max(soft_zscores) if soft_zscores else 0.0,
            "hard_zscore_max": max(hard_zscores) if hard_zscores else 0.0,
            "soft_hard_ratio_mean": mean(ratios) if ratios else 0.0,
        }

    @staticmethod
    def _bucket_timestamp(timestamp: datetime, cadence_seconds: int) -> datetime:
        timestamp = ensure_utc(timestamp)
        epoch_seconds = int(timestamp.timestamp())
        bucket_seconds = epoch_seconds - (epoch_seconds % cadence_seconds)
        return datetime.fromtimestamp(bucket_seconds, tz=timestamp.tzinfo)

    @staticmethod
    def _rolling_mean(values: list[float]) -> float | None:
        return mean(values) if values else None

    @staticmethod
    def _zscore(value: float | None, history: list[float]) -> float | None:
        if value is None or len(history) < 5:
            return None
        deviation = pstdev(history)
        if deviation == 0:
            return 0.0
        return (value - mean(history)) / deviation

    @staticmethod
    def _rise_rate(previous: ObservationPoint | None, current: ObservationPoint, field: str) -> float | None:
        if previous is None:
            return 0.0
        previous_value = getattr(previous, field)
        current_value = getattr(current, field)
        if previous_value is None or current_value is None:
            return None
        elapsed = (ensure_utc(current.timestamp) - ensure_utc(previous.timestamp)).total_seconds()
        if elapsed <= 0:
            return 0.0
        return (current_value - previous_value) / elapsed

    @staticmethod
    def _infer_cadence(points: list[ObservationPoint]) -> int:
        if len(points) < 2:
            return 60
        deltas = [
            int((ensure_utc(points[idx].timestamp) - ensure_utc(points[idx - 1].timestamp)).total_seconds())
            for idx in range(1, len(points))
        ]
        positive = [delta for delta in deltas if delta > 0]
        return min(positive) if positive else 60
