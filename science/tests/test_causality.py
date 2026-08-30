from __future__ import annotations

import unittest

from science.betelgeuse.causality import DistancePosterior, propagate_causality


class CausalityTests(unittest.TestCase):
    def test_distance_cancels_from_arrival_time(self) -> None:
        for distance in (
            DistancePosterior(150, 0.001, 0.001),
            DistancePosterior(220, 0.001, 0.001),
        ):
            summary = propagate_causality(2026, 300, distance, samples=2_000, seed=7)
            self.assertAlmostEqual(summary.arrival_year.median, 2326.0, places=9)
            self.assertAlmostEqual(summary.arrival_year.lower, 2326.0, places=9)
            self.assertAlmostEqual(summary.arrival_year.upper, 2326.0, places=9)

    def test_default_emission_epoch_is_mid_fifteenth_century(self) -> None:
        summary = propagate_causality(2026, 300, samples=20_000, seed=172)
        self.assertGreater(summary.emission_year.median, 1450)
        self.assertLess(summary.emission_year.median, 1480)

    def test_negative_lifetime_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            propagate_causality(2026, -1)


if __name__ == "__main__":
    unittest.main()
