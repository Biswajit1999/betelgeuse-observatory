'use client';

import { useMemo, useState } from 'react';
import { Activity } from 'lucide-react';

import { Slider } from '@/components/ui/slider';

const AMPLITUDE_JY = 0.517685878;
const REFERENCE_GHZ = 337.99;
const SPECTRAL_INDEX = 1.493573928;
const SPECTRAL_INDEX_SIGMA = 0.13334947;

const measurements = [
  { frequency: 223.55, observed: 0.28, sigma: 0.014 },
  { frequency: 337.99, observed: 0.51, sigma: 0.04 },
  { frequency: 485.22, observed: 0.9, sigma: 0.09 },
];

function fluxAt(frequency: number, index = SPECTRAL_INDEX) {
  return AMPLITUDE_JY * (frequency / REFERENCE_GHZ) ** index;
}

export function SpectralForecastLab() {
  const [frequency, setFrequency] = useState(400);
  const forecast = useMemo(() => {
    const central = fluxAt(frequency);
    const endpoints = [
      fluxAt(frequency, SPECTRAL_INDEX - SPECTRAL_INDEX_SIGMA),
      fluxAt(frequency, SPECTRAL_INDEX + SPECTRAL_INDEX_SIGMA),
    ].sort((a, b) => a - b);
    return { central, lower: endpoints[0], upper: endpoints[1] };
  }, [frequency]);

  return (
    <article className="analysis-card spectral-forecast">
      <div className="analysis-card-heading">
        <span className="evidence-tag model">Conditional prediction</span>
        <Activity aria-hidden="true" size={20} />
      </div>
      <h3>Continuum interpolation laboratory</h3>
      <p>
        Predict integrated flux only inside the measured 223.55–485.22 GHz
        interval, assuming the fitted power law remains valid.
      </p>

      <div className="forecast-control">
        <div className="control-label">
          <label htmlFor="forecast-frequency">Evaluation frequency</label>
          <output htmlFor="forecast-frequency">
            {frequency.toFixed(0)} GHz
          </output>
        </div>
        <Slider
          id="forecast-frequency"
          min={224}
          max={485}
          step={1}
          value={[frequency]}
          onValueChange={(value) =>
            setFrequency(typeof value === 'number' ? value : value[0])
          }
          aria-label="Continuum interpolation frequency in gigahertz"
        />
      </div>

      <div className="forecast-readout" aria-live="polite" aria-atomic="true">
        <span>Modelled integrated flux</span>
        <strong>{forecast.central.toFixed(3)} Jy</strong>
        <small>
          {forecast.lower.toFixed(3)}–{forecast.upper.toFixed(3)} Jy from slope
          uncertainty alone
        </small>
      </div>

      <div className="equation-block">
        <p className="equation">
          S<sub>ν</sub>(ν*) = 0.518 [ν*/337.99]<sup>1.494</sup> Jy
        </p>
        <p>
          This band varies only α by ±0.133. It excludes normalization
          covariance, calibration systematics, intrinsic variability, and model
          discrepancy; it is not a full posterior-predictive interval.
        </p>
      </div>

      <div className="residual-table">
        <h4>In-sample standardized residuals</h4>
        <table>
          <thead>
            <tr>
              <th>ν</th>
              <th>Observed</th>
              <th>Model</th>
              <th>(O−M)/σ</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((point) => {
              const model = fluxAt(point.frequency);
              return (
                <tr key={point.frequency}>
                  <td>{point.frequency.toFixed(2)} GHz</td>
                  <td>{point.observed.toFixed(2)} Jy</td>
                  <td>{model.toFixed(3)} Jy</td>
                  <td>{((point.observed - model) / point.sigma).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="analysis-source">
        Measurements:{' '}
        <a href="https://arxiv.org/abs/2608.19339">Dent et al. 2026</a>. This
        interpolation describes the received sub-mm atmosphere; it does not
        determine the core-burning stage.
      </p>
    </article>
  );
}
