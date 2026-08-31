# Betelgeuse Observatory

[![Web checks](https://github.com/Biswajit1999/betelgeuse-observatory/actions/workflows/web.yml/badge.svg)](https://github.com/Biswajit1999/betelgeuse-observatory/actions/workflows/web.yml)
[![GitHub Pages](https://github.com/Biswajit1999/betelgeuse-observatory/actions/workflows/pages.yml/badge.svg)](https://github.com/Biswajit1999/betelgeuse-observatory/actions/workflows/pages.yml)

**Live observatory:** <https://biswajit1999.github.io/betelgeuse-observatory/>

> This project cannot determine whether Betelgeuse has already undergone an event outside Earth's past light cone. It analyses the latest state observable from Earth and evaluates physical models for its subsequent evolution.

**Research author and project lead:** Biswajit Jana

**Scientific verdict (30 August 2026):** no received observation shows core collapse. August 2023 ALMA data resolve a roughly 2300 K, asymmetric sub-millimetre atmosphere with persistent hot structure and evolving molecular gas. A separate 2026 analysis combines VLA/ALMA observations made during 2021-2026 and reports atmospheric perturbations compatible with a close companion. These are observations of a dynamic red supergiant, not an observed supernova ([Dent et al. 2026](https://arxiv.org/abs/2608.19339), [Matthews et al. 2026](https://arxiv.org/abs/2608.02847)).

![ALMA Band 8 continuum map of Betelgeuse observed on 1 August 2023](public/observations/alma-band8-2023.png)

_ALMA Band 8 editorial preview from Dent et al. (2026), observed 1 August 2023 under programme 2022.A.00026.S. CC BY 4.0. Scientific analysis must use calibrated archive products rather than this rendered figure._

## Full research report

The complete first-person scientific and engineering write-up is available as [LaTeX source](paper/betelgeuse-observatory-report.tex) and a [compiled PDF](output/pdf/betelgeuse-observatory-report.pdf). It documents the research rationale, equations, data boundaries, contour reconstruction, prediction assumptions, reduced hydrodynamic solver, implementation chronology, tests, limitations, and reproduction commands.

## What is implemented

- An interactive web causality laboratory showing why `t_arrival = t_receive + Delta_t`.
- A two-piece-normal Monte Carlo distance posterior: 172 pc with +13 / -11 pc uncertainty.
- A typed Python science package with tested light-time, angular-size, and continuum calculations.
- Reproduction of the simple three-point ALMA integrated-flux fit, `alpha = 1.49 +/- 0.13`.
- Interactive Band 8 contour, axisymmetric-residual, and matched-beam radial-profile reconstructions following the published figure conventions while clearly separating fitted reconstructions from observed pixels.
- An interactive in-band continuum forecast with standardized residuals and explicit incomplete-uncertainty warning.
- A local blink comparator for up to 5,000 registered image frames; rendered images remain in the browser and are not treated as calibrated FITS measurements.
- A GPU-accelerated 3D timeline from 2026–2526 CE driven by a reduced gas-flow solver for temperature, density, horizontal/radial velocity, buoyancy, pressure response, viscosity, thermal diffusion, compressional heating, and radiative relaxation.
- A provenance manifest for ALMA 2015/2023, ESO SPHERE 2024, AAVSO, and MAST/HST.
- An evidence language that visibly separates measured, calculated, simulated, model-dependent, and speculative material.
- A baseline-first statistical-inference structure that forbids an unsupported `exploded/not exploded` classification.

The version 1.0 repository is complete within its stated evidence boundary. Archive-dependent re-reductions are tracked separately and are never represented as completed before calibrated products and provenance records exist.

## Causality in one equation

For a state observed at Earth at `t_receive` and emitted from distance `D`:

```text
t_emit     = t_receive - D/c
t_collapse = t_emit + Delta_t
t_arrival  = t_collapse + D/c
           = t_receive + Delta_t
```

Distance changes which historical epoch is observed. It does not shorten the observable waiting time of a lifetime prediction conditioned on that state. See [the full derivation](docs/causality-and-light-time.md).

## Biswajit Jana's conditional forecast

My working interpretation favours the approximately 400/416-day fundamental radial mode and a companion-related approximately 2170-day Long Secondary Period. Under that model family, the literature horizon is **hundreds of thousands of years**, rather than several dozen to several hundred years ([Goldberg, Joyce & Molnár 2024](https://arxiv.org/abs/2408.09089)).

For one explicit representative point, I choose `Delta_t = 200,000 years`:

```text
t_see = t_receive + Delta_t
      = 2026 + 200,000
      = approximately 202,026 CE
```

This is an author-selected point inside a broad preferred model family—not a fitted expectation, confidence interval, or exact countdown. The contested late-carbon-burning interpretation instead maps a several-dozen-to-several-hundred-year horizon to roughly 2056-2326 CE; its mode assignment and required radius remain disputed ([Saio et al. 2023](https://arxiv.org/abs/2306.00287), [Molnár, Joyce & Leung 2023](https://arxiv.org/abs/2306.05600)). Read the complete argument in [prediction analysis](docs/prediction-analysis.md).

## Data sources

| Dataset             | Observation epoch | Publication/release            | Use                                      |
| ------------------- | ----------------- | ------------------------------ | ---------------------------------------- |
| ALMA 2022.A.00026.S | August 2023       | 19 August 2026 preprint        | Bands 6/7/8 continuum and line structure |
| ALMA 2015.1.00206.S | 9 November 2015   | 2017 paper                     | Beam-aware temporal comparison           |
| ESO 114.28H9        | 6 December 2024   | 19 August 2026 archive release | SPHERE-ZIMPOL companion candidate        |
| AAVSO AID           | query-dependent   | continuously updated           | Long-term multi-band photometry          |
| MAST/HST            | product-dependent | product-dependent              | UV chromosphere and wind spectra         |

Exact fields, access conditions, checksums, and local paths live in [`data/manifest.yaml`](data/manifest.yaml). Raw and multi-gigabyte data are never committed.

## Quick start

### Python

```bash
python -m venv .venv
python -m pip install -e ".[dev]"
python -m pytest
```

Run only the dependency-free regression suite:

```bash
python -m unittest discover -s science/tests -v
```

### Web

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

The web app is a standard Next.js static export and contains no vendor-specific hosting metadata. `pnpm start` serves the generated `out/` directory after a build.

The public deployment is built from `main` by [the GitHub Pages workflow](.github/workflows/pages.yml). The workflow supplies the `/betelgeuse-observatory` base path so images, static chunks, and the hydrodynamic worker resolve correctly on the project site.

## Reproduce the first published-quantity checks

The tiny redistributable sample in [`data/samples/alma_2023_continuum.csv`](data/samples/alma_2023_continuum.csv) records the three integrated continuum points from Dent et al. The fit is intentionally described as a sanity check: it is not equivalent to the paper's matched-beam, spatially resolved spectral-index analysis.

```python
from science.betelgeuse import fit_power_law, propagate_causality

fit = fit_power_law(
    [223.55, 337.99, 485.22],
    [0.28, 0.51, 0.90],
    [0.014, 0.04, 0.09],
)
print(fit.spectral_index, fit.spectral_index_sigma)

scenario = propagate_causality(receive_year=2026, assumed_remaining_years=300)
print(scenario.emission_year, scenario.arrival_year)
```

## Evolutionary scenarios

- **Scenario A:** Joyce et al. identify the roughly 400-day signal as the fundamental radial mode and place Betelgeuse in core-helium burning. Goldberg et al. and MacLeod et al. provide companion-based interpretations for the roughly 2100/2170-day Long Secondary Period.
- **Scenario B:** Saio et al. identify the roughly 2200-day signal as the fundamental mode and obtain late core-carbon-burning models, some reaching carbon exhaustion on a less-than-about-300-year scale. Molnár et al. question whether the required radius is compatible with angular-diameter constraints.

These assumptions are never blended. Read [evolutionary scenarios](docs/evolutionary-scenarios.md).

## Methods and limitations

- [Scientific method and claim levels](docs/scientific-method.md)
- [Prediction analysis and signed forecast](docs/prediction-analysis.md)
- [Image-sequence and blink-comparison requirements](docs/image-sequence-analysis.md)
- [GPU 3D simulation method and limitations](docs/3d-simulation-method.md)
- [Contour reconstruction method and limitations](docs/contour-reconstruction.md)
- [Data provenance](docs/data-provenance.md)
- [Primary references](docs/references.bib)
- [Release status and archive-dependent extensions](docs/acceptance-status.md)

The Great Dimming is not labelled a known pre-supernova event. Press-release or paper-rendered images are editorial assets only; calibrated FITS and archive products are required for quantitative scientific analysis.

## Visual verification

The static export is browser-checked at 375, 768, 1024, and 1440 px. Generated review screenshots are not committed. The ALMA image in the interface is an attributed observational preview, not an application screenshot or a scientific-analysis input.

## Citation

Use [`CITATION.cff`](CITATION.cff) to cite Biswajit Jana's software and cite each underlying observatory dataset and paper used in an analysis.
