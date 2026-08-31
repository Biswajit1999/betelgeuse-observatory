# Acceptance status

This matrix defines the version 1.0 repository release. It separates completed software from observational extensions that require external calibrated products. An archive-dependent extension is not a missing website feature and is never represented as completed science before its data are retrieved and validated.

## Verified in this repository

- [x] Latest observation dates are separate from publication/release dates.
- [x] ALMA 2015/2023 and ESO SPHERE provenance is present.
- [x] The 172 +13/-11 pc distance posterior is sampled and propagated.
- [x] The light-time cancellation equation is implemented and unit-tested.
- [x] No component claims to observe outside Earth's past light cone.
- [x] A transparent robust-anomaly baseline and continuum spectral-index baseline provide auditable checks.
- [x] The Great Dimming is not labelled as a known pre-supernova event.
- [x] The roughly 400-day and 2100/2200-day interpretations are compared without blending assumptions.
- [x] Joyce/core-helium and Saio/core-carbon scenario families remain separate.
- [x] Companion evidence is incorporated with primary/official sources.
- [x] Simulated material is visibly labelled, and no exact supernova date exists.
- [x] The web implementation contains a reduced-motion mode, keyboard semantics, visible focus, and text evidence labels.
- [x] The standard Next.js production build generates a static export successfully.
- [x] Published numerical values shown in the web experience link to sources.
- [x] Published ALMA continuum flux, uncertainty, angular-diameter, and brightness-temperature values have plotted and tabular representations.
- [x] The 1836--2026 brightness record uses 27 published Herschel reconstructions and 51,460 quality-screened AAVSO detections, keeps visual and Johnson V series separate, exposes bin scatter, and includes a reproducible public CSV.
- [x] Band 8 contour, residual, and radial spectral-index panels reconstruct published fit conventions while explicitly refusing to represent the result as calibrated observed pixels.
- [x] The continuum workbench provides bounded in-band predictions, standardized residuals, and an explicit incomplete-uncertainty warning.
- [x] The local blink comparator supports large rendered-image sequences while refusing quantitative differencing without registered, beam-matched data.
- [x] The signed author forecast states a preferred model family, a representative 202,026 CE point, the contested short-horizon branch, and falsifiers.
- [x] The WebGL timeline provides high/efficient GPU modes, switchable measured near-infrared and ALMA emitting layers, a physics-coupled convection field, a 500-year received-time axis, and an explicitly imposed short-horizon explosion branch.
- [x] The stellar surface is coupled to a reduced spherical conservation-law gas solver with metric-aware derivatives, area-weighted diagnostics, advected temperature, density, horizontal/radial velocity, pressure gradients, buoyancy, viscosity, thermal diffusion, compressional heating, and radiative relaxation.
- [x] The simulated ejecta radius and angular-size equations are unit-tested and remain separate from the logarithmically compressed visual scale.
- [x] Browser visual QA passes at 375, 768, 1024, and 1440 px with no unintended horizontal clipping or console errors.
- [x] Dependencies, seeds, hashes, runtime records, and CI contracts are present.
- [x] GitHub Pages builds with the repository base path, including public images and the hydrodynamic Web Worker.
- [x] The release includes a first-person LaTeX report and visually verified compiled PDF.

## Archive-dependent research extensions

These are deliberately outside the version 1.0 distributable data package:

| Extension                                    | Current release status                                                                                                       | Completion evidence required                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| MAST/HST spectra                             | Official retrieval routes and manifest contracts are present; selected spectra have not been downloaded.                     | Selected product identifiers, retrieval dates, licences, SHA-256 hashes, units, and uncertainty columns.                       |
| ALMA 2015/2023 re-reduction                  | Programme identifiers, query URLs, safety notes, and target paths are present; multi-gigabyte measurement sets are excluded. | Calibrated products, CASA version, imaging parameters, common restoring beam, and product hashes.                              |
| Measured spectral and epoch-difference plots | Equations, metadata requirements, and interactive explanation are implemented; no values are invented.                       | Registered calibrated inputs, propagated covariance, line metadata, and held-out epoch checks.                                 |
| Extended time-series baselines               | Historical AAVSO/Herschel visualisation and robust bins are complete; predictive methods remain a subsequent analysis study. | Predeclared evaluation split, Lomb-Scargle/GP/PCA/change-point/AR results, residual diagnostics, and reproducible run records. |

The version 1.0 repository is complete within its stated evidence boundary. Future archive analyses should be released as new, independently reproducible data versions rather than retroactively checking boxes without the required products.
