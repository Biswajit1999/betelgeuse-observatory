# Prediction analysis and signed scientific forecast

## Author

Biswajit Jana, research author and project lead. Assessment date: 30 August 2026.

## What “prediction” means here

The target is the date on which a causal messenger from a future core-collapse event would reach Earth, not an unknowable statement about Betelgeuse at a simultaneous remote coordinate time. For a remaining lifetime `Delta_t` conditioned on the state received in 2026,

```text
t_emit    = 2026 - D/c
t_collapse = t_emit + Delta_t
t_see      = t_collapse + D/c
           = 2026 + Delta_t
```

Distance changes the coordinate epoch assigned to emission and collapse. It cancels from the Earth waiting time under this conditioning.

## Preferred model branch

My working interpretation favours:

- the approximately 400/416-day signal as the radial fundamental mode;
- the approximately 2170-day signal as a Long Secondary Period with a companion-related origin;
- a core-helium-burning evolutionary state.

Joyce et al. place Betelgeuse in early core helium burning. Goldberg, Joyce, and Molnár argue that the approximately 2170-day variation is better treated as a companion-linked LSP and summarize the resulting explosion horizon as hundreds of thousands of years. The later companion evidence strengthens the availability of a non-pulsational explanation for the LSP.

I choose `Delta_t = 200,000 yr` as a transparent representative point within that broad horizon:

```text
t_see = 2026 + 200,000 = approximately 202,026 CE
```

This is my conditional point forecast. It is not a posterior mean or median and has no frequentist coverage interpretation. Its purpose is to state the scale of my preferred interpretation without hiding behind the word “sometime.”

## Contested short-horizon branch

Saio et al. identify the approximately 2200-day period as the radial fundamental mode and obtain late core-carbon-burning models. Their model D exhausts central carbon in about 260 years. Goldberg, Joyce, and Molnár summarize the associated explosion horizon as several dozen to several hundred years. An illustrative `Delta_t = 30-300 yr` maps to approximately 2056-2326 CE at Earth.

That interval is not a confidence interval. It is a coordinate mapping of a literature model-family timescale. Molnár, Joyce, and Leung show that the large radius required by the 2200-day fundamental-mode interpretation conflicts with angular-diameter constraints. The companion interpretation also removes the necessity of assigning the long period to radial pulsation.

## Why spectra and images cannot directly date core collapse

Continuum spectra constrain atmospheric temperature, opacity, emitting radius, and spectral slope. Line spectra constrain velocity fields, excitation, abundance-sensitive ratios, mass loss, and shocks. Resolved images constrain size, asymmetry, hotspots, and time-variable morphology. These are valuable boundary conditions on stellar models, but none is a direct observation of the core.

A calibrated prediction analysis should use

```text
ln L(theta, s) = -1/2 sum_i [
  (y_i - m_i(theta))^2 / (sigma_i^2 + s^2)
  + ln(2 pi (sigma_i^2 + s^2))
]
```

where `s` is model discrepancy or excess scatter. Forecast calibration must be tested on entire held-out epochs and instruments. Random pixel splits are invalid because adjacent pixels and channels are correlated.

## Falsifiers and updates

The preferred horizon should be revised if calibrated evidence establishes that the approximately 2200-day signal is a radial fundamental mode, if independent radius measurements support the required large radius, or if direct core-sensitive messengers indicate advanced burning. Conversely, stronger orbital confirmation of the companion and continued agreement of the approximately 400-day mode with the fundamental-mode interpretation support the long-horizon branch.

## Primary sources

- [Joyce et al. 2020](https://arxiv.org/abs/2006.09837)
- [Saio et al. 2023](https://arxiv.org/abs/2306.00287)
- [Molnár, Joyce & Leung 2023](https://arxiv.org/abs/2306.05600)
- [Goldberg, Joyce & Molnár 2024](https://arxiv.org/abs/2408.09089)
- [MacLeod et al. 2024](https://arxiv.org/abs/2409.11332)
