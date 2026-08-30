import math
import unittest

from science.betelgeuse.prediction import (
    ballistic_ejecta_radius_pc,
    conditioned_signal_arrival_year,
    fixed_mode_radius_ratio,
    ideal_gas_sound_speed_km_s,
    shock_crossing_hours,
    shell_angular_diameter_arcmin,
    standardized_image_difference,
)


class PredictionPrimitiveTests(unittest.TestCase):
    def test_author_point_forecast_maps_to_arrival_year(self) -> None:
        self.assertEqual(conditioned_signal_arrival_year(2026, 200_000), 202_026)

    def test_fixed_mode_period_radius_scaling(self) -> None:
        expected = (2200 / 416) ** (2 / 3)
        self.assertAlmostEqual(fixed_mode_radius_ratio(2200 / 416), expected)

    def test_shock_crossing_scale(self) -> None:
        self.assertAlmostEqual(shock_crossing_hours(1000, 10_000), 19.325, places=3)

    def test_covariance_aware_standardized_difference(self) -> None:
        result = standardized_image_difference(1.0, 1.3, 0.1, 0.2)
        self.assertAlmostEqual(result, 0.3 / math.sqrt(0.05))

    def test_invalid_difference_variance_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            standardized_image_difference(1.0, 1.1, 0.1, 0.1, covariance=0.011)

    def test_ballistic_ejecta_scale(self) -> None:
        radius = ballistic_ejecta_radius_pc(100, 5_000)
        self.assertAlmostEqual(radius, 0.511356, places=5)
        self.assertAlmostEqual(
            shell_angular_diameter_arcmin(radius, 172), 20.440846, places=5
        )

    def test_invalid_ballistic_inputs_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            ballistic_ejecta_radius_pc(-1, 5_000)
        with self.assertRaises(ValueError):
            shell_angular_diameter_arcmin(0.5, 0)

    def test_red_supergiant_atmosphere_sound_speed(self) -> None:
        sound_speed = ideal_gas_sound_speed_km_s(2300)
        self.assertAlmostEqual(sound_speed, 4.93, places=2)

    def test_invalid_thermodynamic_inputs_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            ideal_gas_sound_speed_km_s(0)


if __name__ == "__main__":
    unittest.main()
