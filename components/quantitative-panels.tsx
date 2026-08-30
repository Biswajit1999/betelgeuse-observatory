const measurements = [
  {
    frequency: 223.55,
    flux: 0.28,
    sigma: 0.014,
    diameter: 62.14,
    temperature: 2342,
    band: 'Band 6',
  },
  {
    frequency: 337.99,
    flux: 0.51,
    sigma: 0.04,
    diameter: 57.74,
    temperature: 2294,
    band: 'Band 7',
  },
  {
    frequency: 485.22,
    flux: 0.9,
    sigma: 0.09,
    diameter: 54.3,
    temperature: 2266,
    band: 'Band 8',
  },
] as const;

const fitAmplitude = 0.517685878;
const fitIndex = 1.493573928;
const fitIndexSigma = 0.13334947;
const referenceFrequency = 337.99;

const chart = { left: 68, right: 616, top: 28, bottom: 292 };
const x = (frequency: number) =>
  chart.left + ((frequency - 200) / 310) * (chart.right - chart.left);
const yFlux = (flux: number) =>
  chart.bottom - ((flux - 0.15) / 0.9) * (chart.bottom - chart.top);
const yDiameter = (diameter: number) =>
  chart.bottom - ((diameter - 52) / 12) * (chart.bottom - chart.top);
const fittedFlux = (frequency: number, index = fitIndex) =>
  fitAmplitude * (frequency / referenceFrequency) ** index;

const fitPath = Array.from(
  { length: 65 },
  (_, index) => 205 + index * (300 / 64),
)
  .map(
    (frequency, index) =>
      `${index === 0 ? 'M' : 'L'} ${x(frequency).toFixed(2)} ${yFlux(fittedFlux(frequency)).toFixed(2)}`,
  )
  .join(' ');
const rayleighJeansPath = Array.from(
  { length: 65 },
  (_, index) => 205 + index * (300 / 64),
)
  .map(
    (frequency, index) =>
      `${index === 0 ? 'M' : 'L'} ${x(frequency).toFixed(2)} ${yFlux(fittedFlux(frequency, 2)).toFixed(2)}`,
  )
  .join(' ');
const diameterPath = measurements
  .map(
    (point, index) =>
      `${index === 0 ? 'M' : 'L'} ${x(point.frequency).toFixed(2)} ${yDiameter(point.diameter).toFixed(2)}`,
  )
  .join(' ');

const frequencyTicks = [200, 300, 400, 500];
const fluxTicks = [0.2, 0.4, 0.6, 0.8, 1.0];
const diameterTicks = [52, 56, 60, 64];

