from __future__ import annotations

import re
from datetime import UTC, datetime, timedelta
from math import isfinite

DATE_PATTERN = re.compile(r"(20\d{6})")


def ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def parse_product_date(path: str) -> datetime | None:
    match = DATE_PATTERN.search(path)
    if not match:
        return None
    return datetime.strptime(match.group(1), "%Y%m%d").replace(tzinfo=UTC)


def seconds_to_timestamp(seconds: float, product_path: str) -> datetime | None:
    base = parse_product_date(product_path)
    if base is None or not isfinite(seconds):
        return None
    return base + timedelta(seconds=float(seconds))


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))
