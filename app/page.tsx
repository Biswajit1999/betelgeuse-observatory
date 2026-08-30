import Image from 'next/image';
import { ArrowDown, Database, Telescope } from 'lucide-react';

import { CausalityLab } from '@/components/causality-lab';
import { LightSignal } from '@/components/light-signal';
import { ResearchAtlas } from '@/components/research-atlas';

export default function Home() {
  return (
    <main id="main-content" className="min-h-dvh overflow-x-hidden">
      <a className="skip-link" href="#causality-lab">
        Skip to the causality lab
      </a>
      <header className="site-header">
        <a
          className="wordmark"
          href="#top"
          aria-label="Betelgeuse Observatory home"
        >
          <span className="wordmark-mark" aria-hidden="true" />
          <span>Betelgeuse Observatory</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#observations">Observations</a>
          <a href="#causality-lab">Causality</a>
          <a href="#methods">Methods</a>
        </nav>
      </header>

      <section id="top" className="hero-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">A causal, data-first stellar observatory</p>
          <h1 id="hero-title">
            Are we looking at a star that has <em>already died?</em>
          </h1>
          <p className="hero-deck">
            We see Betelgeuse through its past light cone. The newest
            high-resolution data show a living, dynamic red-supergiant
            atmosphere - not an observed supernova.
          </p>
          <div
            className="verdict"
            role="note"
            aria-label="Current scientific verdict"
          >
            <span className="status-dot" aria-hidden="true" />
            <span>
              <strong>Current verdict</strong>No core collapse has been
              observed. The inaccessible remote state is unknowable until a
              causal signal arrives.
            </span>
          </div>
          <a className="primary-link" href="#causality-lab">
            Test the light-time geometry{' '}
            <ArrowDown aria-hidden="true" size={17} />
          </a>
        </div>

        <figure className="observation-frame" id="observations">
          <div className="observation-toolbar">
            <span className="evidence-tag measured">Measured</span>
            <span>ALMA Band 8 · 485.22 GHz</span>
          </div>
          <div className="image-stage">
            <Image
              src="/observations/alma-band8-2023.png"
              alt="ALMA Band 8 continuum map of Betelgeuse observed in August 2023, showing a resolved asymmetric sub-millimetre photosphere"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
            />
          </div>
          <figcaption>
            <span>
              <Telescope aria-hidden="true" size={15} /> Observed 1 Aug 2023
            </span>
            <span>
              <Database aria-hidden="true" size={15} /> Published 19 Aug 2026
            </span>
            <a href="https://arxiv.org/abs/2608.19339">Dent et al. 2026</a>
          </figcaption>
        </figure>
      </section>

      <section className="light-time-strip" aria-label="Two time concepts">
        <div>
          <span className="kicker">Earth receiver time</span>
          <strong>2026</strong>
          <small>the date information reaches us</small>
        </div>
        <div className="signal-line" aria-hidden="true">
          <LightSignal />
        </div>
        <div>
          <span className="kicker">Photon emission epoch</span>
          <strong>about 1465 CE</strong>
          <small>for the default 172 pc model</small>
        </div>
      </section>

      <CausalityLab />

      <ResearchAtlas />

      <section id="methods" className="method-note">
        <p className="eyebrow">Scientific boundary</p>
        <h2>
          Inference can compare received evidence. It cannot cross our past
          light cone.
        </h2>
        <p>
          Every later model in this repository is required to separate measured
          observables, calculated quantities, simulations, model-dependent
          claims, and speculation.
        </p>
      </section>
      <footer className="site-footer">
        <div>
          <span className="kicker">Research author and project lead</span>
          <strong>Biswajit Jana</strong>
        </div>
        <p>
          Betelgeuse Observatory · quantitative stellar inference, reproducible
          methods, and explicitly conditional forecasts.
        </p>
        <nav aria-label="Footer navigation">
          <a href="#author-forecast-title">Author forecast</a>
          <a href="https://arxiv.org/abs/2006.09837">Primary literature</a>
          <a href="#methods">Scientific boundary</a>
        </nav>
      </footer>
    </main>
  );
}
