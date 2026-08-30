export function AuthorForecast() {
  return (
    <section
      className="atlas-section forecast-section"
      aria-labelledby="author-forecast-title"
    >
      <div className="section-index">
        <span>09</span>
        <p>Author synthesis</p>
      </div>
      <div className="section-content">
        <p className="eyebrow">Signed conditional forecast · Biswajit Jana</p>
        <h2 id="author-forecast-title">
          My working prediction: Earth is more likely to see Betelgeuse’s
          supernova on a 10<sup>5</sup>-year horizon than a 10<sup>2</sup>-year
          horizon.
        </h2>

        <div className="forecast-declaration">
          <div>
            <span className="evidence-tag model">
              Representative point forecast
            </span>
            <strong>≈ 202,026 CE</strong>
            <p>
              I adopt Δt = 200,000 years as one representative value inside the
              preferred “hundreds of thousands of years” model family. It is not
              a fitted mean, median, confidence interval, or countdown.
            </p>
          </div>
          <div className="forecast-equation">
            <span>
              t<sub>see</sub> = t<sub>receive</sub> + Δt
            </span>
            <strong>2026 + 200,000 = 202,026 CE</strong>
            <small>
              The distance cancels because Δt is conditioned on the state
              received in 2026.
            </small>
          </div>
        </div>

        <div className="forecast-branches">
          <article>
            <span className="evidence-tag calculated">
              Preferred interpretation
            </span>
            <h3>~400/416 d fundamental mode; ~2170 d companion/LSP</h3>
            <p>
              This branch is compatible with early core-helium burning and the
              independent companion interpretation. The literature horizon is
              hundreds of thousands of years. My representative 200,000-year
              point maps to approximately 202,026 CE at Earth.
            </p>
            <a href="https://arxiv.org/abs/2408.09089">
              Goldberg, Joyce & Molnár 2024
            </a>
          </article>
          <article>
            <span className="evidence-tag model">Contested alternative</span>
            <h3>~2200 d fundamental mode; late core-carbon burning</h3>
            <p>
              This branch gives a literature horizon of several dozen to several
              hundred years: an illustrative Δt = 30–300 years maps to roughly
              2056–2326 CE. The required large radius is in tension with
              angular- diameter constraints, and the companion weakens the need
              for this mode assignment.
            </p>
            <a href="https://arxiv.org/abs/2306.00287">Saio et al. 2023</a>
            <a href="https://arxiv.org/abs/2306.05600">
              Molnár, Joyce & Leung 2023 critique
            </a>
          </article>
        </div>

        <div className="forecast-boundary" role="note">
          <strong>What this prediction means</strong>
          <p>
            It predicts when a causal supernova messenger would reach Earth
            under my preferred model interpretation. It does not establish
            Betelgeuse’s inaccessible present state, and atmospheric images or
            spectra alone cannot turn this order-of-magnitude synthesis into an
            exact date.
          </p>
        </div>
        <p className="forecast-signature">— Biswajit Jana, 30 August 2026</p>
      </div>
    </section>
  );
}
