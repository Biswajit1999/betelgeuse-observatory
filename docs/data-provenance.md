# Data provenance

`data/manifest.yaml` is the canonical source inventory. Every product records target, observatory, programme, observing interval, spectral coverage, resolution, processing level, units, source, publication, licence, SHA-256, local path, retrieval time, and pipeline version.

Null values mean the archive query has not yet selected a product. They are not silently replaced by guesses.

## Storage policy

- `data/raw/` and `data/interim/` are gitignored.
- Multi-gigabyte ALMA visibility data are never committed.
- Scientific analysis uses calibrated FITS, spectra, or measurement sets, not rendered paper/press PNGs.
- Small redistributable examples live in `data/samples/` with sources and hashes.
- CASA is required for ALMA visibility calibration and interferometric imaging.

## Historical photometry

The long-baseline brightness product is deliberately not an image sequence.
It combines 27 magnitudes reconstructed from William Herschel's 1836--1840
comparison sequences in Lloyd (2020), Table 1, with AAVSO AID measurements
from 1893-12-10 through 2026-08-30. The AAVSO records remain split into
`Vis.` estimates and Johnson `V`; these passbands are not interchangeable.

`science/ingestion/aavso_history.py` retrieves three non-overlapping Julian
Date intervals from the official VSX/AID endpoint, deduplicates observation
IDs, excludes upper limits, and applies a broad `-0.5 <= magnitude <= 3.0`
plausibility screen. Of 51,546 returned rows, 51,460 detections are retained:
48,378 visual and 3,082 Johnson V. The committed CSV contains 90-day medians
and quartiles for the full overview and 30-day medians and quartiles from 2010
onward. It inserts no values in empty bins. The complete row-level export is
written to gitignored `data/raw/aavso_alpha_ori_1893_2026.csv`.

Reproduce the retrieval and summaries from the repository root:

```bash
python science/ingestion/aavso_history.py
```

The public derived CSV is
`public/downloads/betelgeuse-historical-photometry-1836-2026.csv`. Its SHA-256
is `1b804b6b95e7f28b13b1414ae1773c11a62671b7860894972ad88bba5202fd71`.

We gratefully acknowledge the contributions of the AAVSO observer community,
whose photometric data and metadata resources were used in this study and made
available through the AAVSO's scientific archives.

## Retrieval

`science/ingestion/alma.py` prints explicit programme query URLs and safety notes without downloading anything. MAST and ESO archive entries point to their official interfaces. Authentication, acknowledgements, or data-access terms must be completed by the researcher; the repository never bypasses them. The AAVSO script uses the public VSX/AID query endpoint and preserves the recommended acknowledgement.
