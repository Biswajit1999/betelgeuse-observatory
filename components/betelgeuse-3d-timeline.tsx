'use client';

import { Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import { siteAsset } from '@/lib/site-path';

type Scenario = 'preferred' | 'conditional';
type Quality = 'high' | 'efficient';
type ObservationLayer = 'near-ir' | 'alma-band7';

type HydroParameters = {
  viscosity: number;
  diffusivity: number;
  cooling: number;
  driving: number;
};

type HydroStats = {
  meanTemperature: number;
  temperatureRms: number;
  velocityRms: number;
  soundSpeed: number;
  mach: number;
  densityContrast: number;
  convectiveFlux: number;
  simulationTime: number;
  physicalTimeDays: number;
  stepCount: number;
};

const START_YEAR = 2026;
const END_YEAR = 2526;
const DEFAULT_COLLAPSE_YEAR = 2176;
const DISTANCE_PC = 172;
const STELLAR_MASS_SOLAR = 17.5;
const NEAR_IR_DIAMETER_MAS = 42.49;
const NEAR_IR_TEMPERATURE_K = 3690;
const ALMA_DIAMETER_MAS = 57.74;
const ALMA_TEMPERATURE_K = 2300;
const ALMA_HOTSPOT_ENHANCEMENT_K = 800;
const NEAR_IR_RADIUS_AU = (NEAR_IR_DIAMETER_MAS / 1000) * DISTANCE_PC * 0.5;
const ALMA_RADIUS_AU = (ALMA_DIAMETER_MAS / 1000) * DISTANCE_PC * 0.5;
const ALMA_TO_NEAR_IR_RADIUS = ALMA_DIAMETER_MAS / NEAR_IR_DIAMETER_MAS;
const SOLAR_RADIUS_AU = 0.00465047;
const NEAR_IR_RADIUS_SOLAR = NEAR_IR_RADIUS_AU / SOLAR_RADIUS_AU;
const SURFACE_GRAVITY_MS2 =
  (6.6743e-11 * STELLAR_MASS_SOLAR * 1.98847e30) /
  (NEAR_IR_RADIUS_AU * 1.495978707e11) ** 2;
const LOG_G_CGS = Math.log10(SURFACE_GRAVITY_MS2 * 100);
const ESCAPE_VELOCITY_KM_S =
  Math.sqrt(
    (2 * 6.6743e-11 * STELLAR_MASS_SOLAR * 1.98847e30) /
      (NEAR_IR_RADIUS_AU * 1.495978707e11),
  ) / 1000;
const STEFAN_BOLTZMANN_LUMINOSITY_SOLAR =
  NEAR_IR_RADIUS_SOLAR ** 2 * (NEAR_IR_TEMPERATURE_K / 5772) ** 4;
const EJECTA_VELOCITY_KM_S = 5000;
const EJECTA_WIND_TRANSITION_YEARS = 10;
const EJECTA_EXPANSION_INDEX = 0.875;
const PC_IN_KM = 3.085677581e13;
const SECONDS_PER_YEAR = 31_557_600;
const DEFAULT_HYDRO_PARAMETERS: HydroParameters = {
  viscosity: 0.035,
  diffusivity: 0.025,
  cooling: 0.045,
  driving: 0.62,
};
const DEFAULT_HYDRO_STATS: HydroStats = {
  meanTemperature: NEAR_IR_TEMPERATURE_K,
  temperatureRms: 0,
  velocityRms: 0,
  soundSpeed: 6.25,
  mach: 0,
  densityContrast: 1,
  convectiveFlux: 0,
  simulationTime: 0,
  physicalTimeDays: 0,
  stepCount: 0,
};

const vertexShader = `
  uniform float uTime;
  uniform float uActivity;
  uniform float uRadialScale;
  uniform sampler2D uHydroMap;
  varying vec3 vNormalWorld;
  varying vec3 vPosition;
  varying vec3 vObjectDirection;
  varying float vNoise;
  varying vec4 vHydro;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise3(p);
      p = p * 2.03 + vec3(7.1, 3.7, 5.4);
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec3 direction = normalize(position);
    vec4 hydro = texture2D(uHydroMap, uv);
    float radialVelocity = hydro.g * 2.0 - 1.0;
    float densityPerturbation = hydro.b * 2.0 - 1.0;
    float broad = fbm(direction * 2.25 + vec3(uTime * 0.018, -uTime * 0.012, 0.0));
    float detail = fbm(direction * 7.0 - vec3(0.0, uTime * 0.028, uTime * 0.014));
    float displacement = (broad - 0.48) * 0.026 + (detail - 0.5) * 0.009;
    displacement += radialVelocity * 0.072 - densityPerturbation * 0.018;
    displacement *= uRadialScale * (0.9 + uActivity * 0.12);
    displacement = clamp(displacement, -0.11, 0.11);
    vec3 displaced = position + normal * displacement;
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vNoise = broad * 0.88 + detail * 0.12;
    vHydro = hydro;
    vObjectDirection = direction;
    vPosition = worldPosition.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform float uActivity;
  uniform float uOpacity;
  uniform float uLayerMode;
  uniform float uTemperatureBase;
  uniform float uTemperatureSpan;
  uniform float uHotspotEnhancement;
  uniform float uLimbExponent;
  varying vec3 vNormalWorld;
  varying vec3 vPosition;
  varying vec3 vObjectDirection;
  varying float vNoise;
  varying vec4 vHydro;

  float planckRatio(float wavelengthNm, float temperatureK) {
    float referenceNm = 700.0;
    float c2NmK = 1.4387769e7;
    float xReference = c2NmK / (referenceNm * temperatureK);
    float x = c2NmK / (wavelengthNm * temperatureK);
    return pow(referenceNm / wavelengthNm, 5.0) *
      (exp(xReference) - 1.0) / (exp(x) - 1.0);
  }

  vec3 continuumColour(float temperatureK) {
    return vec3(
      1.0,
      planckRatio(546.0, temperatureK) * 0.72,
      planckRatio(435.0, temperatureK) * 0.42
    );
  }

  vec3 radioFalseColour(float normalizedTemperature) {
    vec3 low = vec3(0.12, 0.006, 0.002);
    vec3 middle = vec3(0.82, 0.085, 0.008);
    vec3 high = vec3(1.0, 0.63, 0.12);
    float split = smoothstep(0.0, 0.62, normalizedTemperature);
    vec3 lower = mix(low, middle, split);
    return mix(lower, high, smoothstep(0.58, 1.0, normalizedTemperature));
  }

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float facing = max(dot(normalize(vNormalWorld), viewDirection), 0.0);
    float limb = pow(max(facing, 0.0001), uLimbExponent);
    float temperaturePerturbation = vHydro.r * 2.0 - 1.0;
    float upflow = vHydro.g * 2.0 - 1.0;
    float flowSpeed = vHydro.a;
    float hydroStructure = temperaturePerturbation * 0.88 + (vNoise - 0.5) * 0.24;

    vec3 northEast = normalize(vec3(-0.42, 0.48, 0.77));
    vec3 southWest = normalize(vec3(0.42, -0.48, 0.77));
    float northEastSpot = exp(-18.0 * (1.0 - dot(vObjectDirection, northEast)));
    float southWestSpot = exp(-24.0 * (1.0 - dot(vObjectDirection, southWest)));
    float observedHotStructure = 0.78 * northEastSpot + 0.46 * southWestSpot;

    float temperatureK = uTemperatureBase +
      hydroStructure * uTemperatureSpan * (0.88 + 0.12 * uActivity);
    if (uLayerMode > 0.5) {
      temperatureK += observedHotStructure * uHotspotEnhancement;
    }

    float thermalIntensity = pow(temperatureK / uTemperatureBase, 4.0);
    vec3 colour = continuumColour(temperatureK);
    if (uLayerMode > 0.5) {
      float normalizedRadioTemperature = clamp((temperatureK - 1700.0) / 1500.0, 0.0, 1.0);
      colour = radioFalseColour(normalizedRadioTemperature);
    }

    // Preserve chromatic and cell contrast instead of clipping the hotter
    // near-infrared continuum to a featureless white display surface.
    colour *= mix(0.54, 1.0, uLayerMode);

    float laneSuppression = 1.0 - 0.16 * flowSpeed * (0.5 - 0.5 * upflow);
    colour *= thermalIntensity * laneSuppression * (0.28 + 0.72 * limb);
    colour += vec3(0.05, 0.008, 0.001) * pow(1.0 - facing, 2.5);

    gl_FragColor = vec4(colour, uOpacity);
  }
`;

const shellVertexShader = `
  uniform float uTime;
  varying vec3 vNormalWorld;
  varying float vFilament;

  float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 d = normalize(position);
    float cell = hash(floor(d * 28.0 + uTime * 0.04));
    float displacement = (cell - 0.5) * 0.32;
    vec3 p = position + normal * displacement;
    vFilament = cell;
    vNormalWorld = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const shellFragmentShader = `
  uniform float uOpacity;
  varying vec3 vNormalWorld;
  varying float vFilament;

  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormalWorld), vec3(0.0, 0.0, 1.0))), 2.1);
    float filament = smoothstep(0.50, 0.86, vFilament);
    vec3 colour = mix(vec3(0.95, 0.055, 0.004), vec3(1.0, 0.72, 0.20), filament);
    float alpha = (rim * 0.72 + filament * 0.20) * uOpacity;
    gl_FragColor = vec4(colour, alpha);
  }
