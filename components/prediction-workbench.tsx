import { BlinkComparator } from '@/components/blink-comparator';
import { SpectralForecastLab } from '@/components/spectral-forecast-lab';

export function PredictionWorkbench() {
  return (
    <div className="prediction-workbench">
      <div className="analysis-grid">
        <SpectralForecastLab />
        <BlinkComparator />
      </div>

      <div className="inference-matrix">
        <article>
          <span className="evidence-tag calculated">Spectral lines</span>
          <h3>Velocity and shape diagnostics</h3>
          <p className="equation">v ≈ c(ν₀ − ν)/ν₀</p>
          <p className="equation">v̄ = Σ Iᵢvᵢ / Σ Iᵢ</p>
          <p>
            Compare centroid, FWHM, skewness, line ratios, and channel-map
            morphology. A line shift is not automatically bulk stellar motion;
            opacity and asymmetric flows must be modelled.
          </p>
        </article>
        <article>
          <span className="evidence-tag model">Likelihood</span>
          <h3>Prediction with discrepancy</h3>
          <p className="equation">
            ln L = −½ Σ[(yᵢ−mᵢ)²/(σᵢ²+s²) + ln 2π(σᵢ²+s²)]
          </p>
          <p>
            The nuisance term <var>s</var> represents excess scatter or model
            discrepancy. Without it, a precise instrument can make an incomplete
            physical model look falsely certain.
          </p>
        </article>
        <article>
          <span className="evidence-tag calculated">Forecast</span>
          <h3>Posterior predictive check</h3>
          <p className="equation">p(y*|y,M) = ∫ p(y*|θ,M)p(θ|y,M)dθ</p>
          <p>
            Hold out whole epochs, not random pixels or adjacent channels. A
            useful forecast must reproduce unseen epochs and remain calibrated
            under instrument and wavelength changes.
          </p>
        </article>
      </div>
    </div>
  );
}
