# Contour reconstruction method

The website's contour laboratory is a reproducible parametric reconstruction of the Band 8 figure conventions in Dent et al. (2026). It is not a pixel extraction from the paper image and it is not a substitute for calibrated ALMA FITS images or visibility-domain modelling.

## Continuum field

The displayed field combines an axisymmetric elliptical disk, a weak extended component, and compact elliptical Gaussians:

```text
I_nu(x,y) = I_disk(x,y) + I_extended(x,y)
            + sum_k A_k exp[-0.5 r_k(x,y)^2].
```

The Band 8 disk uses the published 54.30 mas major-axis diameter, 0.98 axial ratio, and 33 degree position angle. The northeast Gaussian uses the published (+10.1,+9.2) mas offset, 10.9 mas major-axis FWHM, 0.86 axial ratio, and 111 degree position angle. The northern point component is anchored at the published (-2.1,+17.7) mas location. The southwest and belt terms are deliberately marked illustrative because a unique component decomposition is not available from a rendered figure.

Contours are calculated directly from the sampled scalar field with marching squares. The levels 4, 8, 12, 16, 20, 22, 23, 24, 25, and 26 mJy per beam, the dashed 42 mas optical-diameter circle, the 70 mas field, and the 7.7 x 6.6 mas restoring-beam marker follow the published Band 8 presentation.

## Residual field

The residual panel subtracts the axisymmetric disk and adds explicit positive and negative perturbations to demonstrate the diagnostic:

```text
Delta I_nu(x,y) = I_nu(x,y) - I_nu,axi(x,y).
```

The plus or minus 2 and 4 mJy per beam contours follow the residual-contour convention used for extended-continuum analysis. Their detailed morphology is illustrative. A scientific residual map requires the calibrated measurement, an explicitly fitted null model, beam covariance, and a propagated noise model.

## Matched-beam radial profile

The radial panel applies the standard two-band relation

```text
alpha(r) = ln[I_8(r)/I_7(r)] / ln(nu_8/nu_7).
```

A real spectral-index map must place both bands on the same astrometric grid, convolve them to a common restoring beam, mask values below a defined signal-to-noise threshold, and propagate calibration covariance as well as map noise. The website uses smooth parametric profiles to explain that method; it does not claim to reproduce the paper's measured alpha map.

## Reproduction boundary

The reconstruction is suitable for explaining geometry, component fitting, contour topology, residual interpretation, and radial spectral-index calculation. Publication-grade reproduction requires retrieving programme 2022.A.00026.S from the ALMA archive and rerunning the reduction and visibility modelling with recorded software versions and calibration products.
