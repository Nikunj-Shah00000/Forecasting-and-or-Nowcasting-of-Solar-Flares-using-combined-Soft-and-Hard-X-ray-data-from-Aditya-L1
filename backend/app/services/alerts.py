from __future__ import annotations

from datetime import UTC, datetime, timedelta
from hashlib import sha1

from app.schemas import Alert, AlertSeverity, ForecastResponse


class AlertService:
    """Converts forecast probabilities into alert candidates."""

    def __init__(self, threshold: float, dedupe_minutes: int) -> None:
        self.threshold = threshold
        self.dedupe_window = timedelta(minutes=dedupe_minutes)
        self._alerts: list[Alert] = []

    def list_alerts(self) -> list[Alert]:
        return sorted(self._alerts, key=lambda alert: alert.created_at, reverse=True)

    def evaluate(self, forecast: ForecastResponse) -> list[Alert]:
        created: list[Alert] = []
        for horizon in forecast.horizons:
            if horizon.probability < self.threshold:
                continue

            severity = self._severity(horizon.probability)
            created_at = datetime.now(UTC)
            dedupe_key = f"{severity}:{horizon.minutes}"
            if self._has_recent_duplicate(dedupe_key, created_at):
                continue

            alert_id = sha1(f"{created_at.isoformat()}:{dedupe_key}:{horizon.probability}".encode()).hexdigest()[:12]
            alert = Alert(
                id=alert_id,
                created_at=created_at,
                severity=severity,
                message=f"Solar flare probability is {horizon.probability:.0%} in the next {horizon.minutes} minutes.",
                probability=horizon.probability,
                horizon_minutes=horizon.minutes,
                dedupe_key=dedupe_key,
            )
            self._alerts.append(alert)
            created.append(alert)
        return created

    @staticmethod
    def _severity(probability: float) -> AlertSeverity:
        if probability >= 0.9:
            return AlertSeverity.critical
        if probability >= 0.8:
            return AlertSeverity.warning
        return AlertSeverity.watch

    def _has_recent_duplicate(self, dedupe_key: str, now: datetime) -> bool:
        return any(
            alert.dedupe_key == dedupe_key and now - alert.created_at <= self.dedupe_window
            for alert in self._alerts
        )
