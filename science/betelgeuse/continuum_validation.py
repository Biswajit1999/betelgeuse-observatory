"""Uncertainty and sensitivity checks for the three published ALMA continuum points."""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np

from .continuum import fit_power_law


def monte_carlo_spectral_index(
    frequency_ghz: Sequence[float],
    flux_jy: Sequence[float],
    flux_sigma_jy: Sequence[float],
    *,
    draws: int = 20000,
    seed: int = 20261012,
) -> dict[str, float | int]:
    """Propagate independent quoted flux errors through the log-space fit."""
    frequency = np.asarray(frequency_ghz, dtype=float)
    flux = np.asarray(flux_jy, dtype=float)
    sigma = np.asarray(flux_sigma_jy, dtype=float)
    rng = np.random.default_rng(seed)
    samples = rng.normal(flux, sigma, size=(draws, len(flux)))
    samples = samples[np.all(samples > 0, axis=1)]
    alpha = np.array(
        [
            fit_power_law(frequency.tolist(), row.tolist(), sigma.tolist()).spectral_index
            for row in samples
        ]
    )
    return {
        "requested_draws": draws,
        "accepted_draws": len(alpha),
        "seed": seed,
        "median": float(np.median(alpha)),
        "p16": float(np.quantile(alpha, 0.16)),
        "p84": float(np.quantile(alpha, 0.84)),
        "probability_alpha_below_2": float(np.mean(alpha < 2)),
    }


def leave_one_out_slopes(
    frequency_ghz: Sequence[float],
    flux_jy: Sequence[float],
    flux_sigma_jy: Sequence[float],
) -> list[dict[str, float]]:
    """Fit every two-band subset to expose leverage in the three-point slope."""
    frequency = np.asarray(frequency_ghz, dtype=float)
    flux = np.asarray(flux_jy, dtype=float)
    sigma = np.asarray(flux_sigma_jy, dtype=float)
    rows = []
    for omitted in range(len(frequency)):
        keep = np.arange(len(frequency)) != omitted
        fit = fit_power_law(frequency[keep].tolist(), flux[keep].tolist(), sigma[keep].tolist())
        rows.append(
            {
                "omitted_frequency_ghz": float(frequency[omitted]),
                "spectral_index": fit.spectral_index,
                "formal_sigma": fit.spectral_index_sigma,
            }
        )
    return rows


def brightness_temperature_trend(
    frequency_ghz: Sequence[float], temperature_k: Sequence[float]
) -> dict[str, float]:
    """Fit a descriptive temperature trend against log frequency."""
    x = np.log(np.asarray(frequency_ghz, dtype=float))
    y = np.asarray(temperature_k, dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    predicted = intercept + slope * x
    return {
        "slope_k_per_ln_ghz": float(slope),
        "intercept_k": float(intercept),
        "rms_residual_k": float(np.sqrt(np.mean((y - predicted) ** 2))),
        "range_k": float(np.ptp(y)),
    }
