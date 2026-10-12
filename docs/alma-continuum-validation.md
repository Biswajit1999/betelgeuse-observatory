# ALMA 2023 continuum validation

This audit propagates the quoted uncertainties of the three published integrated continuum points, measures the leverage of each band with leave-one-out fits, and records the descriptive brightness-temperature trend.

The power-law model is $S_\nu=A(\nu/\nu_0)^\alpha$. Twenty thousand deterministic Monte Carlo draws treat the quoted flux errors as independent Gaussian uncertainties. Every two-band subset is also fitted; with only three measurements, this is a direct view of band leverage rather than a generic cross-validation score. The temperature trend is reported in kelvin per natural-log GHz with its three-point RMS residual.

These are real literature measurements, not new ALMA reductions. The points are non-simultaneous, sample different fitted angular diameters, and do not include shared absolute-calibration covariance. The results therefore cannot replace a matched-beam, spatially resolved spectral-index analysis.

Run `python science/run_continuum_validation.py` after installing the package and SciencePlots.
