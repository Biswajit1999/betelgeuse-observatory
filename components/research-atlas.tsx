import { Activity, Binary, Radio, ScanLine, Sigma, Waves } from 'lucide-react';

import { AuthorForecast } from '@/components/author-forecast';
import { Betelgeuse3DTimeline } from '@/components/betelgeuse-3d-timeline';
import { ContourDiagnostics } from '@/components/contour-diagnostics';
import { HistoricalLightCurve } from '@/components/historical-light-curve';
import { PredictionWorkbench } from '@/components/prediction-workbench';
import { QuantitativePanels } from '@/components/quantitative-panels';
import { ScenarioSwitcher } from '@/components/scenario-switcher';

const observations = [
  {
    date: 'Aug 2023',
    publication: '19 Aug 2026',
    title: 'Persistent inner-atmosphere structure',
    body: 'Bands 6, 7, and 8 resolve a roughly 2300 K sub-millimetre photosphere, with hotter north-east and south-west regions and changed molecular gas since 2015.',
    href: 'https://arxiv.org/abs/2608.19339',
    source: 'Dent et al. 2026',
    icon: Radio,
  },
  {
    date: '2021-2026',
    publication: '3 Aug 2026',
    title: 'A radio atmosphere perturbed in phase',
    body: 'Seven VLA/ALMA frequencies trace different atmospheric radii. Ellipticity correlates with the proposed companion orbital phase.',
    href: 'https://arxiv.org/abs/2608.02847',
    source: 'Matthews et al. 2026',
    icon: Waves,
  },
  {
    date: '6 Dec 2024',
    publication: '19 Aug 2026',
    title: 'A directly imaged companion candidate',
    body: 'ESO reports a 6.1 sigma PACO-ASDI detection at 52.32 +/- 0.18 mas in SPHERE-ZIMPOL programme 114.28H9.',
    href: 'https://archive.eso.org/cms/eso-archive-news/release-of-sphere-data-betelgeuse.html',
    source: 'ESO archive release',
    icon: Binary,
  },
];

const wavebands = [
  ['UV', 'HST STIS/GHRS', 'chromosphere and wind', 'archive spectrum'],
  [
    'Optical',
    'AAVSO / resolved imaging',
    'photosphere and dust attenuation',
    'photometry / imaging',
  ],
  [
    'Near-IR',
    'interferometry',
    'molecular layers and photosphere',
    'archive-dependent',
  ],
  [
    '223.55 GHz',
    'ALMA Band 6',
    'larger sub-mm optical-depth surface',
    'observed Aug 2023',
  ],
  ['337.99 GHz', 'ALMA Band 7', 'inner sub-mm atmosphere', 'observed Aug 2023'],
  [
    '485.22 GHz',
    'ALMA Band 8',
    'deeper, smaller sub-mm surface',
    'observed 1 Aug 2023',
  ],
  [
    '22-136 GHz',
    'VLA + ALMA',
    'extended radio atmosphere',
    'observed 2021-2026',
  ],
];

