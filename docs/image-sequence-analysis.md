# Image-sequence and blink-comparison requirements

The browser blink comparator is a visual quality-control tool. It can display up to 5,000 locally selected PNG, JPEG, or WebP frames and renders one frame at a time. Browser caching and available memory still set practical limits. Files are not uploaded.

## Preconditions for scientific comparison

Two epochs may be blinked or differenced scientifically only after:

1. astrometric registration to a common world-coordinate grid;
2. identical pixel scale and projection;
3. conversion to common physical units;
4. primary-beam and flux-scale correction where required;
5. convolution to a common PSF or synthesised beam;
6. propagation of thermal, calibration, and correlated reconstruction noise;
7. masking of regions without common sensitivity.

For approximately Gaussian beams, choose convolution kernels satisfying

```text
B_target^2 = B_i^2 + B_kernel,i^2
```

along both fitted beam axes, including position angle. A standardized residual is

```text
R(x,y) = [I_2(x,y) - I_1(x,y)]
         / sqrt[sigma_1^2(x,y) + sigma_2^2(x,y)]
```

This simplified denominator is valid only when the two noise fields are independent. Shared calibration or reconstruction covariance requires an additional covariance term.

## Large sequences and cubes

Do not decode thousands of full-resolution frames simultaneously. Precompute registered thumbnails or tiled pyramids; decode the current and adjacent frames; move FITS parsing, reprojection, convolution, and cube slicing to a worker; keep raw data and beam metadata outside Git. Spectral cubes should be explored as channel maps with frequency/velocity and line metadata visible on every frame.

The committed ALMA PNG is an editorial preview and cannot supply a scientific time sequence. Retrieve calibrated 2015 and 2023 ALMA products before producing a quantitative epoch-difference result.

## Why the historical record is plotted, not blinked

Betelgeuse has a long photometric record but not two centuries of resolved
images. Herschel's nineteenth-century entries are comparison-star brightness
estimates; the AAVSO archive is primarily unresolved optical/NIR photometry.
Those measurements belong in a magnitude-versus-time plot with passbands,
sampling, uncertainty, and gaps visible. Turning them into synthetic star
images and blinking those frames would add unsupported spatial information.

Only modern resolved observations may enter the image comparator, and only
after the registration, unit, PSF/beam, and uncertainty conditions above are
met. The historical light curve and the modern image sequence answer different
questions and must remain separate.
