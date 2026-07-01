from fastapi import APIRouter, Depends

from app.dependencies import get_prediction_service, get_preprocessing_service
from app.schemas import ForecastResponse, NowcastResponse, PredictionRequest
from app.services.modeling import PredictionService
from app.services.preprocessing import PreprocessingService

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("/nowcast", response_model=NowcastResponse)
def nowcast(
    request: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
    preprocessing: PreprocessingService = Depends(get_preprocessing_service),
) -> NowcastResponse:
    window = preprocessing.request_window(request.points)
    return service.nowcast(window.points)


@router.post("/forecast", response_model=ForecastResponse)
def forecast(
    request: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
    preprocessing: PreprocessingService = Depends(get_preprocessing_service),
) -> ForecastResponse:
    window = preprocessing.request_window(request.points)
    return service.forecast(window.points)
