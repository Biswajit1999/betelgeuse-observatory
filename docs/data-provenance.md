# Data provenance

`data/manifest.yaml` is the canonical source inventory. Every product records target, observatory, programme, observing interval, spectral coverage, resolution, processing level, units, source, publication, licence, SHA-256, local path, retrieval time, and pipeline version.

Null values mean the archive query has not yet selected a product. They are not silently replaced by guesses.

## Storage policy

- `data/raw/` and `data/interim/` are gitignored.
- Multi-gigabyte ALMA visibility data are never committed.
- Scientific analysis uses calibrated FITS, spectra, or measurement sets, not rendered paper/press PNGs.
- Small redistributable examples live in `data/samples/` with sources and hashes.
- CASA is required for ALMA visibility calibration and interferometric imaging.

## Retrieval

`science/ingestion/alma.py` prints explicit programme query URLs and safety notes without downloading anything. AAVSO, MAST, and ESO archive entries point to their official interfaces. Authentication, acknowledgements, or data-access terms must be completed by the researcher; the repository never bypasses them.
