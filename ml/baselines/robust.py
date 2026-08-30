"""Transparent robust anomaly baseline used before neural models."""

from __future__ import annotations

from statistics import median
from typing import Sequence


def modified_z_scores(values: Sequence[float]) -> tuple[float, ...]:
    if len(values) < 3:
        raise ValueError("At least three values are required")
    centre = median(values)
    mad = median(abs(value - centre) for value in values)
    if mad == 0:
        return tuple(0.0 for _ in values)
    return tuple(0.67448975 * (value - centre) / mad for value in values)
