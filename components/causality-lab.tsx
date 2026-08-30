'use client';

import { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Slider } from '@/components/ui/slider';

const LIGHT_YEARS_PER_PARSEC = 3.26156;

function yearLabel(year: number) {
  const rounded = Math.round(year);
  return rounded > 0 ? `${rounded} CE` : `${Math.abs(rounded - 1)} BCE`;
}

export function CausalityLab() {
  const [distance, setDistance] = useState(172);
  const [remaining, setRemaining] = useState(300);
  const reduceMotion = useReducedMotion();
  const receiveYear = 2026;
  const result = useMemo(() => {
    const lightTime = distance * LIGHT_YEARS_PER_PARSEC;
    const emissionYear = receiveYear - lightTime;
    return {
      lightTime,
      emissionYear,
      collapseYear: emissionYear + remaining,
      arrivalYear: receiveYear + remaining,
    };
  }, [distance, remaining]);
  const timeline = useMemo(() => {
    const minimum = Math.floor((result.emissionYear - 80) / 200) * 200;
    const maximum = Math.ceil((result.arrivalYear + 80) / 200) * 200;
    const position = (year: number) =>
      72 + ((year - minimum) / (maximum - minimum)) * 616;
    const ticks = Array.from(
      { length: Math.floor((maximum - minimum) / 200) + 1 },
      (_, index) => minimum + index * 200,
    );
    return { position, ticks };
  }, [result.arrivalYear, result.emissionYear]);

  return (
    <section
      id="causality-lab"
      className="lab-shell"
      aria-labelledby="causality-title"
    >
      <div className="lab-heading">
        <div>
          <p className="eyebrow">
            <Calculator aria-hidden="true" size={14} /> Causality scenario tool
          </p>
          <h2 id="causality-title">Distance changes the past epoch we see.</h2>
        </div>
        <p>
          It does not subtract from a remaining-lifetime prediction conditioned
          on that observed state.
        </p>
      </div>
      <div className="lab-grid">
        <form className="controls" onSubmit={(event) => event.preventDefault()}>
          <div className="control-group">
            <div className="control-label">
              <label htmlFor="distance-slider">Distance model</label>
              <motion.output
                key={distance}
                initial={reduceMotion ? false : { opacity: 0.35 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                htmlFor="distance-slider"
              >
                {distance} pc
              </motion.output>
            </div>
            <Slider
              id="distance-slider"
              min={140}
              max={220}
              step={1}
              value={[distance]}
              onValueChange={(value) =>
                setDistance(typeof value === 'number' ? value : value[0])
              }
              aria-label="Distance to Betelgeuse in parsecs"
            />
            <p>Default posterior: 172 pc, with +13 / -11 pc uncertainty.</p>
          </div>
          <div className="control-group">
            <div className="control-label">
              <label htmlFor="lifetime-slider">
                Assumed lifetime after observed state
              </label>
              <motion.output
                key={remaining}
                initial={reduceMotion ? false : { opacity: 0.35 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                htmlFor="lifetime-slider"
              >
                {remaining} years
              </motion.output>
            </div>
            <Slider
              id="lifetime-slider"
              min={0}
              max={1000}
              step={10}
              value={[remaining]}
              onValueChange={(value) =>
                setRemaining(typeof value === 'number' ? value : value[0])
              }
              aria-label="Assumed remaining stellar lifetime in years"
            />
            <p>This is a scenario input, not a measured countdown.</p>
          </div>
          <div className="model-note" role="note">
            <Info aria-hidden="true" size={18} />
            <p>
              The coordinate collapse year is frame-dependent. The signal
              arrival year is the observable prediction.
            </p>
          </div>
        </form>

        <div
          className="calculation-panel"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="calculation-grid">
            <Result
              label="Photon emission epoch"
              value={yearLabel(result.emissionYear)}
              kind="calculated"
            />
            <Result
              label="Coordinate collapse year"
              value={yearLabel(result.collapseYear)}
              kind="model"
            />
            <Result
              label="Signal arrival year"
              value={yearLabel(result.arrivalYear)}
              kind="calculated"
            />
          </div>
          <div className="derivation">
            <p>
              <span>
                <var>D</var>/<var>c</var>
              </span>{' '}
              = {distance} pc × {LIGHT_YEARS_PER_PARSEC} yr pc<sup>−1</sup> ={' '}
              <strong>{result.lightTime.toFixed(1)} yr</strong>
            </p>
            <p>
              <span>
                t<sub>emit</sub>
              </span>{' '}
              = {receiveYear} - {result.lightTime.toFixed(1)} ={' '}
              <strong>{result.emissionYear.toFixed(1)}</strong>
            </p>
            <p>
              <span>
                t<sub>collapse</sub>
              </span>{' '}
              = {result.emissionYear.toFixed(1)} + {remaining} ={' '}
              <strong>{result.collapseYear.toFixed(1)}</strong>
            </p>
            <p>
              <span>
                t<sub>arrival</sub>
              </span>{' '}
              = {result.emissionYear.toFixed(1)} + {remaining} +{' '}
              {result.lightTime.toFixed(1)} ={' '}
              <strong>{result.arrivalYear.toFixed(1)}</strong>
            </p>
            <p className="cancellation">
              <span>
                t<sub>arrival</sub>
              </span>{' '}
              = {receiveYear} + {remaining} ={' '}
              <strong>{result.arrivalYear}</strong>
            </p>
            <p className="cancellation">
              <span>
                ∂t<sub>arrival</sub>/∂D
              </span>{' '}
              = −1/c + 1/c = <strong>0</strong>
            </p>
          </div>
          <figure className="causality-timeline">
            <div className="timeline-scroll">
              <svg
                viewBox="0 0 760 250"
                aria-labelledby="timeline-title timeline-description"
              >
                <title id="timeline-title">
                  Causality timeline for the selected distance and remaining
                  lifetime
                </title>
                <desc id="timeline-description">
                  The observed photons leave Betelgeuse at year{' '}
                  {result.emissionYear.toFixed(0)} and arrive at Earth in 2026.
                  Under the selected scenario, collapse occurs at coordinate
                  year {result.collapseYear.toFixed(0)} and its signal arrives
                  in {result.arrivalYear}.
                </desc>
                <line
                  className="timeline-axis"
                  x1="72"
                  x2="688"
                  y1="126"
                  y2="126"
                />
                {timeline.ticks.map((tick) => (
                  <g key={tick}>
                    <line
                      className="timeline-tick"
                      x1={timeline.position(tick)}
                      x2={timeline.position(tick)}
                      y1="120"
                      y2="132"
                    />
                    <text
                      className="timeline-tick-label"
                      x={timeline.position(tick)}
                      y="115"
                      textAnchor="middle"
                    >
                      {tick}
                    </text>
                  </g>
                ))}
                <line
                  className="timeline-photon"
                  x1={timeline.position(result.emissionYear)}
                  x2={timeline.position(receiveYear)}
                  y1="91"
                  y2="91"
                />
                <text
                  className="timeline-path-label"
                  x={
                    (timeline.position(result.emissionYear) +
                      timeline.position(receiveYear)) /
                    2
                  }
                  y="80"
                  textAnchor="middle"
                >
                  received photon: D/c = {result.lightTime.toFixed(0)} yr
                </text>
                <line
                  className="timeline-evolution"
                  x1={timeline.position(result.emissionYear)}
                  x2={timeline.position(result.collapseYear)}
                  y1="194"
                  y2="194"
                />
                <text
                  className="timeline-path-label"
                  x={
                    (timeline.position(result.emissionYear) +
                      timeline.position(result.collapseYear)) /
                    2
                  }
                  y="212"
                  textAnchor="middle"
                >
                  assumed evolution: Δt = {remaining} yr
                </text>
                <line
                  className="timeline-signal"
                  x1={timeline.position(result.collapseYear)}
                  x2={timeline.position(result.arrivalYear)}
                  y1="229"
                  y2="229"
                />
                <text
                  className="timeline-path-label"
                  x={
                    (timeline.position(result.collapseYear) +
                      timeline.position(result.arrivalYear)) /
                    2
                  }
                  y="246"
                  textAnchor="middle"
                >
                  future signal: D/c
                </text>
                <TimelineEvent
                  x={timeline.position(result.emissionYear)}
                  year={result.emissionYear}
                  label="Emission state"
                  row="top"
                  kind="measured"
                />
                <TimelineEvent
                  x={timeline.position(result.collapseYear)}
                  year={result.collapseYear}
                  label="Coordinate collapse"
                  row="bottom"
                  kind="model"
                />
                <TimelineEvent
                  x={timeline.position(receiveYear)}
                  year={receiveYear}
                  label="Receive now"
                  row="top"
                  kind="receive"
                />
                <TimelineEvent
                  x={timeline.position(result.arrivalYear)}
                  year={result.arrivalYear}
                  label="Signal arrival"
                  row="bottom"
                  kind="calculated"
                />
              </svg>
            </div>
            <figcaption>
              <strong>Qualitative reading:</strong> distance shifts the two
              Betelgeuse-coordinate dates together. It does not shift the
              signal-arrival date when Δt is conditioned on the state received
              in {receiveYear}.
            </figcaption>
          </figure>
          <p className="cancellation-copy">
            Change the distance: the emission and coordinate-collapse years
            move, but the Earth waiting time remains {remaining} years.
          </p>
        </div>
      </div>
    </section>
  );
}

function Result({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: 'calculated' | 'model';
}) {
  return (
    <div className="result-cell">
      <span className={`evidence-tag ${kind}`}>
        {kind === 'model' ? 'Model' : 'Calculated'}
      </span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function TimelineEvent({
  x,
  year,
  label,
  row,
  kind,
}: {
  x: number;
  year: number;
  label: string;
  row: 'top' | 'bottom';
  kind: 'measured' | 'model' | 'receive' | 'calculated';
}) {
  const labelY = row === 'top' ? 24 : 151;
  const yearY = row === 'top' ? 41 : 168;
  return (
    <g className={`timeline-event ${kind}`}>
      <line
        x1={x}
        x2={x}
        y1={row === 'top' ? 48 : 126}
        y2={row === 'top' ? 126 : 145}
      />
      <circle cx={x} cy="126" r="5" />
      <text x={x} y={labelY} textAnchor="middle">
        {label}
      </text>
      <text x={x} y={yearY} textAnchor="middle">
        {yearLabel(year)}
      </text>
    </g>
  );
}
