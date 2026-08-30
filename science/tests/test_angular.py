from __future__ import annotations

import unittest

from science.betelgeuse.angular import angular_diameter_to_au, angular_diameter_to_radius_solar


class AngularConversionTests(unittest.TestCase):
    def test_band_8_diameter(self) -> None:
        self.assertAlmostEqual(angular_diameter_to_au(54.30, 172), 9.3396, places=4)
        self.assertAlmostEqual(angular_diameter_to_radius_solar(54.30, 172), 1004.2, places=1)


if __name__ == "__main__":
    unittest.main()
