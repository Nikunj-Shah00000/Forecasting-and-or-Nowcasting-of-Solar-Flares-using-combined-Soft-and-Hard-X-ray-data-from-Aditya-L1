from __future__ import annotations

import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app


def main() -> None:
    client = TestClient(app)
    health = client.get("/health")
    health.raise_for_status()

    end = datetime.now(UTC)
    start = end - timedelta(minutes=20)
    window = client.get(
        "/api/v1/observations/window",
        params={
            "start": start.isoformat(),
            "end": end.isoformat(),
            "cadence_seconds": 60,
        },
    )
    window.raise_for_status()
    points = window.json()["points"]

    forecast = client.post("/api/v1/predictions/forecast", json={"points": points})
    forecast.raise_for_status()

    alerts = client.post("/api/v1/alerts/evaluate", json={"forecast": forecast.json()})
    alerts.raise_for_status()

    print("health:", health.json())
    print("points:", len(points))
    print("forecast:", forecast.json()["horizons"])
    print("created_alerts:", len(alerts.json()))


if __name__ == "__main__":
    main()
