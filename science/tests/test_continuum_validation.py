import pytest
from betelgeuse.continuum_validation import (
    brightness_temperature_trend,
    leave_one_out_slopes,
    monte_carlo_spectral_index,
)


def test_monte_carlo_is_reproducible_and_recovers_power_law():
    result = monte_carlo_spectral_index([1, 2, 4], [1, 4, 16], [0.01] * 3, draws=200, seed=4)
    assert result["median"] == pytest.approx(2, abs=0.01)
    assert result == monte_carlo_spectral_index(
        [1, 2, 4], [1, 4, 16], [0.01] * 3, draws=200, seed=4
    )


def test_leave_one_out_and_temperature_trend():
    rows = leave_one_out_slopes([1, 2, 4], [1, 4, 16], [0.1, 0.1, 0.1])
    assert len(rows) == 3
    assert all(row["spectral_index"] == pytest.approx(2) for row in rows)
    trend = brightness_temperature_trend([1, 2, 4], [100, 100, 100])
    assert trend["slope_k_per_ln_ghz"] == pytest.approx(0, abs=1e-12)
