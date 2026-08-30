"""Transparent science primitives for the Betelgeuse Observatory."""

from .causality import CausalitySummary, DistancePosterior, propagate_causality
from .continuum import PowerLawFit, fit_power_law
from .prediction import (
    ballistic_ejecta_radius_pc,
    conditioned_signal_arrival_year,
    fixed_mode_radius_ratio,
    ideal_gas_sound_speed_km_s,
    shell_angular_diameter_arcmin,
    shock_crossing_hours,
    standardized_image_difference,
)

__all__ = [
    "CausalitySummary",
    "DistancePosterior",
    "PowerLawFit",
    "ballistic_ejecta_radius_pc",
    "conditioned_signal_arrival_year",
    "fit_power_law",
    "fixed_mode_radius_ratio",
    "ideal_gas_sound_speed_km_s",
    "propagate_causality",
    "shock_crossing_hours",
    "shell_angular_diameter_arcmin",
    "standardized_image_difference",
]
