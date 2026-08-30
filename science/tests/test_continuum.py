from __future__ import annotations

import unittest

from science.betelgeuse.continuum import fit_power_law


class ContinuumTests(unittest.TestCase):
    def test_alma_three_point_fit(self) -> None:
        fit = fit_power_law(
            [223.55, 337.99, 485.22],
            [0.28, 0.51, 0.90],
            [0.014, 0.04, 0.09],
        )
        self.assertAlmostEqual(fit.spectral_index, 1.49, places=2)
        self.assertAlmostEqual(fit.spectral_index_sigma, 0.13, places=2)

    def test_non_positive_measurement_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            fit_power_law([1, 2], [1, 0], [0.1, 0.1])


if __name__ == "__main__":
    unittest.main()
