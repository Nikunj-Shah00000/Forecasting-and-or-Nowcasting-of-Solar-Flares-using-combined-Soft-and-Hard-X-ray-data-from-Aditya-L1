from datetime import UTC, datetime, timedelta

from app.schemas import RawLightcurveSample
from app.services.preprocessing import PreprocessingService


def test_fuse_samples_aligns_soft_and_hard_streams() -> None:
    service = PreprocessingService()
    start = datetime(2026, 6, 29, tzinfo=UTC)
    samples = [
        RawLightcurveSample(instrument="SoLEXS", timestamp=start, flux=1.0, source_product="slx.lc"),
        RawLightcurveSample(
            instrument="SoLEXS",
            timestamp=start + timedelta(seconds=20),
            flux=3.0,
            source_product="slx.lc",
        ),
        RawLightcurveSample(instrument="HEL1OS", timestamp=start, flux=2.0, source_product="hls.fits"),
    ]

    window = service.fuse_samples(samples, start, start + timedelta(minutes=1), cadence_seconds=60)

    assert window.source == "archive"
    assert window.points[0].soft_flux == 2.0
    assert window.points[0].hard_flux == 2.0


def test_request_window_enriches_rise_rates() -> None:
    service = PreprocessingService()
    start = datetime(2026, 6, 29, tzinfo=UTC)
    window = service.build_placeholder_window(start, start + timedelta(minutes=10), cadence_seconds=60)

    assert window.points[-1].soft_rise_rate is not None
    assert window.points[-1].soft_hard_ratio is not None

