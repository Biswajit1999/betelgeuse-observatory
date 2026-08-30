const FIELD_HALF_MAS = 35;
const GRID_CELLS = 42;
const MAP = { left: 50, right: 410, top: 20, bottom: 380 };
const BAND_8_LEVELS = [4, 8, 12, 16, 20, 22, 23, 24, 25, 26];

type Point = { x: number; y: number };
type Grid = number[][];

function gaussian(
  ra: number,
  dec: number,
  centreRa: number,
  centreDec: number,
  fwhmMajor: number,
  axialRatio = 1,
  positionAngleDeg = 0,
) {
  const theta = (positionAngleDeg * Math.PI) / 180;
  const dx = ra - centreRa;
  const dy = dec - centreDec;
  const along = dx * Math.sin(theta) + dy * Math.cos(theta);
  const across = dx * Math.cos(theta) - dy * Math.sin(theta);
  const sigmaMajor = fwhmMajor / 2.35482;
  const sigmaMinor = sigmaMajor * axialRatio;
  return Math.exp(
    -0.5 * (along ** 2 / sigmaMajor ** 2 + across ** 2 / sigmaMinor ** 2),
  );
}

function axisymmetricBand8(ra: number, dec: number) {
  const theta = (33 * Math.PI) / 180;
  const major = ra * Math.sin(theta) + dec * Math.cos(theta);
  const minor = ra * Math.cos(theta) - dec * Math.sin(theta);
  const ellipticalRadius = Math.sqrt(
    (major / 27.15) ** 2 + (minor / (27.15 * 0.98)) ** 2,
  );
  const disk = 19.8 / (1 + Math.exp((ellipticalRadius - 1) * 17));
  const extended = 2.0 * Math.exp(-((Math.hypot(ra, dec) / 38) ** 2));
  return disk + extended;
}

function band8Model(ra: number, dec: number) {
  const northEast = 5.0 * gaussian(ra, dec, 10.1, 9.2, 10.9, 0.86, 111);
  const northPoint = 1.65 * gaussian(ra, dec, -2.1, 17.7, 7.2, 0.92, 2);
  const southWest = 2.75 * gaussian(ra, dec, -13.5, -12.0, 10.5, 0.72, 118);
  const centralBelt = 0.85 * gaussian(ra, dec, 0, 0, 35, 0.18, 120);
  return (
    axisymmetricBand8(ra, dec) +
    northEast +
    northPoint +
    southWest +
    centralBelt
  );
}

function residualModel(ra: number, dec: number) {
  return (
    band8Model(ra, dec) -
    axisymmetricBand8(ra, dec) -
    2.9 * gaussian(ra, dec, 6, -10, 12, 0.75, 18) -
    2.25 * gaussian(ra, dec, -14, 5, 9, 0.8, 95)
  );
}

function mapRa(ra: number) {
  return (
    MAP.left +
    ((FIELD_HALF_MAS - ra) / (FIELD_HALF_MAS * 2)) * (MAP.right - MAP.left)
  );
}

function mapDec(dec: number) {
  return (
    MAP.top +
    ((FIELD_HALF_MAS - dec) / (FIELD_HALF_MAS * 2)) * (MAP.bottom - MAP.top)
  );
}

function buildGrid(field: (ra: number, dec: number) => number) {
  return Array.from({ length: GRID_CELLS + 1 }, (_, row) => {
    const dec = FIELD_HALF_MAS - (row / GRID_CELLS) * FIELD_HALF_MAS * 2;
    return Array.from({ length: GRID_CELLS + 1 }, (_, column) => {
      const ra = FIELD_HALF_MAS - (column / GRID_CELLS) * FIELD_HALF_MAS * 2;
      return field(ra, dec);
    });
  });
}

function interpolation(
  a: Point,
  b: Point,
  va: number,
  vb: number,
  level: number,
) {
  const fraction = va === vb ? 0.5 : (level - va) / (vb - va);
  return {
    x: a.x + (b.x - a.x) * fraction,
    y: a.y + (b.y - a.y) * fraction,
  };
}

