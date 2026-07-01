from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_end_to_end_prediction_flow() -> None:
    end = datetime.now(UTC)
    start = end - timedelta(minutes=15)

    window_response = client.get(
        "/api/v1/observations/window",
        params={"start": start.isoformat(), "end": end.isoformat(), "cadence_seconds": 60},
    )
    assert window_response.status_code == 200
    points = window_response.json()["points"]
    assert points

    forecast_response = client.post("/api/v1/predictions/forecast", json={"points": points})
    assert forecast_response.status_code == 200
    forecast = forecast_response.json()
    assert [item["minutes"] for item in forecast["horizons"]] == [5, 15, 30, 60]

    alert_response = client.post("/api/v1/alerts/evaluate", json={"forecast": forecast})
    assert alert_response.status_code == 200

