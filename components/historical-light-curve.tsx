'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';

import lightCurve from '@/data/samples/betelgeuse_historical_lightcurve.json';
import { siteAsset } from '@/lib/site-path';

type BinnedPoint = {
  series: string;
  band: string;
  bin_days: number;
  mid_jd: number;
  year: number;
  magnitude: number;
  q1: number;
  q3: number;
  mad: number;
  n: number;
};

type DisplayMode = 'magnitude' | 'flux';
type TimeWindow = 'overview' | 'recent';

const chart = { left: 72, right: 742, top: 30, bottom: 326 };
const referenceMagnitude = lightCurve.metadata.reference_magnitude;

const relativeFlux = (magnitude: number) =>
  10 ** (-0.4 * (magnitude - referenceMagnitude));

function splitAtGaps(points: BinnedPoint[], maximumGapYears: number) {
  const segments: BinnedPoint[][] = [];
  for (const point of points) {
    const current = segments.at(-1);
    if (!current || point.year - current.at(-1)!.year > maximumGapYears) {
      segments.push([point]);
    } else {
      current.push(point);
    }
  }
  return segments;
}

export function HistoricalLightCurve() {
  const [window, setWindow] = useState<TimeWindow>('overview');
  const [display, setDisplay] = useState<DisplayMode>('magnitude');

  const binned = (
    window === 'overview' ? lightCurve.overview : lightCurve.recent
  ) as BinnedPoint[];
  const visual = binned.filter((point) => point.band === 'Vis.');
  const johnsonV = binned.filter((point) => point.band === 'V');
  const herschel = window === 'overview' ? lightCurve.herschel : [];
  const startYear = window === 'overview' ? 1835 : 2010;
  const endYear = 2027;
  const maximumGap = window === 'overview' ? 0.65 : 0.24;
  const xTicks =
    window === 'overview'
      ? [1840, 1880, 1920, 1960, 2000, 2026]
      : [2010, 2014, 2018, 2022, 2026];

  const magnitudeDomain = useMemo(() => {
    const limits = binned.flatMap((point) => [point.q1, point.q3]);
    return [Math.min(-0.2, ...limits), Math.max(1.8, ...limits)] as const;
  }, [binned]);
  const magnitudeTicks = [0, 0.5, 1, 1.5, 2].filter(
    (tick) => tick >= magnitudeDomain[0] && tick <= magnitudeDomain[1],
  );

  const x = (year: number) =>
    chart.left +
    ((year - startYear) / (endYear - startYear)) * (chart.right - chart.left);
  const y = (magnitude: number) => {
    if (display === 'magnitude') {
      return (
        chart.top +
        ((magnitude - magnitudeDomain[0]) /
          (magnitudeDomain[1] - magnitudeDomain[0])) *
          (chart.bottom - chart.top)
      );
    }
    const flux = relativeFlux(magnitude);
    const fluxMinimum = relativeFlux(magnitudeDomain[1]);
    const fluxMaximum = relativeFlux(magnitudeDomain[0]);
    return (
      chart.bottom -
      ((flux - fluxMinimum) / (fluxMaximum - fluxMinimum)) *
        (chart.bottom - chart.top)
    );
  };

  const linePath = (points: BinnedPoint[]) =>
    splitAtGaps(points, maximumGap)
      .map((segment) =>
        segment
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${x(point.year).toFixed(2)} ${y(point.magnitude).toFixed(2)}`,
          )
          .join(' '),
      )
      .join(' ');

  const intervalPaths = (points: BinnedPoint[]) =>
    splitAtGaps(points, maximumGap)
      .filter((segment) => segment.length > 1)
      .map((segment) => {
        const upper = segment
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${x(point.year).toFixed(2)} ${y(point.q1).toFixed(2)}`,
          )
          .join(' ');
        const lower = [...segment]
          .reverse()
          .map(
            (point) =>
              `L ${x(point.year).toFixed(2)} ${y(point.q3).toFixed(2)}`,
          )
          .join(' ');
        return `${upper} ${lower} Z`;
      });

  const valueLabel = (magnitude: number) =>
    display === 'magnitude'
      ? magnitude.toFixed(1)
      : relativeFlux(magnitude).toFixed(2);

  return (
    <section
      className="history-suite"
      aria-labelledby="history-light-curve-title"
    >
      <div className="history-heading">
        <div>
          <span className="evidence-tag measured">
            51,460 archival measurements
          </span>
          <h3 id="history-light-curve-title">
            Betelgeuse brightness through 190 years
          </h3>
          <p>
            Herschel&apos;s 1836–1840 comparison estimates are shown as
            individual points. From 1893 onward, AAVSO visual estimates and
            Johnson V measurements remain separate and are summarized with
            robust time bins. No photographs or interpolated observations are
            inserted.
          </p>
        </div>
        <a
          className="history-download"
          href={siteAsset(
            '/downloads/betelgeuse-historical-photometry-1836-2026.csv',
          )}
          download
        >
          <Download aria-hidden="true" size={16} />
          Download derived CSV
        </a>
      </div>

      <div
        className="history-controls"
        aria-label="Historical light curve controls"
      >
        <div>
          <span>Time window</span>
          <button
            type="button"
            aria-pressed={window === 'overview'}
            onClick={() => setWindow('overview')}
          >
            1836–2026
          </button>
          <button
            type="button"
            aria-pressed={window === 'recent'}
            onClick={() => setWindow('recent')}
          >
            2010–2026 detail
          </button>
        </div>
        <div>
          <span>Vertical scale</span>
          <button
            type="button"
            aria-pressed={display === 'magnitude'}
            onClick={() => setDisplay('magnitude')}
          >
            Magnitude
          </button>
          <button
            type="button"
            aria-pressed={display === 'flux'}
            onClick={() => setDisplay('flux')}
          >
            Relative flux
          </button>
        </div>
      </div>

      <div className="plot-scroll history-plot-wrap">
        <svg
          className="science-plot history-plot"
          viewBox="0 0 780 390"
          aria-labelledby="history-svg-title history-svg-description"
        >
          <title id="history-svg-title">
            Betelgeuse visual and Johnson V brightness versus time
          </title>
          <desc id="history-svg-description">
            Historical Herschel estimates and passband-separated AAVSO
            photometry. The shaded regions are interquartile ranges within each
            time bin; breaks in the line are real gaps in the record.
          </desc>
          {magnitudeTicks.map((tick) => (
            <g key={tick}>
              <line
                className="plot-gridline"
                x1={chart.left}
                x2={chart.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text
                className="plot-tick"
                x={chart.left - 12}
                y={y(tick) + 4}
                textAnchor="end"
              >
                {valueLabel(tick)}
              </text>
            </g>
          ))}
          {xTicks.map((tick) => (
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

          {intervalPaths(visual).map((path, index) => (
            <path
              className="history-band visual"
              d={path}
              key={`visual-${index}`}
            />
          ))}
          {intervalPaths(johnsonV).map((path, index) => (
            <path
              className="history-band johnson"
              d={path}
              key={`v-${index}`}
            />
          ))}
          <path className="history-line visual" d={linePath(visual)} />
          <path className="history-line johnson" d={linePath(johnsonV)} />
          {johnsonV.map((point) => (
            <circle
              className="history-v-point"
              cx={x(point.year)}
              cy={y(point.magnitude)}
              r="2.1"
              key={`${point.mid_jd}-${point.band}`}
            />
          ))}
          {herschel.map((point) => (
            <circle
              className="history-herschel-point"
              cx={x(point.year)}
              cy={y(point.magnitude)}
              r="3.2"
              key={`${point.mid_jd}-${point.magnitude}`}
            />
          ))}

          <text
            className="plot-label"
            x={(chart.left + chart.right) / 2}
            y="378"
            textAnchor="middle"
          >
            Calendar year (received light)
          </text>
          <text
            className="plot-label"
            transform="rotate(-90 18 177)"
            x="18"
            y="177"
            textAnchor="middle"
          >
            {display === 'magnitude'
              ? 'Visual / V magnitude (brighter upward)'
              : `Relative flux F/F₀ (m₀ = ${referenceMagnitude})`}
          </text>
        </svg>
      </div>

      <div className="history-legend" aria-label="Historical plot legend">
        <span>
          <i className="herschel" /> Herschel reconstruction
        </span>
        <span>
          <i className="visual" /> AAVSO visual median + IQR
        </span>
        <span>
          <i className="johnson" /> AAVSO Johnson V median + IQR
        </span>
      </div>

      <div className="history-equations">
        <article>
          <p className="equation">
            F/F<sub>0</sub> = 10
            <sup>
              −0.4(m−m<sub>0</sub>)
            </sup>
          </p>
          <p>
            A one-magnitude increase means a factor 2.512 decrease in flux. The
            relative-flux switch is an exact magnitude conversion with m
            <sub>0</sub> = {referenceMagnitude}; it is not a physical forecast.
          </p>
        </article>
        <article>
          <p className="equation">
            m̃<sub>k</sub> = median(m<sub>i∈k</sub>), &nbsp; IQR<sub>k</sub> = Q
            <sub>3</sub>−Q<sub>1</sub>
          </p>
          <p>
            The overview uses 90-day bins; the recent panel uses 30-day bins.
            Medians suppress isolated transcription errors, while the shaded
            quartiles retain within-bin observer scatter and intrinsic change.
          </p>
        </article>
      </div>

      <div className="history-table wave-table">
        <table>
          <thead>
            <tr>
              <th>Series</th>
              <th>Epoch</th>
              <th>Underlying records</th>
              <th>Plot treatment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Herschel / Lloyd</td>
              <td>1836–1840</td>
              <td>27 estimates</td>
              <td>Individual reconstructed visual magnitudes</td>
            </tr>
            <tr>
              <td>AAVSO visual</td>
              <td>1893–2026</td>
              <td>48,378 detections</td>
              <td>Separate robust time bins; no interpolation across gaps</td>
            </tr>
            <tr>
              <td>AAVSO Johnson V</td>
              <td>1964–2026</td>
              <td>3,082 detections</td>
              <td>
                Separate filter series; never merged into visual estimates
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="history-source-note">
        Sources: <a href="https://arxiv.org/abs/2006.15403">Lloyd (2020)</a> and
        the{' '}
        <a href="https://www.aavso.org/index.php/data-access">
          AAVSO International Database
        </a>
        , AUID 000-BBK-383, retrieved 31 August 2026. The AAVSO series includes
        only detections within the documented −0.5 to 3.0 magnitude quality
        screen; 86 upper-limit or implausible rows were excluded. Visual and V
        passbands are related but not identical measurements.
      </p>
    </section>
  );
}
