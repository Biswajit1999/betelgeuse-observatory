"""Light-travel geometry with explicit conditioning and uncertainty.

The observable waiting time cancels the distance when a lifetime estimate is
conditioned on the state whose photons are received now.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
import random
from typing import Iterable

LIGHT_YEARS_PER_PARSEC = 3.261563777


@dataclass(frozen=True)
class DistancePosterior:
    """Two-piece normal approximation to an asymmetric distance posterior."""

    mode_pc: float = 172.0
    sigma_minus_pc: float = 11.0
    sigma_plus_pc: float = 13.0

    def __post_init__(self) -> None:
        if self.mode_pc <= 0 or self.sigma_minus_pc <= 0 or self.sigma_plus_pc <= 0:
            raise ValueError("Distance and both uncertainties must be positive")

    def sample(self, size: int = 20_000, seed: int = 172) -> tuple[float, ...]:
        if size < 1:
            raise ValueError("size must be at least 1")
        generator = random.Random(seed)
        probability_left = self.sigma_minus_pc / (self.sigma_minus_pc + self.sigma_plus_pc)
        draws: list[float] = []
        for _ in range(size):
            left = generator.random() < probability_left
            scale = self.sigma_minus_pc if left else self.sigma_plus_pc
            offset = abs(generator.gauss(0.0, scale))
            draws.append(self.mode_pc - offset if left else self.mode_pc + offset)
        return tuple(value for value in draws if value > 0)


@dataclass(frozen=True)
class CredibleInterval:
    median: float
    lower: float
    upper: float


@dataclass(frozen=True)
class CausalitySummary:
    receive_year: float
    assumed_remaining_years: float
    distance_pc: CredibleInterval
    emission_year: CredibleInterval
    collapse_coordinate_year: CredibleInterval
    arrival_year: CredibleInterval


def _percentile(values: Iterable[float], probability: float) -> float:
    ordered = sorted(values)
    if not ordered:
        raise ValueError("Cannot calculate a percentile from an empty sample")
    position = (len(ordered) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    fraction = position - lower
    return ordered[lower] * (1 - fraction) + ordered[upper] * fraction


def _interval(values: Iterable[float]) -> CredibleInterval:
    cached = tuple(values)
    return CredibleInterval(
        median=_percentile(cached, 0.5),
        lower=_percentile(cached, 0.16),
        upper=_percentile(cached, 0.84),
    )


def propagate_causality(
    receive_year: float,
    assumed_remaining_years: float,
    distance: DistancePosterior | None = None,
    *,
    samples: int = 20_000,
    seed: int = 172,
) -> CausalitySummary:
    """Propagate distance uncertainty through emission and arrival epochs.

    `assumed_remaining_years` is a scenario conditioned on the observed emitted
    state. It is not a measured countdown or a claim about Betelgeuse's core.
    """

    if assumed_remaining_years < 0:
        raise ValueError("assumed_remaining_years cannot be negative")
    posterior = distance or DistancePosterior()
    distances = posterior.sample(samples, seed)
    emission = tuple(receive_year - value * LIGHT_YEARS_PER_PARSEC for value in distances)
    collapse = tuple(value + assumed_remaining_years for value in emission)
    arrival = tuple(
        collapse_year + distance_pc * LIGHT_YEARS_PER_PARSEC
        for collapse_year, distance_pc in zip(collapse, distances, strict=True)
    )
    return CausalitySummary(
        receive_year=receive_year,
        assumed_remaining_years=assumed_remaining_years,
        distance_pc=_interval(distances),
        emission_year=_interval(emission),
        collapse_coordinate_year=_interval(collapse),
        arrival_year=_interval(arrival),
    )
