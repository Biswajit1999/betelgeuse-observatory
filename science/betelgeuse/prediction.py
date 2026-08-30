"""Auditable primitives used by the prediction and image-analysis workbench."""

from __future__ import annotations

import math

SOLAR_RADIUS_KM = 695_700.0
PARSEC_KM = 3.085677581e13
SECONDS_PER_JULIAN_YEAR = 31_557_600.0
BOLTZMANN_J_K = 1.380649e-23
HYDROGEN_MASS_KG = 1.6735575e-27


def conditioned_signal_arrival_year(receive_year: float, remaining_lifetime_years: float) -> float:
    """Map a lifetime conditioned on the received state to an Earth arrival year."""

    if remaining_lifetime_years < 0:
        raise ValueError("remaining_lifetime_years cannot be negative")
    return receive_year + remaining_lifetime_years


def fixed_mode_radius_ratio(period_ratio: float) -> float:
    """Return R2/R1 from P ∝ R^(3/2), holding mass and mode constant.

    This scaling must not be used across different radial orders without an
    explicit model for the mode constants.
    """

    if period_ratio <= 0:
        raise ValueError("period_ratio must be positive")
    return period_ratio ** (2.0 / 3.0)


def shock_crossing_hours(radius_solar: float, shock_velocity_km_s: float) -> float:
    """Compute the simple R/v internal propagation timescale in hours."""

    if radius_solar <= 0 or shock_velocity_km_s <= 0:
        raise ValueError("radius and velocity must be positive")
    return radius_solar * SOLAR_RADIUS_KM / shock_velocity_km_s / 3600.0


def ballistic_ejecta_radius_pc(elapsed_years: float, velocity_km_s: float) -> float:
    """Return the undecelerated ejecta radius R = v t in parsecs.

    This is a scale calculation, not a hydrodynamic remnant model.
    """

    if elapsed_years < 0:
        raise ValueError("elapsed_years cannot be negative")
    if velocity_km_s <= 0:
        raise ValueError("velocity_km_s must be positive")
    return elapsed_years * SECONDS_PER_JULIAN_YEAR * velocity_km_s / PARSEC_KM


def shell_angular_diameter_arcmin(radius_pc: float, distance_pc: float) -> float:
    """Return the small-angle diameter of a shell in arcminutes."""

    if radius_pc < 0:
        raise ValueError("radius_pc cannot be negative")
    if distance_pc <= 0:
        raise ValueError("distance_pc must be positive")
    return 2.0 * radius_pc / distance_pc * (180.0 / math.pi) * 60.0


def ideal_gas_sound_speed_km_s(
    temperature_k: float,
    *,
    mean_molecular_weight: float = 1.3,
    gamma: float = 5.0 / 3.0,
) -> float:
    """Return c_s = sqrt(gamma k_B T / (mu m_H)) in km/s."""

    if temperature_k <= 0:
        raise ValueError("temperature_k must be positive")
    if mean_molecular_weight <= 0 or gamma <= 0:
        raise ValueError("mean_molecular_weight and gamma must be positive")
    return math.sqrt(
        gamma
        * BOLTZMANN_J_K
        * temperature_k
        / (mean_molecular_weight * HYDROGEN_MASS_KG)
    ) / 1000.0


def standardized_image_difference(
    intensity_1: float,
    intensity_2: float,
    sigma_1: float,
    sigma_2: float,
    *,
    covariance: float = 0.0,
) -> float:
    """Return a covariance-aware standardized two-epoch intensity residual."""

    if sigma_1 < 0 or sigma_2 < 0:
        raise ValueError("uncertainties cannot be negative")
    variance = sigma_1 * sigma_1 + sigma_2 * sigma_2 - 2.0 * covariance
    if variance <= 0:
        raise ValueError("difference variance must be positive")
    return (intensity_2 - intensity_1) / math.sqrt(variance)
