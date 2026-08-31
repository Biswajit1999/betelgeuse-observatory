'use client';

import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'motion/react';

import { siteAsset } from '@/lib/site-path';

const MAX_FRAMES = 5000;

type Frame = { name: string; url: string };

export function BlinkComparator() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [framesPerSecond, setFramesPerSecond] = useState(4);
  const [playing, setPlaying] = useState(false);
  const urls = useRef<string[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!playing || frames.length < 2 || reduceMotion) return;
    const timer = window.setInterval(
      () => setFrameIndex((current) => (current + 1) % frames.length),
      1000 / framesPerSecond,
    );
    return () => window.clearInterval(timer);
  }, [frames.length, framesPerSecond, playing, reduceMotion]);

  useEffect(
    () => () => {
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  function loadFrames(event: ChangeEvent<HTMLInputElement>) {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    const selected = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith('image/'))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      )
      .slice(0, MAX_FRAMES);
    const next = selected.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    urls.current = next.map((frame) => frame.url);
    setFrames(next);
    setFrameIndex(0);
    setPlaying(false);
  }

  const current = frames[frameIndex];
  const canBlink = frames.length > 1 && !reduceMotion;

  return (
    <article className="analysis-card blink-card">
      <div className="analysis-card-heading">
        <span className="evidence-tag calculated">Local visual comparator</span>
        <Images aria-hidden="true" size={20} />
      </div>
      <h3>Large-sequence blink comparator</h3>
      <p>
        Load up to {MAX_FRAMES.toLocaleString()} aligned PNG, JPEG, or WebP
        frames. Files remain in this browser session and are not transmitted.
      </p>

      <div className="blink-stage">
        <Image
          key={current?.url ?? 'editorial-preview'}
          src={current?.url ?? siteAsset('/observations/alma-band8-2023.png')}
          alt={
            current
              ? `Locally selected comparison frame ${frameIndex + 1}: ${current.name}`
              : 'ALMA Band 8 editorial preview used as a single-frame placeholder'
          }
          fill
          unoptimized
          sizes="(max-width: 900px) 100vw, 44vw"
        />
        <span className="blink-overlay">
          {current
            ? `${frameIndex + 1} / ${frames.length}`
            : '1 editorial frame · load a sequence'}
        </span>
      </div>

      <div className="blink-controls">
        <button
          type="button"
          onClick={() =>
            setFrameIndex(
              (index) => (index - 1 + frames.length) % frames.length,
            )
          }
          disabled={frames.length < 2}
          aria-label="Previous image frame"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          disabled={!canBlink}
          aria-label={playing ? 'Pause image blinking' : 'Play image blinking'}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          <span>{playing ? 'Pause' : 'Blink'}</span>
        </button>
        <button
          type="button"
          onClick={() => setFrameIndex((index) => (index + 1) % frames.length)}
          disabled={frames.length < 2}
          aria-label="Next image frame"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="blink-inputs">
        <label htmlFor="blink-files">Select registered image sequence</label>
        <input
          id="blink-files"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={loadFrames}
        />
        <label htmlFor="blink-rate">
          Blink rate: {framesPerSecond} frame{framesPerSecond === 1 ? '' : 's'}{' '}
          s<sup>−1</sup>
        </label>
        <input
          id="blink-rate"
          type="range"
          min="1"
          max="12"
          step="1"
          value={framesPerSecond}
          onChange={(event) => setFramesPerSecond(Number(event.target.value))}
        />
      </div>

      <div className="equation-block">
        <p className="equation">
          R(x,y) = [I₂(x,y) − I₁(x,y)] / √[σ₁²(x,y) + σ₂²(x,y)]
        </p>
        <p>
          Quantitative residuals require common astrometry, pixel scale, units,
          flux scale, and PSF/synthesised beam. This viewer intentionally
          performs visual blinking only; numerical differencing belongs in the
          FITS pipeline.
        </p>
      </div>
      <p className="analysis-source">
        The placeholder is an attributed paper figure, not a time-series datum.
        Reduced-motion mode disables automatic blinking; arrow controls remain
        available.
      </p>
    </article>
  );
}
