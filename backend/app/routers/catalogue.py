from fastapi import APIRouter, Depends

from app.dependencies import get_catalogue_service, get_preprocessing_service
from app.schemas import FlareEvent, PredictionRequest
from app.services.catalogue import CatalogueService
from app.services.preprocessing import PreprocessingService

router = APIRouter(prefix="/catalogue", tags=["catalogue"])


@router.get("/flares", response_model=list[FlareEvent])
def list_flares(service: CatalogueService = Depends(get_catalogue_service)) -> list[FlareEvent]:
    return service.list_events()


@router.post("/generate", response_model=list[FlareEvent])
def generate_catalogue(
    request: PredictionRequest,
    service: CatalogueService = Depends(get_catalogue_service),
    preprocessing: PreprocessingService = Depends(get_preprocessing_service),
) -> list[FlareEvent]:
    window = preprocessing.request_window(request.points)
    return service.generate(window.points)
