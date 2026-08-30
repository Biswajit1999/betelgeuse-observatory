"""Small, auditable continuum sanity checks."""

from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class PowerLawFit:
    amplitude_jy_at_reference: float
    reference_frequency_ghz: float
    spectral_index: float
    spectral_index_sigma: float


def fit_power_law(
    frequency_ghz: Sequence[float],
    flux_jy: Sequence[float],
    flux_sigma_jy: Sequence[float],
    *,
    reference_frequency_ghz: float = 337.99,
) -> PowerLawFit:
    """Fit S_nu = A (nu / nu_ref)^alpha using weighted log-space regression."""

    if not (len(frequency_ghz) == len(flux_jy) == len(flux_sigma_jy)) or len(flux_jy) < 2:
        raise ValueError("Inputs must have the same length and contain at least two points")
    if reference_frequency_ghz <= 0:
        raise ValueError("reference_frequency_ghz must be positive")
    rows = []
    for frequency, flux, sigma in zip(frequency_ghz, flux_jy, flux_sigma_jy, strict=True):
        if frequency <= 0 or flux <= 0 or sigma <= 0:
            raise ValueError("Frequencies, fluxes, and uncertainties must be positive")
        x = math.log(frequency / reference_frequency_ghz)
        y = math.log(flux)
        sigma_y = sigma / flux
        rows.append((x, y, 1.0 / (sigma_y * sigma_y)))

    sum_w = sum(weight for _, _, weight in rows)
    mean_x = sum(weight * x for x, _, weight in rows) / sum_w
    mean_y = sum(weight * y for _, y, weight in rows) / sum_w
    denominator = sum(weight * (x - mean_x) ** 2 for x, _, weight in rows)
    if denominator == 0:
        raise ValueError("At least two distinct frequencies are required")
    alpha = sum(weight * (x - mean_x) * (y - mean_y) for x, y, weight in rows) / denominator
    intercept = mean_y - alpha * mean_x
    return PowerLawFit(
        amplitude_jy_at_reference=math.exp(intercept),
        reference_frequency_ghz=reference_frequency_ghz,
        spectral_index=alpha,
        spectral_index_sigma=math.sqrt(1.0 / denominator),
    )
