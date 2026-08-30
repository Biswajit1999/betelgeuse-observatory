# Scientific method and claim levels

## The question the project can answer

The observatory analyses information that has reached Earth: images, spectra, photometry, interferometric products, and their metadata. It can test whether new observations are unusual relative to received historical data and compare conditional evolutionary scenarios.

It cannot establish the simultaneous remote state of Betelgeuse outside Earth's past light cone.

## Evidence levels

1. **Measured:** calibrated observables and their timestamps, units, instrumental response, and uncertainties.
2. **Calculated:** deterministic or statistical transformations of measurements, such as brightness temperature, line centroid, periodogram power, angular-to-physical size, or anomaly score.
3. **Simulated:** synthetic states or observations generated from explicit physical and instrumental assumptions.
4. **Model-dependent:** evolutionary-stage or lifetime statements conditional on a stated stellar-model family.
5. **Speculative:** ideas not yet constrained enough for calibrated inference.

The web UI uses both text labels and line/marker styles, so colour is never the only indicator.

## Observation time is not publication time

The high-resolution ALMA study was submitted on 19 August 2026, but its five ALMA executions occurred in August 2023. The SPHERE companion data were observed on 6 December 2024 and released by ESO on 19 August 2026. Both dates must accompany a rendered product ([Dent et al. 2026](https://arxiv.org/abs/2608.19339), [ESO archive release](https://archive.eso.org/cms/eso-archive-news/release-of-sphere-data-betelgeuse.html)).

## Analysis order

1. Validate provenance and units.
2. Reproduce simple published quantities.
3. Build transparent statistical baselines.
4. Add neural models only where they answer a defined observable-domain question.
5. Evaluate with temporal, epoch, instrument, and simulation-family hold-outs.
6. Publish uncertainty, calibration, OOD behaviour, ablations, and a model card.
