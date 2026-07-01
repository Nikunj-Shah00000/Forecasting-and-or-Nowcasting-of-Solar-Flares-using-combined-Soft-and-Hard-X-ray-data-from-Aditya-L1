from __future__ import annotations

from hashlib import sha1

from app.schemas import FlareEvent, FlarePhase, ObservationPoint
from app.services.modeling import PredictionService


class CatalogueService:
    """Creates flare catalogue entries from prediction output."""

    def __init__(self, prediction_service: PredictionService) -> None:
        self.prediction_service = prediction_service
        self._events: list[FlareEvent] = []

    def list_events(self) -> list[FlareEvent]:
        return self._events

    def generate(self, points: list[ObservationPoint]) -> list[FlareEvent]:
        if not points:
            return self._events

        nowcast = self.prediction_service.nowcast(points)
        if not nowcast.flare_detected:
            return self._events

        peak_point = max(points, key=lambda point: point.soft_flux or 0.0)
        event_id = sha1(
            f"{points[0].timestamp.isoformat()}:{peak_point.timestamp.isoformat()}:{nowcast.flare_class}".encode()
        ).hexdigest()[:12]
        phase = FlarePhase.rising
        if nowcast.phase:
            try:
                phase = FlarePhase(nowcast.phase)
            except ValueError:
                phase = FlarePhase.rising

        event = FlareEvent(
            id=event_id,
            start_time=points[0].timestamp,
            peak_time=peak_point.timestamp,
            end_time=None,
            flare_class=nowcast.flare_class or "unknown",
            intensity=max(peak_point.soft_flux or 0.0, peak_point.hard_flux or 0.0),
            confidence=nowcast.confidence,
            phase=phase,
        )

        if all(existing.id != event.id for existing in self._events):
            self._events.append(event)
        return self._events