function contourPath(grid: Grid, level: number) {
  const segments: Array<[Point, Point]> = [];
  const edgePairs: Record<number, Array<[string, string]>> = {
    1: [['left', 'bottom']],
    2: [['bottom', 'right']],
    3: [['left', 'right']],
    4: [['top', 'right']],
    5: [
      ['top', 'left'],
      ['bottom', 'right'],
    ],
    6: [['top', 'bottom']],
    7: [['top', 'left']],
    8: [['left', 'top']],
    9: [['top', 'bottom']],
    10: [
      ['top', 'right'],
      ['left', 'bottom'],
    ],
    11: [['top', 'right']],
    12: [['left', 'right']],
    13: [['bottom', 'right']],
    14: [['left', 'bottom']],
  };

  for (let row = 0; row < GRID_CELLS; row += 1) {
    for (let column = 0; column < GRID_CELLS; column += 1) {
      const raLeft =
        FIELD_HALF_MAS - (column / GRID_CELLS) * FIELD_HALF_MAS * 2;
      const raRight =
        FIELD_HALF_MAS - ((column + 1) / GRID_CELLS) * FIELD_HALF_MAS * 2;
      const decTop = FIELD_HALF_MAS - (row / GRID_CELLS) * FIELD_HALF_MAS * 2;
      const decBottom =
        FIELD_HALF_MAS - ((row + 1) / GRID_CELLS) * FIELD_HALF_MAS * 2;
      const topLeft = { x: mapRa(raLeft), y: mapDec(decTop) };
      const topRight = { x: mapRa(raRight), y: mapDec(decTop) };
      const bottomRight = { x: mapRa(raRight), y: mapDec(decBottom) };
      const bottomLeft = { x: mapRa(raLeft), y: mapDec(decBottom) };
      const valueTopLeft = grid[row][column];
      const valueTopRight = grid[row][column + 1];
      const valueBottomRight = grid[row + 1][column + 1];
      const valueBottomLeft = grid[row + 1][column];
      const code =
        (valueTopLeft >= level ? 8 : 0) |
        (valueTopRight >= level ? 4 : 0) |
        (valueBottomRight >= level ? 2 : 0) |
        (valueBottomLeft >= level ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const points: Record<string, Point> = {
        top: interpolation(
          topLeft,
          topRight,
          valueTopLeft,
          valueTopRight,
          level,
        ),
        right: interpolation(
          topRight,
          bottomRight,
          valueTopRight,
          valueBottomRight,
          level,
        ),
        bottom: interpolation(
          bottomLeft,
          bottomRight,
          valueBottomLeft,
          valueBottomRight,
          level,
        ),
        left: interpolation(
          topLeft,
          bottomLeft,
          valueTopLeft,
          valueBottomLeft,
          level,
        ),
      };
      for (const [start, end] of edgePairs[code] ?? []) {
        segments.push([points[start], points[end]]);
      }
    }
  }

  return segments
    .map(
      ([start, end]) =>
        `M${start.x.toFixed(2)},${start.y.toFixed(2)}L${end.x.toFixed(2)},${end.y.toFixed(2)}`,
    )
    .join('');
}

function mixColour(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
) {
  return `rgb(${a.map((channel, index) => Math.round(channel + (b[index] - channel) * t)).join(',')})`;
}

function continuumColour(value: number) {
  const normalized = Math.max(0, Math.min(1, value / 27));
  if (normalized < 0.42) {
    return mixColour([3, 4, 7], [115, 12, 5], normalized / 0.42);
  }
  if (normalized < 0.78) {
    return mixColour([115, 12, 5], [240, 82, 5], (normalized - 0.42) / 0.36);
  }
  return mixColour([240, 82, 5], [255, 238, 174], (normalized - 0.78) / 0.22);
}

function residualColour(value: number) {
  const normalized = Math.max(-1, Math.min(1, value / 5));
  return normalized < 0
    ? mixColour([10, 12, 18], [52, 139, 196], -normalized)
    : mixColour([10, 12, 18], [243, 87, 42], normalized);
}

function HeatCells({
  grid,
  residual = false,
}: {
  grid: Grid;
  residual?: boolean;
}) {
  const width = (MAP.right - MAP.left) / GRID_CELLS;
  const height = (MAP.bottom - MAP.top) / GRID_CELLS;
  return grid
    .slice(0, GRID_CELLS)
    .flatMap((row, rowIndex) =>
      row
        .slice(0, GRID_CELLS)
        .map((value, columnIndex) => (
          <rect
            key={`${rowIndex}-${columnIndex}`}
            x={MAP.left + columnIndex * width}
            y={MAP.top + rowIndex * height}
            width={width + 0.35}
            height={height + 0.35}
            fill={residual ? residualColour(value) : continuumColour(value)}
          />
        )),
    );
}

function MapFrame() {
  const ticks = [-30, -15, 0, 15, 30];
  return (
    <>
      <rect
        x={MAP.left}
        y={MAP.top}
        width={MAP.right - MAP.left}
        height={MAP.bottom - MAP.top}
        className="contour-frame"
      />
      {ticks.map((tick) => (
        <g key={`ra-${tick}`}>
          <line
            className="contour-tick"
            x1={mapRa(tick)}
            x2={mapRa(tick)}
            y1={MAP.bottom}
            y2={MAP.bottom + 6}
          />
          <text
            className="contour-axis-text"
            x={mapRa(tick)}
            y="401"
            textAnchor="middle"
          >
            {tick}
          </text>
        </g>
      ))}
      {ticks.map((tick) => (
        <g key={`dec-${tick}`}>
          <line
            className="contour-tick"
            x1={MAP.left - 6}
            x2={MAP.left}
            y1={mapDec(tick)}
            y2={mapDec(tick)}
          />
          <text
            className="contour-axis-text"
            x={MAP.left - 10}
            y={mapDec(tick) + 4}
            textAnchor="end"
          >
            {tick}
          </text>
        </g>
      ))}
      <text className="contour-axis-label" x="230" y="429" textAnchor="middle">
        ΔRA (mas; east is left)
      </text>
      <text
        className="contour-axis-label"
        transform="rotate(-90 13 200)"
        x="13"
        y="200"
        textAnchor="middle"
      >
        ΔDec (mas)
      </text>
    </>
  );
}

function BeamAndNominalDisk() {
  const beamWidth = (7.7 / (FIELD_HALF_MAS * 2)) * (MAP.right - MAP.left);
  const beamHeight = (6.6 / (FIELD_HALF_MAS * 2)) * (MAP.bottom - MAP.top);
  const diskDiameter = (42 / (FIELD_HALF_MAS * 2)) * (MAP.right - MAP.left);
  return (
    <>
      <circle
        cx={mapRa(0)}
        cy={mapDec(0)}
        r={diskDiameter / 2}
        className="nominal-star-circle"
      />
      <ellipse
        cx={MAP.left + 25}
        cy={MAP.bottom - 25}
        rx={beamWidth / 2}
        ry={beamHeight / 2}
        transform={`rotate(-2 ${MAP.left + 25} ${MAP.bottom - 25})`}
        className="beam-ellipse"
      />
    </>
  );
}

function radialProfiles() {
  return Array.from({ length: 61 }, (_, radius) => {
    const alpha = Math.max(0.42, 1.72 - 0.0205 * radius);
    const band7 =
      0.041 / (1 + Math.exp((radius - 28.9) / 1.8)) +
      0.0022 * Math.exp(-((radius / 45) ** 2));
    const band8 = band7 * (485.22 / 337.99) ** alpha;
    return { radius, alpha, band7, band8 };
  });
}

const radialData = radialProfiles();

function RadialProfilePlot() {
  const frame = { left: 68, right: 580, top: 28, bottom: 280 };
  const x = (radius: number) =>
    frame.left + (radius / 60) * (frame.right - frame.left);
  const yFlux = (flux: number) => {
    const logValue = Math.log10(Math.max(flux, 0.0005));
    return frame.bottom - ((logValue + 3.4) / 2.1) * (frame.bottom - frame.top);
  };
  const yAlpha = (alpha: number) =>
    frame.bottom - (alpha / 2) * (frame.bottom - frame.top);
  const path = (
    field: 'band7' | 'band8' | 'alpha',
    scale: (value: number) => number,
  ) =>
    radialData
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'}${x(point.radius).toFixed(2)},${scale(point[field]).toFixed(2)}`,
      )
      .join('');
  return (
    <svg
      className="radial-profile-plot"
      viewBox="0 0 640 340"
      aria-labelledby="radial-title radial-desc"
    >
      <title id="radial-title">
        Parametric radial intensity and spectral-index profiles
      </title>
      <desc id="radial-desc">
        Matched-beam Band 7 and Band 8 radial intensity profiles on a
        logarithmic scale and a separately scaled spectral-index profile from
        zero to two.
      </desc>
      {[0, 15, 30, 45, 60].map((tick) => (
        <g key={tick}>
          <line
            className="profile-grid"
            x1={x(tick)}
            x2={x(tick)}
            y1={frame.top}
            y2={frame.bottom}
          />
          <text
            className="profile-tick"
            x={x(tick)}
            y="302"
            textAnchor="middle"
          >
            {tick}
          </text>
        </g>
      ))}
      {[-3, -2.5, -2, -1.5].map((tick) => (
        <g key={tick}>
          <line
            className="profile-grid"
            x1={frame.left}
            x2={frame.right}
            y1={yFlux(10 ** tick)}
            y2={yFlux(10 ** tick)}
          />
          <text
            className="profile-tick"
            x={frame.left - 10}
            y={yFlux(10 ** tick) + 4}
            textAnchor="end"
          >
            10
            <tspan dy="-4" fontSize="8">
              {tick}
            </tspan>
          </text>
        </g>
      ))}
      {[0, 0.5, 1, 1.5, 2].map((tick) => (
        <text
          key={tick}
          className="profile-tick"
          x={frame.right + 10}
          y={yAlpha(tick) + 4}
        >
          {tick.toFixed(1)}
        </text>
      ))}
      <rect
        x={frame.left}
        y={frame.top}
        width={frame.right - frame.left}
        height={frame.bottom - frame.top}
        className="profile-frame"
      />
      <path className="profile-band7" d={path('band7', yFlux)} />
      <path className="profile-band8" d={path('band8', yFlux)} />
      <path className="profile-alpha" d={path('alpha', yAlpha)} />
      <text
        className="profile-direct-label band7"
        x={x(7)}
        y={yFlux(radialData[7].band7) - 10}
      >
        Band 7
      </text>
      <text
        className="profile-direct-label band8"
        x={x(18)}
        y={yFlux(radialData[18].band8) - 10}
      >
        Band 8
      </text>
      <text
        className="profile-direct-label alpha"
        x={x(38)}
        y={yAlpha(radialData[38].alpha) - 10}
      >
        α
      </text>
      <text className="profile-axis-label" x="322" y="330" textAnchor="middle">
        Angular radius (mas)
      </text>
      <text
        className="profile-axis-label"
        transform="rotate(-90 16 154)"
        x="16"
        y="154"
        textAnchor="middle"
      >
        Intensity (Jy beam⁻¹; log scale)
      </text>
      <text
        className="profile-axis-label"
        transform="rotate(90 626 154)"
        x="626"
        y="154"
        textAnchor="middle"
      >
        Spectral index α
      </text>
    </svg>
  );
}

