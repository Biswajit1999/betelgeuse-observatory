from __future__ import annotations

import unittest

from science.ingestion.aavso_history import Observation, bin_observations, relative_flux


class AavsoHistoryTests(unittest.TestCase):
    def test_magnitude_flux_ratio(self) -> None:
        self.assertAlmostEqual(relative_flux(0.5), 1.0)
        self.assertAlmostEqual(relative_flux(1.5), 10**-0.4)

    def test_passbands_are_binned_separately(self) -> None:
        observations = [
            Observation(2450000.0, 0.4, "Vis."),
            Observation(2450001.0, 0.8, "Vis."),
            Observation(2450002.0, 0.5, "V"),
        ]
        bins = bin_observations(
            observations, bin_days=10, start_jd=2450000, end_jd=2450010
        )
        self.assertEqual(len(bins), 2)
        self.assertEqual({row["band"] for row in bins}, {"Vis.", "V"})
        visual = next(row for row in bins if row["band"] == "Vis.")
        self.assertEqual(visual["n"], 2)
        self.assertAlmostEqual(float(visual["magnitude"]), 0.6)


if __name__ == "__main__":
    unittest.main()
