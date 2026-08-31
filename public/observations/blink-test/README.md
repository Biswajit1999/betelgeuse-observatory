# Betelgeuse ALMA visual blink test

This folder contains the three rendered continuum panels from Figure 1 of
Dent et al. (2026), observed with ALMA Bands 6, 7, and 8 during August 2023.
The panels share a 90 mas field of view and are provided solely to test the
website's local blink-comparator controls.

Load the files in filename order:

1. `01-alma-band6-2023.png`
2. `02-alma-band7-2023.png`
3. `03-alma-band8-2023.png`

Important limitation: this is a multi-frequency visual demonstration, not a
registered multi-epoch time series. The bands have different observing
frequencies, restoring beams, calibration uncertainties, and brightness
scales. Do not interpret apparent frame-to-frame changes as temporal motion
or use these rendered panels for quantitative residual analysis. That work
requires calibrated FITS products, common astrometry, matched beams, common
units, and propagated uncertainties.

Source: W. R. F. Dent et al., “ALMA high-resolution observations of
Betelgeuse: Persistent structure spanning the inner atmosphere,” arXiv
2608.19339 (2026), Figure 1:
https://arxiv.org/html/2608.19339

Licence: CC BY 4.0. Attribution: Dent et al. (2026).
