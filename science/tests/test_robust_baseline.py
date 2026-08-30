from __future__ import annotations

import unittest

from ml.baselines.robust import modified_z_scores


class RobustBaselineTests(unittest.TestCase):
    def test_outlier_has_largest_score(self) -> None:
        scores = modified_z_scores([1.0, 1.1, 0.9, 1.05, 5.0])
        self.assertEqual(max(range(len(scores)), key=lambda index: abs(scores[index])), 4)


if __name__ == "__main__":
    unittest.main()
