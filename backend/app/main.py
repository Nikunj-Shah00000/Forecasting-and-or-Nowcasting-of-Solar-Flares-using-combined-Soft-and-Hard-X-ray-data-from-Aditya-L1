from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.errors import install_error_handlers
from app.routers import alerts, catalogue, health, observations, predictions


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.version,
        description="Backend API for Aditya-L1 SoLEXS and HEL1OS solar flare nowcasting and forecasting.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    install_error_handlers(app)
    app.include_router(health.router)
    app.include_router(observations.router, prefix=settings.api_prefix)
    app.include_router(predictions.router, prefix=settings.api_prefix)
    app.include_router(catalogue.router, prefix=settings.api_prefix)
    app.include_router(alerts.router, prefix=settings.api_prefix)
    return app


app = create_app()