export function QuantitativePanels() {
  return (
    <div className="quantitative-panels">
      <article className="plot-card">
        <div className="plot-heading">
          <div>
            <span className="evidence-tag measured">Measured + fitted</span>
            <h3>Integrated continuum spectrum</h3>
          </div>
          <p>Weighted in log space</p>
        </div>
        <div className="plot-scroll">
          <svg
            className="science-plot"
            viewBox="0 0 640 350"
            aria-labelledby="continuum-plot-title continuum-plot-desc"
          >
            <title id="continuum-plot-title">
              ALMA 2023 integrated flux density against observing frequency
            </title>
            <desc id="continuum-plot-desc">
              Three measured flux densities with one-sigma vertical error bars,
              a fitted power law with spectral index 1.49 plus or minus 0.13,
              and a reference nu-squared slope.
            </desc>
            {fluxTicks.map((tick) => (
              <g key={tick}>
                <line
                  className="plot-gridline"
                  x1={chart.left}
                  x2={chart.right}
                  y1={yFlux(tick)}
                  y2={yFlux(tick)}
                />
                <text
                  className="plot-tick"
                  x={chart.left - 12}
                  y={yFlux(tick) + 4}
                  textAnchor="end"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}
            {frequencyTicks.map((tick) => (
              <g key={tick}>
                <line
                  className="plot-gridline"
                  x1={x(tick)}
                  x2={x(tick)}
                  y1={chart.top}
                  y2={chart.bottom}
                />
                <text
                  className="plot-tick"
                  x={x(tick)}
                  y={chart.bottom + 24}
                  textAnchor="middle"
                >
                  {tick}
                </text>
              </g>
            ))}
            <line
              className="plot-axis"
              x1={chart.left}
              x2={chart.right}
              y1={chart.bottom}
              y2={chart.bottom}
            />
            <line
              className="plot-axis"
              x1={chart.left}
              x2={chart.left}
              y1={chart.top}
              y2={chart.bottom}
            />
            <path className="plot-reference" d={rayleighJeansPath} />
            <path className="plot-fit" d={fitPath} />
            {measurements.map((point) => (
              <g key={point.band}>
                <line
                  className="plot-error"
                  x1={x(point.frequency)}
                  x2={x(point.frequency)}
                  y1={yFlux(point.flux - point.sigma)}
                  y2={yFlux(point.flux + point.sigma)}
                />
                <line
                  className="plot-error"
                  x1={x(point.frequency) - 6}
                  x2={x(point.frequency) + 6}
                  y1={yFlux(point.flux - point.sigma)}
                  y2={yFlux(point.flux - point.sigma)}
                />
                <line
                  className="plot-error"
                  x1={x(point.frequency) - 6}
                  x2={x(point.frequency) + 6}
                  y1={yFlux(point.flux + point.sigma)}
                  y2={yFlux(point.flux + point.sigma)}
                />
                <circle
                  className="plot-point"
                  cx={x(point.frequency)}
                  cy={yFlux(point.flux)}
                  r="6"
                />
              </g>
            ))}
            <text
              className="plot-label"
              x={(chart.left + chart.right) / 2}
              y="340"
              textAnchor="middle"
            >
              Frequency ν (GHz)
            </text>
            <text
              className="plot-label"
              transform="rotate(-90 17 160)"
              x="17"
              y="160"
              textAnchor="middle"
            >
              Integrated flux density Sν (Jy)
            </text>
            <g className="plot-legend" transform="translate(390 42)">
              <line className="plot-fit" x1="0" x2="28" y1="0" y2="0" />
              <text x="36" y="4">
                weighted fit, α = 1.49
              </text>
              <line className="plot-reference" x1="0" x2="28" y1="22" y2="22" />
              <text x="36" y="26">
                ν² reference
              </text>
            </g>
          </svg>
        </div>
        <div className="equation-block" aria-label="Power-law fit equation">
          <p className="equation">
            <var>S</var>
            <sub>ν</sub> = <var>A</var> (<var>ν</var>/<var>ν</var>
            <sub>0</sub>)<sup>α</sup>
          </p>
          <p>
            <var>A</var> = 0.518 Jy at <var>ν</var>
            <sub>0</sub> = 337.99 GHz; <var>α</var> = {fitIndex.toFixed(3)} ±{' '}
            {fitIndexSigma.toFixed(3)}.
          </p>
        </div>
        <p className="plot-interpretation">
          <strong>Qualitative reading:</strong> the integrated flux rises with
          frequency, but more slowly than a fixed-area, optically thick
          Rayleigh–Jeans <var>ν</var>
          <sup>2</sup> reference. The changing apparent size and atmospheric
          optical depth prevent a one-parameter physical interpretation.
        </p>
      </article>

      <article className="plot-card">
        <div className="plot-heading">
          <div>
            <span className="evidence-tag measured">Measured geometry</span>
            <h3>Frequency-dependent diameter</h3>
          </div>
          <p>Uniform elliptical-disc fit</p>
        </div>
        <div className="plot-scroll">
          <svg
            className="science-plot"
            viewBox="0 0 640 350"
            aria-labelledby="diameter-plot-title diameter-plot-desc"
          >
            <title id="diameter-plot-title">
              ALMA 2023 fitted angular diameter against observing frequency
            </title>
            <desc id="diameter-plot-desc">
              The fitted angular diameter decreases from 62.14 milliarcseconds
              at 223.55 gigahertz to 54.30 milliarcseconds at 485.22 gigahertz.
            </desc>
            {diameterTicks.map((tick) => (
              <g key={tick}>
                <line
                  className="plot-gridline"
                  x1={chart.left}
                  x2={chart.right}
                  y1={yDiameter(tick)}
                  y2={yDiameter(tick)}
                />
                <text
                  className="plot-tick"
                  x={chart.left - 12}
                  y={yDiameter(tick) + 4}
                  textAnchor="end"
                >
                  {tick}
                </text>
              </g>
            ))}
            {frequencyTicks.map((tick) => (
              <g key={tick}>
                <line
                  className="plot-gridline"
                  x1={x(tick)}
                  x2={x(tick)}
                  y1={chart.top}
                  y2={chart.bottom}
                />
                <text
                  className="plot-tick"
                  x={x(tick)}
                  y={chart.bottom + 24}
                  textAnchor="middle"
                >
                  {tick}
                </text>
              </g>
            ))}
            <line
              className="plot-axis"
              x1={chart.left}
              x2={chart.right}
              y1={chart.bottom}
              y2={chart.bottom}
            />
            <line
              className="plot-axis"
              x1={chart.left}
              x2={chart.left}
              y1={chart.top}
              y2={chart.bottom}
            />
            <path className="diameter-fit" d={diameterPath} />
            {measurements.map((point) => (
              <g key={point.band}>
                <circle
                  className="diameter-point"
                  cx={x(point.frequency)}
                  cy={yDiameter(point.diameter)}
                  r="6"
                />
                <text
                  className="point-annotation"
                  x={x(point.frequency)}
                  y={yDiameter(point.diameter) - 14}
                  textAnchor="middle"
                >
                  {point.diameter.toFixed(2)} mas
                </text>
              </g>
            ))}
            <text
              className="plot-label"
              x={(chart.left + chart.right) / 2}
              y="340"
              textAnchor="middle"
            >
              Frequency ν (GHz)
            </text>
            <text
              className="plot-label"
              transform="rotate(-90 17 160)"
              x="17"
              y="160"
              textAnchor="middle"
            >
              Angular diameter θ (mas)
            </text>
          </svg>
        </div>
        <div
          className="equation-block"
          aria-label="Angular to physical diameter equation"
        >
          <p className="equation">
            <var>L</var> (AU) = <var>θ</var> (mas) × <var>D</var> (pc) / 1000
          </p>
          <p>
            At 172 pc, Band 8 gives <var>L</var> = 9.34 AU and <var>R</var> ≈
            1004 R<sub>☉</sub>. Distance uncertainty scales these values
            linearly.
          </p>
        </div>
        <p className="plot-interpretation">
          <strong>Qualitative reading:</strong> higher observing frequency
          reaches a smaller <var>τ</var>
          <sub>ν</sub> ≈ 1 surface. The reported mean brightness temperatures
          remain close—2342, 2294, and 2266 K—so diameter, opacity, and
          temperature must be interpreted together.
        </p>
      </article>

      <div className="plot-data-table">
        <h3>Data-table alternative</h3>
        <div className="wave-table">
          <table>
            <thead>
              <tr>
                <th>Band</th>
                <th>ν (GHz)</th>
                <th>Sν (Jy)</th>
                <th>1σ (Jy)</th>
                <th>θ (mas)</th>
                <th>Tb (K)</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((point) => (
                <tr key={point.band}>
                  <td>{point.band}</td>
                  <td>{point.frequency.toFixed(2)}</td>
                  <td>{point.flux.toFixed(2)}</td>
                  <td>{point.sigma.toFixed(3)}</td>
                  <td>{point.diameter.toFixed(2)}</td>
                  <td>{point.temperature}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Source:{' '}
          <a href="https://arxiv.org/abs/2608.19339">
            Dent et al. (2026), ALMA observations obtained in August 2023
          </a>
          . The power-law line is this repository’s uncertainty-weighted
          three-point calculation, not the paper’s spatially resolved
          spectral-index map.
        </p>
      </div>
    </div>
  );
}