export function ResearchAtlas() {
  return (
    <div className="atlas">
      <section className="atlas-section" aria-labelledby="latest-title">
        <div className="section-index">
          <span>01</span>
          <p>What we actually see</p>
        </div>
        <div className="section-content">
          <p className="eyebrow">Latest received evidence</p>
          <h2 id="latest-title">
            A living atmosphere, resolved across time and wavelength.
          </h2>
          <div className="observation-grid">
            {observations.map((item) => {
              const Icon = item.icon;
              return (
                <article className="observation-card" key={item.title}>
                  <Icon aria-hidden="true" />
                  <span className="evidence-tag measured">Measured</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <dl>
                    <div>
                      <dt>Observed</dt>
                      <dd>{item.date}</dd>
                    </div>
                    <div>
                      <dt>Published</dt>
                      <dd>{item.publication}</dd>
                    </div>
                  </dl>
                  <a href={item.href}>{item.source}</a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="atlas-section" aria-labelledby="wave-title">
        <div className="section-index">
          <span>02</span>
          <p>The star in many wavelengths</p>
        </div>
        <div className="section-content">
          <p className="eyebrow">
            <ScanLine aria-hidden="true" size={14} /> Observational layers
          </p>
          <h2 id="wave-title">
            These are different measurements, not colour filters.
          </h2>
          <p className="section-deck">
            Frequency changes optical depth, resolution, emitting layer, and
            instrument response. Every comparison must carry that metadata.
          </p>
          <section
            className="wave-table"
            aria-label="Multi-wavelength observation modes"
          >
            <table>
              <thead>
                <tr>
                  <th>Mode</th>
                  <th>Instrument</th>
                  <th>Approximate layer</th>
                  <th>Product status</th>
                </tr>
              </thead>
              <tbody>
                {wavebands.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell) => (
                      <td key={cell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </section>

      <section className="atlas-section" aria-labelledby="quantitative-title">
        <div className="section-index">
          <span>03</span>
          <p>Quantitative evidence</p>
        </div>
        <div className="section-content">
          <p className="eyebrow">
            <Sigma aria-hidden="true" size={14} /> Published measurements +
            reproducible equations
          </p>
          <h2 id="quantitative-title">
            Measure the trend. State what it does—and does not—imply.
          </h2>
          <p className="section-deck">
            The plots below use the three published ALMA 2023
            integrated-continuum measurements. Error bars are measurement
            uncertainties; fitted curves are calculated quantities.
          </p>
          <QuantitativePanels />
          <HistoricalLightCurve />
          <ContourDiagnostics />
        </div>
      </section>

      <section className="atlas-section" aria-labelledby="prediction-title">
        <div className="section-index">
          <span>04</span>
          <p>Prediction workbench</p>
        </div>
        <div className="section-content">
          <p className="eyebrow">
            <Activity aria-hidden="true" size={14} /> Spectra + image sequences
          </p>
          <h2 id="prediction-title">
            Forecast observables, then test them on held-out epochs.
          </h2>
          <p className="section-deck">
            The workbench separates a quantitative interpolation that can be run
            now from image and line diagnostics that require calibrated,
            registered archive products. It never converts atmospheric novelty
            into an unsupported explosion probability.
          </p>
          <PredictionWorkbench />
        </div>
      </section>

      <section
        className="atlas-section scenario-section"
        aria-labelledby="clock-title"
      >
        <div className="section-index">
          <span>05</span>
          <p>Evolutionary clock</p>
        </div>
        <div className="section-content">
          <p className="eyebrow">
            <Activity aria-hidden="true" size={14} /> Assumption switch
          </p>
          <h2 id="clock-title">One star. Two incompatible clocks.</h2>
          <p className="section-deck">
            The disagreement is scientifically useful only when the pulsation
            assignments and companion interpretation stay visible.
          </p>
          <ScenarioSwitcher />
          <div className="high-level-equations">
            <article>
              <span className="evidence-tag model">Asteroseismic scaling</span>
              <p className="equation">
                P<sub>n</sub> = Q<sub>n</sub> √[R³/(GM)]
              </p>
              <p>
                The mode constant Q<sub>n</sub> depends on radial order and
                stellar structure. Assigning 416 d or 2200 d to the fundamental
                therefore changes the inferred radius and evolutionary state;
                the periods cannot be swapped without recomputing the stellar
                model.
              </p>
            </article>
            <article>
              <span className="evidence-tag calculated">Observed ratio</span>
              <p className="equation">
                P<sub>LSP</sub>/P<sub>FM</sub> ≈ 2170/416 = 5.22
              </p>
              <p>
                A companion orbit naturally supplies a slow clock independent of
                radial acoustic pulsation. This is why identifying every long
                period as a pulsation is not a neutral assumption.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="atlas-section" aria-labelledby="inference-title">
        <div className="section-index">
          <span>06</span>
          <p>Statistical inference</p>
        </div>
        <div className="section-content">
          <p className="eyebrow">
            <Sigma aria-hidden="true" size={14} /> Inference begins with a
            generative assumption
          </p>
          <h2 id="inference-title">
            Compatibility is conditional, not clairvoyant.
          </h2>
          <div className="pipeline" aria-label="Statistical inference workflow">
            {[
              'Received observables',
              'Provenance + units',
              'Null hypothesis',
              'Likelihood + residuals',
              'Posterior checks',
              'Sensitivity analysis',
            ].map((step, index) => (
              <div key={step}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
          <div className="know-grid">
            <div>
              <span className="evidence-tag calculated">
                Defensible statement
              </span>
              <p>
                “These measurements are more compatible with scenario A under
                the stated likelihood, priors, and pulsation assignment.”
              </p>
            </div>
            <div>
              <span className="evidence-tag model">Not identifiable</span>
              <p>
                “A remote core-collapse event occurred at a coordinate time from
                which no causal signal has reached Earth.”
              </p>
            </div>
          </div>
          <div className="inference-note">
            <p className="equation">
              p(M<sub>k</sub>|y) ∝ p(y|M<sub>k</sub>) p(M<sub>k</sub>)
            </p>
            <p>
              Model-family weights are conditional on the prior, likelihood,
              data selection, and discrepancy model. Report sensitivity to each;
              never print a scenario percentage without those ingredients.
            </p>
          </div>
        </div>
      </section>

      <section className="atlas-section" aria-labelledby="watch-title">
        <div className="section-index">
          <span>07</span>
          <p>Core-collapse watch</p>
        </div>
        <div className="section-content watch-grid">
          <div>
            <p className="eyebrow">Neutrino watch</p>
            <h2 id="watch-title">
              The final-hours messenger comes from the core.
            </h2>
          </div>
          <div className="watch-copy">
            <p>
              Surface light constrains atmosphere and pulsation. Evolutionary
              models provide conditional long-range inference. A genuine
              late-stage warning is more directly tied to rising pre-supernova
              neutrino emission.
            </p>
            <a href="https://arxiv.org/abs/2205.09881">
              Super-Kamiokande pre-supernova alert study
            </a>
            <div className="watch-equation">
              <p className="equation">
                Φ<sub>ν</sub>(E,t) = L<sub>ν</sub>(t) f(E,t) / [4πD² ⟨E
                <sub>ν</sub>⟩]
              </p>
              <p>
                Detector counts fold this flux through cross-section, target
                mass, efficiency, threshold, and background. A pre-supernova
                alert is a near-term messenger calculation, not a centuries-long
                optical forecast.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="atlas-section" aria-labelledby="simulation-title">
        <div className="section-index">
          <span>08</span>
          <p>Supernova laboratory</p>
        </div>
        <div className="section-content">
          <p className="eyebrow">GPU-accelerated conditional forward model</p>
          <h2 id="simulation-title">
            Evolution through 3026 CE, with every assumption exposed.
          </h2>
          <p className="section-deck">
            The default branch renders atmospheric evolution without inserting a
            supernova through 3026 CE. A separate disputed branch lets the
            observer impose an arrival epoch from 2056–2326 CE and follow shock
            breakout, free expansion, wind-driven deceleration, and the
            transition from young to evolved supernova remnant.
          </p>
          <Betelgeuse3DTimeline />
        </div>
      </section>
      <AuthorForecast />
    </div>
  );
}