export function ContourDiagnostics() {
  const continuumGrid = buildGrid(band8Model);
  const residualGrid = buildGrid(residualModel);
  const representativeRadii = [0, 21, 30, 45, 60];

  return (
    <section className="contour-suite" aria-labelledby="contour-suite-title">
      <div className="contour-suite-heading">
        <div>
          <span className="evidence-tag simulated">
            Published-fit reconstruction
          </span>
          <h3 id="contour-suite-title">
            Contour and radial-diagnostic laboratory
          </h3>
        </div>
        <p>
          Figure conventions follow Dent et al. (2026); values are generated
          from the published component fits, not extracted from the editorial
          PNG.
        </p>
      </div>

      <div className="contour-grid">
        <article className="contour-card">
          <div className="contour-card-heading">
            <div>
              <span className="evidence-tag simulated">Parametric Band 8</span>
              <h4>Continuum intensity with contours</h4>
            </div>
            <small>485.22 GHz · 70 mas field</small>
          </div>
          <svg
            className="contour-map"
            viewBox="0 0 460 445"
            aria-labelledby="band8-map-title band8-map-desc"
          >
            <title id="band8-map-title">
              Parametric Band 8 continuum contour map
            </title>
            <desc id="band8-map-desc">
              A synthetic continuum map constructed from the published disk,
              northeast component, northern point component, and illustrative
              southwest structure, with contours from 4 to 26 millijanskys per
              beam.
            </desc>
            <HeatCells grid={continuumGrid} />
            {BAND_8_LEVELS.map((level) => (
              <path
                key={level}
                d={contourPath(continuumGrid, level)}
                className={`continuum-contour contour-${level}`}
              />
            ))}
            <BeamAndNominalDisk />
            <MapFrame />
          </svg>
          <p className="contour-legend">
            Contours: {BAND_8_LEVELS.join(', ')} mJy beam⁻¹ · dashed circle: 42
            mas optical diameter · lower-left ellipse: 7.7 × 6.6 mas restoring
            beam.
          </p>
        </article>

        <article className="contour-card">
          <div className="contour-card-heading">
            <div>
              <span className="evidence-tag simulated">Model residual</span>
              <h4>Deviation from axisymmetry</h4>
            </div>
            <small>Iν − Iν,axi</small>
          </div>
          <svg
            className="contour-map"
            viewBox="0 0 460 445"
            aria-labelledby="residual-map-title residual-map-desc"
          >
            <title id="residual-map-title">
              Parametric continuum residual map
            </title>
            <desc id="residual-map-desc">
              A diverging residual field after subtracting the axisymmetric
              disk. Warm solid contours are positive two and four millijanskys
              per beam; cool dashed contours are negative two and four.
            </desc>
            <HeatCells grid={residualGrid} residual />
            {[2, 4].map((level) => (
              <path
                key={`positive-${level}`}
                d={contourPath(residualGrid, level)}
                className="residual-contour positive"
              />
            ))}
            {[-4, -2].map((level) => (
              <path
                key={`negative-${level}`}
                d={contourPath(
                  residualGrid.map((row) => row.map((value) => -value)),
                  -level,
                )}
                className="residual-contour negative"
              />
            ))}
            <BeamAndNominalDisk />
            <MapFrame />
          </svg>
          <p className="contour-legend">
            Solid warm contours: +2,+4 mJy beam⁻¹ · dashed cool contours: −2,−4
            mJy beam⁻¹. Residual morphology is illustrative, not a calibrated
            difference image.
          </p>
        </article>
      </div>

      <article className="radial-diagnostic-card">
        <div className="contour-card-heading">
          <div>
            <span className="evidence-tag calculated">Matched-beam method</span>
            <h4>Azimuthally averaged profiles and spectral index</h4>
          </div>
          <small>α(r) = ln[I₈(r)/I₇(r)] / ln(ν₈/ν₇)</small>
        </div>
        <div className="plot-scroll">
          <RadialProfilePlot />
        </div>
        <div className="contour-profile-table wave-table">
          <table>
            <thead>
              <tr>
                <th>Radius (mas)</th>
                <th>Band 7 (Jy beam⁻¹)</th>
                <th>Band 8 (Jy beam⁻¹)</th>
                <th>α</th>
              </tr>
            </thead>
            <tbody>
              {representativeRadii.map((radius) => {
                const point = radialData[radius];
                return (
                  <tr key={radius}>
                    <td>{radius}</td>
                    <td>{point.band7.toExponential(3)}</td>
                    <td>{point.band8.toExponential(3)}</td>
                    <td>{point.alpha.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      <div className="contour-equations">
        <p className="equation">
          I<sub>ν</sub>
          <sup>model</sup>(x,y) = I<sub>disk</sub> + Σ<sub>k</sub>A<sub>k</sub>{' '}
          exp[−½r<sub>k</sub>²]
        </p>
        <p>
          Published disk size, component locations, widths, axial ratios,
          position angles, and the Band 8 beam set the reconstruction.
          Calibrated FITS and visibility-domain modelling remain required to
          reproduce the paper&apos;s observed contours or uncertainty map.
        </p>
      </div>
    </section>
  );
}