`;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(255,246,210,1)');
  gradient.addColorStop(0.08, 'rgba(255,178,52,.96)');
  gradient.addColorStop(0.32, 'rgba(255,42,2,.38)');
  gradient.addColorStop(1, 'rgba(255,20,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ejectaRadiusPc(elapsedYears: number) {
  if (elapsedYears <= 0) return 0;
  const freeExpansionRadiusPc =
    (Math.min(elapsedYears, EJECTA_WIND_TRANSITION_YEARS) *
      SECONDS_PER_YEAR *
      EJECTA_VELOCITY_KM_S) /
    PC_IN_KM;
  if (elapsedYears <= EJECTA_WIND_TRANSITION_YEARS) {
    return freeExpansionRadiusPc;
  }
  return (
    freeExpansionRadiusPc *
    (elapsedYears / EJECTA_WIND_TRANSITION_YEARS) ** EJECTA_EXPANSION_INDEX
  );
}

function timelinePhase(scenario: Scenario, year: number, collapseYear: number) {
  if (scenario === 'preferred') {
    return {
      label: 'Received-state extrapolation · red-supergiant atmosphere',
      short: 'No collapse imposed',
      activity: 0.42,
      elapsed: -1,
    };
  }
  const elapsed = year - collapseYear;
  if (elapsed < -5) {
    return {
      label: 'Conditional pre-collapse red supergiant',
      short: 'Pre-collapse branch',
      activity: 0.48,
      elapsed,
    };
  }
  if (elapsed < 0) {
    return {
      label: 'Illustrative enhanced mass loss',
      short: 'Final five years compressed',
      activity: 0.95,
      elapsed,
    };
  }
  if (elapsed < 1) {
    return {
      label: 'Shock breakout · temporal scale compressed',
      short: 'Physical crossing scale ≈19 h',
      activity: 1.5,
      elapsed,
    };
  }
  if (elapsed < 50) {
    return {
      label: 'Expanding Type-II ejecta illustration',
      short: `${elapsed.toFixed(0)} yr after imposed collapse`,
      activity: 0,
      elapsed,
    };
  }
  return {
    label: 'Young remnant · ballistic scale shown',
    short: `${elapsed.toFixed(0)} yr after imposed collapse`,
    activity: 0,
    elapsed,
  };
}

export function Betelgeuse3DTimeline() {
  const mountRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const hydroParametersRef = useRef<HydroParameters>(DEFAULT_HYDRO_PARAMETERS);
  const scenarioRef = useRef<Scenario>('preferred');
  const observationLayerRef = useRef<ObservationLayer>('near-ir');
  const yearRef = useRef(START_YEAR);
  const collapseYearRef = useRef(DEFAULT_COLLAPSE_YEAR);
  const [scenario, setScenario] = useState<Scenario>('preferred');
  const [observationLayer, setObservationLayer] =
    useState<ObservationLayer>('near-ir');
  const [year, setYear] = useState(START_YEAR);
  const [collapseYear, setCollapseYear] = useState(DEFAULT_COLLAPSE_YEAR);
  const [quality, setQuality] = useState<Quality>('high');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(20);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [hydroRunning, setHydroRunning] = useState(true);
  const [hydroParameters, setHydroParameters] = useState<HydroParameters>(
    DEFAULT_HYDRO_PARAMETERS,
  );
  const [hydroStats, setHydroStats] = useState<HydroStats>(DEFAULT_HYDRO_STATS);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    observationLayerRef.current = observationLayer;
  }, [observationLayer]);

  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  useEffect(() => {
    collapseYearRef.current = collapseYear;
  }, [collapseYear]);

  useEffect(() => {
    hydroParametersRef.current = hydroParameters;
    workerRef.current?.postMessage({
      type: 'parameters',
      parameters: hydroParameters,
    });
  }, [hydroParameters]);

  useEffect(() => {
    workerRef.current?.postMessage({ type: 'pause', value: !hydroRunning });
  }, [hydroRunning]);

  const phase = useMemo(
    () => timelinePhase(scenario, year, collapseYear),
    [scenario, year, collapseYear],
  );
  const elapsedYears = Math.max(0, year - collapseYear);
  const radiusPc =
    scenario === 'conditional' ? ejectaRadiusPc(elapsedYears) : 0;
  const angularDiameterArcmin =
    radiusPc > 0 ? ((2 * radiusPc) / DISTANCE_PC) * (180 / Math.PI) * 60 : 0;
  const displayedLayerTemperature =
    observationLayer === 'near-ir'
      ? hydroStats.meanTemperature
      : ALMA_TEMPERATURE_K;
  const displayedLayerRadiusAu =
    observationLayer === 'near-ir' ? NEAR_IR_RADIUS_AU : ALMA_RADIUS_AU;
  const displayedLayerDiameterMas =
    observationLayer === 'near-ir' ? NEAR_IR_DIAMETER_MAS : ALMA_DIAMETER_MAS;
  const cellCrossingYears =
    hydroStats.velocityRms > 0.05
      ? (0.6 * NEAR_IR_RADIUS_AU * 1.495978707e8) /
        (hydroStats.velocityRms * SECONDS_PER_YEAR)
      : 0;

  const reset = useCallback(() => {
    setPlaying(false);
    setYear(START_YEAR);
    setCollapseYear(DEFAULT_COLLAPSE_YEAR);
    setObservationLayer('near-ir');
    setHydroParameters(DEFAULT_HYDRO_PARAMETERS);
    setHydroRunning(true);
    workerRef.current?.postMessage({ type: 'reset' });
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const advance = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      setYear((current) => {
        const next = current + delta * speed;
        if (next >= END_YEAR) {
          setPlaying(false);
          return END_YEAR;
        }
        return next;
      });
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      });
    } catch {
      queueMicrotask(() =>
        setWebglError('WebGL is unavailable in this browser or GPU context.'),
      );
      return;
    }

    renderer.setPixelRatio(
      quality === 'high'
        ? Math.min(window.devicePixelRatio, 2)
        : Math.min(window.devicePixelRatio, 1),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setClearColor(0x020203, 1);
    renderer.domElement.className = 'stellar-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020203, 0.018);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
    camera.position.set(0.1, 0.15, 11.5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.045;
    controls.enablePan = false;
    controls.minDistance = 5.4;
    controls.maxDistance = 22;
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches;
    controls.autoRotateSpeed = 0.18;

    const root = new THREE.Group();
    scene.add(root);

    const hydroWidth = quality === 'high' ? 128 : 80;
    const hydroHeight = quality === 'high' ? 64 : 40;
    const hydroPixels = new Uint8Array(hydroWidth * hydroHeight * 4);
    for (let i = 0; i < hydroWidth * hydroHeight; i += 1) {
      hydroPixels[i * 4] = 128;
      hydroPixels[i * 4 + 1] = 128;
      hydroPixels[i * 4 + 2] = 128;
      hydroPixels[i * 4 + 3] = 0;
    }
    const hydroTexture = new THREE.DataTexture(
      hydroPixels,
      hydroWidth,
      hydroHeight,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
    );
    hydroTexture.wrapS = THREE.RepeatWrapping;
    hydroTexture.wrapT = THREE.ClampToEdgeWrapping;
    hydroTexture.minFilter = THREE.LinearFilter;
    hydroTexture.magFilter = THREE.LinearFilter;
    hydroTexture.colorSpace = THREE.NoColorSpace;
    hydroTexture.needsUpdate = true;

    const hydroWorker = new Worker(
      siteAsset('/workers/betelgeuse-hydro-worker.js'),
    );
    workerRef.current = hydroWorker;
    let lastStatsUpdate = 0;
    hydroWorker.onmessage = (event: MessageEvent) => {
      const message = event.data as {
        type?: string;
        pixels?: Uint8ClampedArray;
        stats?: HydroStats;
      };
      if (message.type !== 'frame' || !message.pixels || !message.stats) return;
      hydroPixels.set(message.pixels);
      hydroTexture.needsUpdate = true;
      const now = performance.now();
      if (now - lastStatsUpdate > 250) {
        lastStatsUpdate = now;
        setHydroStats(message.stats);
      }
    };
    hydroWorker.onerror = () => {
      setWebglError(
        'The surface gas-flow solver stopped. Reload the page to restart it.',
      );
    };
    const reduceGasMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceGasMotion) queueMicrotask(() => setHydroRunning(false));
    hydroWorker.postMessage({
      type: 'init',
      quality,
      parameters: hydroParametersRef.current,
      reducedMotion: reduceGasMotion,
    });

    const starGeometry = new THREE.SphereGeometry(
      2,
      quality === 'high' ? 192 : 112,
      quality === 'high' ? 128 : 72,
    );
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uActivity: { value: 0.42 },
        uRadialScale: { value: 0.62 },
        uOpacity: { value: 1 },
        uLayerMode: { value: 0 },
        uTemperatureBase: { value: NEAR_IR_TEMPERATURE_K },
        uTemperatureSpan: { value: 480 },
        uHotspotEnhancement: { value: ALMA_HOTSPOT_ENHANCEMENT_K },
        uLimbExponent: { value: 0.097 },
        uHydroMap: { value: hydroTexture },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: true,
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    root.add(star);

    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xb83c12,
      transparent: true,
      opacity: 0.025,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 96, 64),
      atmosphereMaterial,
    );
    atmosphere.scale.setScalar(ALMA_TO_NEAR_IR_RADIUS);
    root.add(atmosphere);

    const random = seededRandom(194205);
    const plumeCount = quality === 'high' ? 4200 : 1800;
    const plumePositions = new Float32Array(plumeCount * 3);
    const plumeColours = new Float32Array(plumeCount * 3);
    const colour = new THREE.Color();
    for (let i = 0; i < plumeCount; i += 1) {
      const theta = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const radius = 2.15 + Math.pow(random(), 2.8) * 2.9;
      const radial = Math.sqrt(1 - z * z);
      plumePositions[i * 3] = Math.cos(theta) * radial * radius;
      plumePositions[i * 3 + 1] = z * radius;
      plumePositions[i * 3 + 2] = Math.sin(theta) * radial * radius;
      colour.setHSL(0.018 + random() * 0.065, 0.92, 0.34 + random() * 0.28);
      plumeColours[i * 3] = colour.r;
      plumeColours[i * 3 + 1] = colour.g;
      plumeColours[i * 3 + 2] = colour.b;
    }
    const plumeGeometry = new THREE.BufferGeometry();
    plumeGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(plumePositions, 3),
    );
    plumeGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(plumeColours, 3),
    );
    const plumeMaterial = new THREE.PointsMaterial({
      size: quality === 'high' ? 0.024 : 0.034,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.12,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const plumes = new THREE.Points(plumeGeometry, plumeMaterial);
    root.add(plumes);

    const shellGeometry = new THREE.SphereGeometry(
      2.15,
      quality === 'high' ? 160 : 96,
      quality === 'high' ? 112 : 64,
    );
    const shellMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: shellVertexShader,
      fragmentShader: shellFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    shell.visible = false;
    root.add(shell);

    const ejectaCount = quality === 'high' ? 8500 : 3600;
    const ejectaPositions = new Float32Array(ejectaCount * 3);
    const ejectaColours = new Float32Array(ejectaCount * 3);
    for (let i = 0; i < ejectaCount; i += 1) {
      const theta = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const radial = Math.sqrt(1 - z * z);
      const radius = 1.75 + Math.pow(random(), 0.58) * 0.8;
      const anisotropy = 0.82 + random() * 0.35;
      ejectaPositions[i * 3] = Math.cos(theta) * radial * radius * anisotropy;
      ejectaPositions[i * 3 + 1] = z * radius * (0.92 + random() * 0.22);
      ejectaPositions[i * 3 + 2] = Math.sin(theta) * radial * radius;
      colour.setHSL(0.005 + random() * 0.11, 0.95, 0.36 + random() * 0.38);
      ejectaColours[i * 3] = colour.r;
      ejectaColours[i * 3 + 1] = colour.g;
      ejectaColours[i * 3 + 2] = colour.b;
    }
    const ejectaGeometry = new THREE.BufferGeometry();
    ejectaGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(ejectaPositions, 3),
    );
    ejectaGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(ejectaColours, 3),
    );
    const ejectaMaterial = new THREE.PointsMaterial({
      size: quality === 'high' ? 0.038 : 0.052,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ejecta = new THREE.Points(ejectaGeometry, ejectaMaterial);
    ejecta.visible = false;
    root.add(ejecta);

    const glowTexture = createGlowTexture();
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xff5b0a,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.setScalar(6.1);
    root.add(glow);

    const remnantMaterial = new THREE.MeshBasicMaterial({
      color: 0xe8f6ff,
      transparent: true,
      opacity: 0,
    });
    const remnant = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 48, 32),
      remnantMaterial,
    );
    root.add(remnant);

    const starfieldCount = quality === 'high' ? 4800 : 2200;
    const starfieldPositions = new Float32Array(starfieldCount * 3);
    const starfieldColours = new Float32Array(starfieldCount * 3);
    for (let i = 0; i < starfieldCount; i += 1) {
      const theta = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const radial = Math.sqrt(1 - z * z);
      const radius = 52 + random() * 125;
      starfieldPositions[i * 3] = Math.cos(theta) * radial * radius;
      starfieldPositions[i * 3 + 1] = z * radius;
      starfieldPositions[i * 3 + 2] = Math.sin(theta) * radial * radius;
      const luminance = 0.38 + random() * 0.62;
      colour.setRGB(
        luminance * (0.84 + random() * 0.16),
        luminance * 0.9,
        luminance,
      );
      starfieldColours[i * 3] = colour.r;
      starfieldColours[i * 3 + 1] = colour.g;
      starfieldColours[i * 3 + 2] = colour.b;
    }
    const starfieldGeometry = new THREE.BufferGeometry();
    starfieldGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starfieldPositions, 3),
    );
    starfieldGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(starfieldColours, 3),
    );
    const starfieldMaterial = new THREE.PointsMaterial({
      size: 0.105,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    const starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
    scene.add(starfield);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      0.58,
      0.42,
      0.72,
    );
    composer.addPass(bloom);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 420);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const animationStart = performance.now();
    let animationFrame = 0;
    const animate = () => {
      const time = (performance.now() - animationStart) / 1000;
      const currentScenario = scenarioRef.current;
      const currentObservationLayer = observationLayerRef.current;
      const currentYear = yearRef.current;
      const eventYear = collapseYearRef.current;
      const currentPhase = timelinePhase(
        currentScenario,
        currentYear,
        eventYear,
      );
      const elapsed = currentPhase.elapsed;
      const exploded = currentScenario === 'conditional' && elapsed >= 0;
      const breakout = exploded && elapsed < 1;
      const layerScale =
        currentObservationLayer === 'alma-band7' ? ALMA_TO_NEAR_IR_RADIUS : 1;

      if (!reducedMotion) {
        starMaterial.uniforms.uTime.value = time;
        shellMaterial.uniforms.uTime.value = time;
        ejecta.rotation.y = time * 0.018;
        starfield.rotation.y = time * 0.0014;
      }
      starMaterial.uniforms.uActivity.value = currentPhase.activity;
      starMaterial.uniforms.uLayerMode.value =
        currentObservationLayer === 'alma-band7' ? 1 : 0;
      starMaterial.uniforms.uTemperatureBase.value =
        currentObservationLayer === 'alma-band7'
          ? ALMA_TEMPERATURE_K
          : NEAR_IR_TEMPERATURE_K;
      starMaterial.uniforms.uTemperatureSpan.value =
        currentObservationLayer === 'alma-band7' ? 360 : 480;
      starMaterial.uniforms.uLimbExponent.value =
        currentObservationLayer === 'alma-band7' ? 0.02 : 0.097;
      starMaterial.uniforms.uRadialScale.value =
        currentObservationLayer === 'alma-band7' ? 1 : 0.62;
      const starOpacity = exploded
        ? breakout
          ? 1
          : Math.max(0, 1 - elapsed / 1.8)
        : 1;
      starMaterial.uniforms.uOpacity.value = starOpacity;
      star.scale.setScalar(
        layerScale * (exploded ? Math.max(0.08, 1 - elapsed / 2.2) : 1),
      );
      atmosphere.scale.setScalar(
        ALMA_TO_NEAR_IR_RADIUS *
          (exploded ? Math.max(0.08, 1 - elapsed / 2.2) : 1),
      );
      atmosphereMaterial.opacity = exploded
        ? Math.max(0, 0.08 - elapsed * 0.08)
        : currentObservationLayer === 'alma-band7'
          ? 0.012
          : 0.022 + currentPhase.activity * 0.012;
      plumeMaterial.opacity = exploded
        ? Math.max(0, 0.18 - elapsed * 0.09)
        : 0.07 + currentPhase.activity * 0.06;
      plumes.scale.setScalar(exploded ? 1 + Math.min(elapsed, 5) * 0.24 : 1);

      shell.visible = exploded;
      ejecta.visible = exploded;
      if (exploded) {
        const visualExpansion = 1 + Math.log1p(Math.max(elapsed, 0.02)) * 0.34;
        shell.scale.setScalar(visualExpansion);
        ejecta.scale.setScalar(visualExpansion * 0.98);
        shellMaterial.uniforms.uOpacity.value = breakout
          ? 1
          : Math.max(0.18, 0.92 - Math.log1p(elapsed) * 0.12);
        ejectaMaterial.opacity = breakout
          ? 0.92
          : Math.max(0.16, 0.76 - Math.log1p(elapsed) * 0.09);
        glow.scale.setScalar(breakout ? 13 : 6.8 + Math.log1p(elapsed) * 0.82);
        glowMaterial.opacity = breakout
          ? 1
          : Math.max(0.11, 0.66 - Math.log1p(elapsed) * 0.09);
        bloom.strength = breakout ? 2.4 : 1.25;
      } else {
        glow.scale.setScalar(5.7 * layerScale);
        glowMaterial.opacity = 0.13 + currentPhase.activity * 0.02;
        bloom.strength = 0.32 + currentPhase.activity * 0.08;
      }
      remnantMaterial.opacity = exploded ? Math.min(1, elapsed / 8) : 0;
      remnant.scale.setScalar(
        exploded ? 1 + Math.min(elapsed, 100) * 0.002 : 1,
      );

      controls.update();
      composer.render();
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setWebglError(
        'The GPU context was lost. Reload the page to restart the simulation.',
      );
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      controls.dispose();
      composer.dispose();
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        onContextLost,
      );
      starGeometry.dispose();
      starMaterial.dispose();
      hydroWorker.terminate();
      if (workerRef.current === hydroWorker) workerRef.current = null;
      hydroTexture.dispose();
      atmosphere.geometry.dispose();
      atmosphereMaterial.dispose();
      plumeGeometry.dispose();
      plumeMaterial.dispose();
      shellGeometry.dispose();
      shellMaterial.dispose();
      ejectaGeometry.dispose();
      ejectaMaterial.dispose();
      remnant.geometry.dispose();
      remnantMaterial.dispose();
      starfieldGeometry.dispose();
      starfieldMaterial.dispose();
      glowTexture?.dispose();
      glowMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [quality]);

  return (
    <div className="stellar-simulation">
      <div className="stellar-simulation-header">
        <div>
          <span className="evidence-tag simulated">
            Physics-coupled GPU rendering
          </span>
          <h3>Betelgeuse: conditional 500-year visual evolution</h3>
        </div>
        <label className="stellar-quality-control">
          Rendering quality
          <select
            value={quality}
            onChange={(event) => {
              setWebglError(null);
              setQuality(event.target.value as Quality);
            }}
          >
            <option value="high">High GPU</option>
            <option value="efficient">Efficient</option>
          </select>
        </label>
      </div>

      <div
        className="stellar-scenario-controls"
        aria-label="Simulation scenario"
      >
        <button
          type="button"
          aria-pressed={scenario === 'preferred'}
          onClick={() => {
            setScenario('preferred');
            setPlaying(false);
          }}
        >
          Preferred model · no collapse in 500 yr
        </button>
        <button
          type="button"
          aria-pressed={scenario === 'conditional'}
          onClick={() => {
            setScenario('conditional');
            setPlaying(false);
          }}
        >
          Contested early-collapse experiment
        </button>
      </div>

      <div
        className="stellar-layer-controls"
        aria-label="Synthetic observation layer"
      >
        <button
          type="button"
          aria-pressed={observationLayer === 'near-ir'}
          onClick={() => setObservationLayer('near-ir')}
        >
          <span>Near-IR continuum</span>
          <strong>42.49 mas · 3690 K</strong>
        </button>
        <button
          type="button"
          aria-pressed={observationLayer === 'alma-band7'}
          onClick={() => setObservationLayer('alma-band7')}
        >
          <span>ALMA Band 7 layer</span>
          <strong>57.74 mas · 2300 K</strong>
        </button>
      </div>

      <figure className="stellar-viewport">
        <figcaption className="sr-only">
          Three-dimensional gas-flow-driven rendering for year{' '}
          {Math.round(year)}. {phase.label}. Synthetic{' '}
          {observationLayer === 'near-ir'
            ? 'near-infrared continuum photosphere'
            : 'ALMA Band 7 brightness-temperature layer'}{' '}
          with a representative temperature of{' '}
          {displayedLayerTemperature.toFixed(0)} kelvin and root-mean-square gas
          velocity {hydroStats.velocityRms.toFixed(2)} kilometres per second.
        </figcaption>
        <div ref={mountRef} className="stellar-canvas-mount" />
        <div className="stellar-viewport-overlay" aria-hidden="true">
          <span>{Math.round(year)} CE</span>
          <strong>{phase.label}</strong>
          <small>
            Accelerated surface time {hydroStats.physicalTimeDays.toFixed(0)} d
            · step {hydroStats.stepCount.toLocaleString()} · drag to orbit
          </small>
        </div>
        {webglError ? (
          <div className="stellar-webgl-error" role="alert">
            {webglError}
          </div>
        ) : null}
      </figure>

      <div className="stellar-readouts">
        <div>
          <span>Selected emitting layer</span>
          {observationLayer === 'near-ir' ? (
            <>
              <strong>
                {hydroStats.meanTemperature.toFixed(0)} ±{' '}
                {hydroStats.temperatureRms.toFixed(0)} K
              </strong>
              <small>Simulated mean ± surface RMS around 3690 K</small>
            </>
          ) : (
            <>
              <strong>≈2300 K · hot patch +≈800 K</strong>
              <small>Measured Band 7 brightness-temperature anchors</small>
            </>
          )}
        </div>
        <div>
          <span>Surface-flow state</span>
          <strong>{hydroStats.velocityRms.toFixed(2)} km s⁻¹ RMS</strong>
          <small>
            c<sub>s</sub> = {hydroStats.soundSpeed.toFixed(2)} km s⁻¹ · Mach{' '}
            {hydroStats.mach.toFixed(2)} · cell crossing ≈{' '}
            {cellCrossingYears > 0 ? cellCrossingYears.toFixed(2) : '—'} yr
          </small>
        </div>
        <div>
          <span>Measured geometric scale</span>
          <strong>
            θ = {displayedLayerDiameterMas.toFixed(2)} mas · R ≈{' '}
            {displayedLayerRadiusAu.toFixed(2)} AU
          </strong>
          <small>
            Near-IR R ≈ {NEAR_IR_RADIUS_SOLAR.toFixed(0)} R<sub>☉</sub> at 172
            pc
          </small>
        </div>
        <div>
          <span>Representative gravity scale</span>
          <strong>
            log g = {LOG_G_CGS.toFixed(2)} · v<sub>esc</sub> ≈{' '}
            {ESCAPE_VELOCITY_KM_S.toFixed(0)} km s⁻¹
          </strong>
          <small>
            M = {STELLAR_MASS_SOLAR.toFixed(1)} M<sub>☉</sub> midpoint · L ≈{' '}
            {(STEFAN_BOLTZMANN_LUMINOSITY_SOLAR / 1000).toFixed(0)} × 10³ L
            <sub>☉</sub>
          </small>
        </div>
      </div>

      {radiusPc > 0 ? (
        <p className="stellar-ejecta-readout">
          Conditional forward shock: R<sub>sh</sub> = {radiusPc.toFixed(3)} pc ·
          angular diameter ≈ {angularDiameterArcmin.toFixed(1)} arcmin at 172 pc
          · free expansion transitions to R ∝ t
          <sup>{EJECTA_EXPANSION_INDEX}</sup> after{' '}
          {EJECTA_WIND_TRANSITION_YEARS} yr · {phase.short}
        </p>
      ) : null}

      <section
        className="stellar-fact-grid"
        aria-labelledby="stellar-facts-title"
      >
        <h4 id="stellar-facts-title" className="sr-only">
          Observational anchors used by the simulation
        </h4>
        <article>
          <span className="evidence-tag measured">Continuum surface</span>
          <strong>42.49 ± 0.06 mas · 3690 ± 54 K</strong>
          <p>
            Near-infrared limb-darkened diameter and continuum-forming
            temperature.{' '}
            <a href="https://arxiv.org/abs/1104.0958">Ohnaka et al. 2011</a>
          </p>
        </article>
        <article>
          <span className="evidence-tag measured">Sub-mm atmosphere</span>
          <strong>≈2300 K · 1.1–1.3 R★</strong>
          <p>
            Band 7/8 structure includes an ≈800 K hot enhancement, radius
            deviations up to ±6%, and weak emission to ≈2.5 R★.{' '}
            <a href="https://arxiv.org/abs/2608.19339">Dent et al. 2026</a>
          </p>
        </article>
        <article>
          <span className="evidence-tag model">Flow constraint</span>
          <strong>Cells ≈0.6 R★ · local flows ≈20 km s⁻¹</strong>
          <p>
            The renderer targets a lower disk-integrated RMS; observed local
            upflows and downflows can be much faster.{' '}
            <a href="https://doi.org/10.1051/0004-6361/201834178">
              López Ariste et al. 2018
            </a>
          </p>
        </article>
        <article>
          <span className="evidence-tag calculated">Rotation discipline</span>
          <strong>No rigid rotation imposed</strong>
          <p>
            Large convective cells can mimic a velocity dipole, and the 2023
            ALMA data show no clear rotation signature.{' '}
            <a href="https://arxiv.org/abs/2311.16885">Ma et al. 2024</a>
          </p>
        </article>
      </section>

      <section
        className="stellar-physics-controls"
        aria-labelledby="gas-controls-title"
      >
        <div className="stellar-physics-heading">
          <div>
            <span className="evidence-tag calculated">
              Surface-layer solver
            </span>
            <h4 id="gas-controls-title">Gas dynamics and thermal transport</h4>
          </div>
          <button
            type="button"
            onClick={() => setHydroRunning((value) => !value)}
            aria-pressed={!hydroRunning}
          >
            {hydroRunning ? 'Freeze gas flow' : 'Resume gas flow'}
          </button>
        </div>
        <div className="stellar-physics-grid">
          <label htmlFor="hydro-driving">
            <span>
              Buoyant driving{' '}
              <strong>{hydroParameters.driving.toFixed(2)}</strong>
            </span>
            <input
              id="hydro-driving"
              type="range"
              min={0.2}
              max={1.1}
              step={0.01}
              value={hydroParameters.driving}
              onChange={(event) =>
                setHydroParameters((current) => ({
                  ...current,
                  driving: Number(event.target.value),
                }))
              }
            />
          </label>
          <label htmlFor="hydro-viscosity">
            <span>
              Viscosity ν{' '}
              <strong>{hydroParameters.viscosity.toFixed(3)}</strong>
            </span>
            <input
              id="hydro-viscosity"
              type="range"
              min={0.005}
              max={0.1}
              step={0.005}
              value={hydroParameters.viscosity}
              onChange={(event) =>
                setHydroParameters((current) => ({
                  ...current,
                  viscosity: Number(event.target.value),
                }))
              }
            />
          </label>
          <label htmlFor="hydro-diffusivity">
            <span>
              Thermal diffusion κ{' '}
              <strong>{hydroParameters.diffusivity.toFixed(3)}</strong>
            </span>
            <input
              id="hydro-diffusivity"
              type="range"
              min={0.005}
              max={0.09}
              step={0.005}
              value={hydroParameters.diffusivity}
              onChange={(event) =>
                setHydroParameters((current) => ({
                  ...current,
                  diffusivity: Number(event.target.value),
                }))
              }
            />
          </label>
          <label htmlFor="hydro-cooling">
            <span>
              Radiative relaxation{' '}
              <strong>{hydroParameters.cooling.toFixed(3)}</strong>
            </span>
            <input
              id="hydro-cooling"
              type="range"
              min={0.01}
              max={0.12}
              step={0.005}
              value={hydroParameters.cooling}
              onChange={(event) =>
                setHydroParameters((current) => ({
                  ...current,
                  cooling: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
        <p>
          Coefficients are nondimensional surface-layer closures. They alter the
          solved flow field rather than merely changing colour. The worker maps
          one numerical step to 0.25 accelerated surface day; it is not
          synchronized to the compressed 500-year evolutionary slider.
        </p>
      </section>

      <div className="stellar-timeline-controls">
        <div className="stellar-playback-row">
          <button
            type="button"
            className="stellar-play-button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? 'Pause timeline' : 'Play timeline'}
          >
            {playing ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={reset} aria-label="Reset simulation">
            <RotateCcw aria-hidden="true" /> Reset
          </button>
          <label>
            Timeline rate
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
            >
              <option value={5}>5 yr s⁻¹</option>
              <option value={20}>20 yr s⁻¹</option>
              <option value={50}>50 yr s⁻¹</option>
            </select>
          </label>
        </div>

        <label className="stellar-range-label" htmlFor="simulation-year">
          <span>Earth-received timeline</span>
          <strong>{Math.round(year)} CE</strong>
        </label>
        <input
          id="simulation-year"
          type="range"
          min={START_YEAR}
          max={END_YEAR}
          step={1}
          value={year}
          onChange={(event) => {
            setPlaying(false);
            setYear(Number(event.target.value));
          }}
        />
        <div className="stellar-timeline-ticks" aria-hidden="true">
          {[2026, 2056, 2126, 2226, 2326, 2526].map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        {scenario === 'conditional' ? (
          <div className="collapse-year-control">
            <label className="stellar-range-label" htmlFor="collapse-year">
              <span>Imposed arrival epoch · disputed branch only</span>
              <strong>{collapseYear} CE</strong>
            </label>
            <input
              id="collapse-year"
              type="range"
              min={2056}
              max={2326}
              step={1}
              value={collapseYear}
              onChange={(event) => setCollapseYear(Number(event.target.value))}
            />
            <p>
              This control explores the published 30–300 year model-family
              range. It is not a probability distribution or a claimed event
              date.
            </p>
          </div>
        ) : null}
      </div>

      <div className="stellar-model-equations">
        <article>
          <span className="evidence-tag calculated">Mass conservation</span>
          <p className="equation">
            ∂ρ/∂t + ∇·(ρ<strong>v</strong>) = 0
          </p>
          <p>
            Semi-Lagrangian transport advances density while a divergence term
            supplies compressional response. Weak relaxation prevents secular
            mass drift in the reduced surface layer.
          </p>
        </article>
        <article>
          <span className="evidence-tag calculated">Momentum equation</span>
          <p className="equation">
            D<strong>v</strong>/Dt = −∇p/ρ + αgT′r̂ + ν∇²<strong>v</strong>
          </p>
          <p>
            Spherical pressure gradients, buoyancy, drag and viscous diffusion
            evolve the horizontal and radial velocity fields. Rotation is not
            imposed because the current observational interpretation is
            disputed.
          </p>
        </article>
        <article>
          <span className="evidence-tag calculated">Thermal energy</span>
          <p className="equation">
            DT/Dt = −(γ−1)T∇·<strong>v</strong> + κ∇²T + Q<sub>conv</sub> − T′/τ
            <sub>rad</sub>
          </p>
          <p>
            Compression heats, expansion cools, thermal diffusion smooths grid
            scales, buoyant transport sustains cells, and radiative relaxation
            returns perturbations toward the 3690 K near-infrared continuum
            anchor.
          </p>
        </article>
        <article>
          <span className="evidence-tag measured">
            Equation of state + scale
          </span>
          <p className="equation">
            R = θD/2 · g = GM/R² · L = 4πR²σT<sub>eff</sub>⁴
          </p>
          <p>
            θ = {NEAR_IR_DIAMETER_MAS.toFixed(2)} mas and D = {DISTANCE_PC} pc
            give R ≈ {NEAR_IR_RADIUS_AU.toFixed(2)} AU. A representative M ={' '}
            {STELLAR_MASS_SOLAR.toFixed(1)} M<sub>☉</sub> gives log g ≈{' '}
            {LOG_G_CGS.toFixed(2)} and v<sub>esc</sub> ≈{' '}
            {ESCAPE_VELOCITY_KM_S.toFixed(0)} km s⁻¹.
          </p>
        </article>
      </div>

      <p className="stellar-boundary-note">
        The surface shape now stays within observed near-IR and sub-mm asymmetry
        scales, while colour and radius change with the selected emitting layer.
        It remains a reduced spherical surface solver—not a three-dimensional
        radiation-hydrodynamics calculation. The radio view is explicitly
        false-colour; opacity, line formation, ionisation, deep stratification,
        shock capturing, magnetic fields, dust radiative transfer and calibrated
        boundary conditions remain unresolved. The preferred model does not
        predict core collapse anywhere on this 500-year timeline.
      </p>
    </div>
  );
}
