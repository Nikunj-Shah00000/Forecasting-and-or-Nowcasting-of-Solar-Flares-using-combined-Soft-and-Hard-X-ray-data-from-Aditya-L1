from fastapi import APIRouter, Depends

from app.dependencies import get_alert_service
from app.schemas import Alert, AlertEvaluationRequest
from app.services.alerts import AlertService

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[Alert])
def list_alerts(service: AlertService = Depends(get_alert_service)) -> list[Alert]:
    return service.list_alerts()


@router.post("/evaluate", response_model=list[Alert])
def evaluate_alerts(
    request: AlertEvaluationRequest,
    service: AlertService = Depends(get_alert_service),
) -> list[Alert]:
    return service.evaluate(request.forecast)
