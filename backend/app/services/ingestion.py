from __future__ import annotations

import gzip
import io
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any

from app.schemas import Instrument, Product, ProductSummary, RawLightcurveSample
from app.utils import ensure_utc, seconds_to_timestamp

try:
    from astropy.io import fits
except ModuleNotFoundError:  # pragma: no cover - exercised only without optional runtime deps.
    fits = None  # type: ignore[assignment]


class ArchiveIngestionService:
    """Discovers and reads science products inside nested mission-data ZIP archives."""

    def __init__(self, data_root: Path, solexs_archive: str, hel1os_archive: str) -> None:
        self.data_root = data_root
        self.solexs_archive = solexs_archive
        self.hel1os_archive = hel1os_archive
        self._product_cache: list[Product] | None = None

    def list_products(self) -> list[Product]:
        if self._product_cache is not None:
            return self._product_cache

        products: list[Product] = []
        products.extend(self._list_nested_zip_products(self.solexs_archive, "SoLEXS"))
        products.extend(self._list_nested_zip_products(self.hel1os_archive, "HEL1OS"))
        self._product_cache = products
        return products

    def summarize_products(self) -> ProductSummary:
        products = self.list_products()
        by_instrument = Counter(product.instrument for product in products)
        by_type = Counter(product.product_type for product in products)
        return ProductSummary(
            total=len(products),
            by_instrument=dict(by_instrument),
            by_type=dict(by_type),
            products=products,
        )

    def read_lightcurve_samples(
        self,
        start,
        end,
        max_products_per_instrument: int,
    ) -> list[RawLightcurveSample]:
        """Read light-curve samples from products whose names overlap the requested date range."""

        if fits is None:
            return []

        start = ensure_utc(start)
        end = ensure_utc(end)
        selected = self._select_lightcurve_products(start, end, max_products_per_instrument)
        samples: list[RawLightcurveSample] = []

        for product in selected:
            product_bytes = self._read_product_bytes(product)
            if product_bytes is None:
                continue
            samples.extend(self._decode_lightcurve(product, product_bytes, start, end))

        samples.sort(key=lambda sample: sample.timestamp)
        return samples

    def _list_nested_zip_products(self, archive_name: str, instrument: Instrument) -> list[Product]:
        archive_path = self.data_root / archive_name
        if not archive_path.exists():
            return []

        products: list[Product] = []
        with zipfile.ZipFile(archive_path) as outer_zip:
            for nested_name in outer_zip.namelist():
                if not nested_name.lower().endswith(".zip"):
                    continue
                nested_bytes = outer_zip.read(nested_name)
                with zipfile.ZipFile(io.BytesIO(nested_bytes)) as nested_zip:
                    for info in nested_zip.infolist():
                        if info.is_dir():
                            continue
                        products.append(
                            Product(
                                instrument=instrument,
                                outer_archive=archive_name,
                                nested_archive=nested_name,
                                product_path=info.filename,
                                product_type=self._classify_product(info.filename),
                                size_bytes=info.file_size,
                            )
                        )
        return products

    @staticmethod
    def _classify_product(path: str) -> str:
        lowered = path.lower()
        if ".lc" in lowered or "lightcurve" in lowered:
            return "lightcurve"
        if ".gti" in lowered or "gti" in lowered:
            return "good_time_interval"
        if ".pi" in lowered or "spectra" in lowered:
            return "spectrum"
        if "hk" in lowered:
            return "housekeeping"
        return "auxiliary"

    def _select_lightcurve_products(
        self,
        start,
        end,
        max_products_per_instrument: int,
    ) -> list[Product]:
        selected: list[Product] = []
        counts: Counter[str] = Counter()

        for product in self.list_products():
            if product.product_type != "lightcurve":
                continue
            if counts[product.instrument] >= max_products_per_instrument:
                continue
            if not self._product_may_overlap(product, start, end):
                continue
            selected.append(product)
            counts[product.instrument] += 1

        return selected

    @staticmethod
    def _product_may_overlap(product: Product, start, end) -> bool:
        # File names carry the observation date. Keep the filter intentionally loose because
        # some HEL1OS products span 12 hours and SoLEXS products are daily bundles.
        product_day = seconds_to_timestamp(0, f"{product.nested_archive}/{product.product_path}")
        if product_day is None:
            return True
        return start.date() <= product_day.date() <= end.date()

    def _read_product_bytes(self, product: Product) -> bytes | None:
        archive_path = self.data_root / product.outer_archive
        if not archive_path.exists():
            return None

        with zipfile.ZipFile(archive_path) as outer_zip:
            nested_bytes = outer_zip.read(product.nested_archive)
            with zipfile.ZipFile(io.BytesIO(nested_bytes)) as nested_zip:
                raw = nested_zip.read(product.product_path)

        if product.product_path.lower().endswith(".gz"):
            return gzip.decompress(raw)
        return raw

    def _decode_lightcurve(
        self,
        product: Product,
        payload: bytes,
        start,
        end,
    ) -> list[RawLightcurveSample]:
        if fits is None:
            return []

        samples: list[RawLightcurveSample] = []
        with fits.open(io.BytesIO(payload), memmap=False) as hdul:
            for hdu in hdul:
                if not hasattr(hdu, "data") or hdu.data is None:
                    continue
                rows = self._samples_from_hdu(product, hdu, start, end)
                if rows:
                    samples.extend(rows)
                    break
        return samples

    def _samples_from_hdu(self, product: Product, hdu: Any, start, end) -> list[RawLightcurveSample]:
        if not hasattr(hdu, "columns") or hdu.columns is None:
            return []
        names = {name.upper(): name for name in (hdu.columns.names or [])}
        time_col = names.get("TIME")
        flux_col = self._first_existing_column(names, ("RATE", "FLUX", "COUNTS", "COUNT_RATE", "VALUE"))
        if time_col is None or flux_col is None:
            return []

        data = hdu.data
        samples: list[RawLightcurveSample] = []
        for row in data:
            timestamp = seconds_to_timestamp(float(row[time_col]), product.product_path)
            if timestamp is None:
                continue
            timestamp = ensure_utc(timestamp)
            if timestamp < start or timestamp > end:
                continue
            flux = self._coerce_flux(row[flux_col])
            if flux is None:
                continue
            samples.append(
                RawLightcurveSample(
                    instrument=product.instrument,
                    timestamp=timestamp,
                    flux=flux,
                    source_product=product.product_path,
                )
            )
        return samples

    @staticmethod
    def _first_existing_column(names: dict[str, str], candidates: tuple[str, ...]) -> str | None:
        for candidate in candidates:
            if candidate in names:
                return names[candidate]
        return None

    @staticmethod
    def _coerce_flux(value: Any) -> float | None:
        try:
            if hasattr(value, "__len__") and not isinstance(value, (str, bytes)):
                value = value[0]
            flux = float(value)
        except (TypeError, ValueError):
            return None
        if flux != flux or flux in (float("inf"), float("-inf")):
            return None
        return max(flux, 0.0)
