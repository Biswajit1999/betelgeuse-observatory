"""Angular-to-physical conversions with explicit units."""

from __future__ import annotations

AU_IN_SOLAR_RADII = 215.0321557


def angular_diameter_to_au(angular_diameter_mas: float, distance_pc: float) -> float:
    if angular_diameter_mas <= 0 or distance_pc <= 0:
        raise ValueError("Angular diameter and distance must be positive")
    return angular_diameter_mas * distance_pc / 1000.0


def angular_diameter_to_radius_solar(angular_diameter_mas: float, distance_pc: float) -> float:
    return angular_diameter_to_au(angular_diameter_mas, distance_pc) * AU_IN_SOLAR_RADII / 2.0
