"""Generate ALMA continuum sensitivity and uncertainty products."""

from __future__ import annotations

import csv
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import scienceplots  # noqa: F401
from betelgeuse.continuum import fit_power_law
from betelgeuse.continuum_validation import (
    brightness_temperature_trend,
    leave_one_out_slopes,
    monte_carlo_spectral_index,
)

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    data = np.genfromtxt(
        ROOT / "data/samples/alma_2023_continuum.csv",
        delimiter=",",
        names=True,
        dtype=None,
        encoding="utf-8",
    )
    frequency = data["frequency_ghz"]
    flux = data["integrated_flux_jy"]
    sigma = data["flux_uncertainty_jy"]
    temperature = data["brightness_temperature_k"]
    full = fit_power_law(frequency, flux, sigma)
    monte_carlo = monte_carlo_spectral_index(frequency, flux, sigma)
    leave_one_out = leave_one_out_slopes(frequency, flux, sigma)
    temperature_trend = brightness_temperature_trend(frequency, temperature)
    out = ROOT / "output/science/alma-continuum-validation"
    out.mkdir(parents=True, exist_ok=True)
    payload = {
        "data_kind": "published real ALMA 2023 integrated continuum measurements",
        "full_weighted_fit": {
            "spectral_index": full.spectral_index,
            "formal_sigma": full.spectral_index_sigma,
        },
        "monte_carlo": monte_carlo,
        "brightness_temperature_trend": temperature_trend,
        "limitations": (
            "Only three literature points are available. Quoted flux errors are treated as "
            "independent Gaussian uncertainties; shared calibration covariance is unavailable. "
            "Bands were not simultaneous and sample different apparent diameters. This is a "
            "sanity and leverage audit, not a spatially resolved spectral-index measurement."
        ),
    }
    (out / "summary.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    with (out / "leave_one_out.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(leave_one_out[0]))
        writer.writeheader()
        writer.writerows(leave_one_out)

    grid = np.geomspace(min(frequency) * 0.9, max(frequency) * 1.1, 200)
    model = (
        full.amplitude_jy_at_reference
        * (grid / full.reference_frequency_ghz) ** full.spectral_index
    )
    with plt.style.context(["science", "no-latex", "bright"]):
        fig, axes = plt.subplots(1, 2, figsize=(9.3, 3.9), constrained_layout=True)
        axes[0].errorbar(
            frequency, flux, yerr=sigma, fmt="o", capsize=3, label="Published integrated flux"
        )
        axes[0].plot(
            grid,
            model,
            label=(
                rf"Weighted fit: $\alpha={full.spectral_index:.2f}"
                rf"\pm{full.spectral_index_sigma:.2f}$"
            ),
        )
        axes[0].plot(
            grid,
            full.amplitude_jy_at_reference * (grid / full.reference_frequency_ghz) ** 2,
            "--",
            label=r"Reference $\alpha=2$",
        )
        axes[0].set(
            xscale="log",
            yscale="log",
            xlabel="Frequency [GHz]",
            ylabel="Integrated flux [Jy]",
            title="(a) Continuum fit",
        )
        axes[0].legend(frameon=False)
        axes[1].errorbar(
            [row["omitted_frequency_ghz"] for row in leave_one_out],
            [row["spectral_index"] for row in leave_one_out],
            yerr=[row["formal_sigma"] for row in leave_one_out],
            fmt="o",
            capsize=3,
            label="Two-band fits",
        )
        axes[1].axhline(full.spectral_index, color="0.25", label="Three-band fit")
        axes[1].axhspan(
            monte_carlo["p16"], monte_carlo["p84"], alpha=0.2, label="Monte Carlo 16--84%"
        )
        axes[1].set(
            xlabel="Omitted frequency [GHz]",
            ylabel="Spectral index",
            title="(b) Leverage and uncertainty",
        )
        axes[1].legend(frameon=False)
        fig.suptitle("Betelgeuse ALMA 2023 continuum validation")
        fig.savefig(out / "continuum_validation.png", dpi=240)
        fig.savefig(out / "continuum_validation.pdf")
        plt.close(fig)


if __name__ == "__main__":
    main()
