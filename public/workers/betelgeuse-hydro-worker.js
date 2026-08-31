/* Reduced surface-convection solver for the Betelgeuse Observatory.
 *
 * State variables are dimensionless perturbations on a longitude/latitude grid:
 * temperature theta, density rho, horizontal velocity (u,v), and radial velocity w.
 * The scheme uses semi-Lagrangian advection plus explicit pressure, buoyancy,
 * diffusion, radiative relaxation, and compressional heating terms. It is a
 * stable educational surface-layer model, not a stellar-interior RHD code.
 */

const GAMMA = 5 / 3;
const BOLTZMANN = 1.380649e-23;
const HYDROGEN_MASS = 1.6735575e-27;
const MEAN_MOLECULAR_WEIGHT = 1.3;
const PHOTOSPHERE_TEMPERATURE_K = 3690;
const TEMPERATURE_PERTURBATION_K = 480;
const VELOCITY_SCALE_KM_S = 10.0;
const PHYSICAL_DAYS_PER_STEP = 0.25;

let nx = 128;
let ny = 64;
let cellCount = nx * ny;
let theta;
let density;
let velocityX;
let velocityY;
let velocityR;
let nextTheta;
let nextDensity;
let nextVelocityX;
let nextVelocityY;
let nextVelocityR;
let running = true;
let timer = null;
let simulationTime = 0;
let stepCount = 0;

let parameters = {
  viscosity: 0.035,
  diffusivity: 0.025,
  cooling: 0.045,
  driving: 0.62,
};

function index(x, y) {
  const wrappedX = ((x % nx) + nx) % nx;
  const clampedY = Math.max(0, Math.min(ny - 1, y));
  return clampedY * nx + wrappedX;
}

function seededNoise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function allocate() {
  cellCount = nx * ny;
  theta = new Float32Array(cellCount);
  density = new Float32Array(cellCount);
  velocityX = new Float32Array(cellCount);
  velocityY = new Float32Array(cellCount);
  velocityR = new Float32Array(cellCount);
  nextTheta = new Float32Array(cellCount);
  nextDensity = new Float32Array(cellCount);
  nextVelocityX = new Float32Array(cellCount);
  nextVelocityY = new Float32Array(cellCount);
  nextVelocityR = new Float32Array(cellCount);
}

function initialise() {
  simulationTime = 0;
  stepCount = 0;
  for (let y = 0; y < ny; y += 1) {
    const latitude = ((y + 0.5) / ny - 0.5) * Math.PI;
    for (let x = 0; x < nx; x += 1) {
      const longitude = ((x + 0.5) / nx) * Math.PI * 2;
      const i = index(x, y);
      const broadCells =
        0.23 * Math.sin(longitude * 3 + 0.7) * Math.cos(latitude * 2) +
        0.18 * Math.sin(longitude * 5 - latitude * 3 + 1.8) +
        0.12 * Math.cos(longitude * 2 + latitude * 4 - 0.4);
      const perturbation = (seededNoise(x, y) - 0.5) * 0.075;
      theta[i] = broadCells + perturbation;
      density[i] = Math.max(0.82, Math.min(1.18, 1 - theta[i] * 0.09));
      velocityX[i] = 0.045 * Math.sin(latitude * 2 + longitude);
      velocityY[i] = 0.04 * Math.cos(longitude * 2) * Math.cos(latitude);
      velocityR[i] = theta[i] * 0.16;
    }
  }
  publish();
}

function bilinear(field, x, y) {
  const yClamped = Math.max(0, Math.min(ny - 1.001, y));
  const x0 = Math.floor(x);
  const y0 = Math.floor(yClamped);
  const fx = x - x0;
  const fy = yClamped - y0;
  const a = field[index(x0, y0)];
  const b = field[index(x0 + 1, y0)];
  const c = field[index(x0, y0 + 1)];
  const d = field[index(x0 + 1, y0 + 1)];
  return (
    a * (1 - fx) * (1 - fy) +
    b * fx * (1 - fy) +
    c * (1 - fx) * fy +
    d * fx * fy
  );
}

function sphericalLaplacian(field, x, y, latitude) {
  const centre = field[index(x, y)];
  const cosine = Math.max(0.42, Math.cos(latitude));
  const longitudeSecond =
    (field[index(x - 1, y)] - 2 * centre + field[index(x + 1, y)]) /
    (cosine * cosine);
  const latitudeSecond =
    field[index(x, y - 1)] - 2 * centre + field[index(x, y + 1)];
  const latitudeFirst = (field[index(x, y + 1)] - field[index(x, y - 1)]) * 0.5;
  const metricTerm = -clamp(Math.tan(latitude), -2, 2) * latitudeFirst;
  return longitudeSecond + latitudeSecond + metricTerm;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function integrate() {
  const dt = 0.055;
  const pressureStrength = 0.32;
  const buoyancyStrength = 0.88;
  const horizontalThermalExpansion = 0.12;
  const drag = 0.036;
  const radialDrag = 0.08;
  const compressibility = 0.22;
  let meanTheta = 0;
  let meanRadialVelocity = 0;
  for (let i = 0; i < cellCount; i += 1) {
    meanTheta += theta[i];
    meanRadialVelocity += velocityR[i];
  }
  meanTheta /= cellCount;
  meanRadialVelocity /= cellCount;

  for (let y = 0; y < ny; y += 1) {
    const latitude = ((y + 0.5) / ny - 0.5) * Math.PI;
    const metric = Math.max(0.42, Math.cos(latitude));
    for (let x = 0; x < nx; x += 1) {
      const i = index(x, y);
      const u = velocityX[i];
      const v = velocityY[i];
      const backX = x - (dt * u * nx) / (Math.PI * 2 * metric);
      const backY = y - (dt * v * ny) / Math.PI;

      const advectedTheta = bilinear(theta, backX, backY);
      const advectedDensity = bilinear(density, backX, backY);
      const advectedU = bilinear(velocityX, backX, backY);
      const advectedV = bilinear(velocityY, backX, backY);
      const advectedW = bilinear(velocityR, backX, backY);

      const pressureLeft =
        density[index(x - 1, y)] * (1 + 0.22 * theta[index(x - 1, y)]);
      const pressureRight =
        density[index(x + 1, y)] * (1 + 0.22 * theta[index(x + 1, y)]);
      const pressureDown =
        density[index(x, y - 1)] * (1 + 0.22 * theta[index(x, y - 1)]);
      const pressureUp =
        density[index(x, y + 1)] * (1 + 0.22 * theta[index(x, y + 1)]);
      const pressureGradientX = ((pressureRight - pressureLeft) * 0.5) / metric;
      const pressureGradientY = (pressureUp - pressureDown) * 0.5;
      const temperatureGradientX =
        ((theta[index(x + 1, y)] - theta[index(x - 1, y)]) * 0.5) / metric;
      const temperatureGradientY =
        (theta[index(x, y + 1)] - theta[index(x, y - 1)]) * 0.5;
      const divergence =
        ((velocityX[index(x + 1, y)] - velocityX[index(x - 1, y)]) * 0.5) /
          metric +
        (velocityY[index(x, y + 1)] - velocityY[index(x, y - 1)]) * 0.5 -
        clamp(Math.tan(latitude), -2, 2) * velocityY[i];

      const thermalForcing =
        0.018 *
        parameters.driving *
        (Math.sin(x * 0.097 + simulationTime * 0.21) *
          Math.cos(y * 0.151 - simulationTime * 0.13) +
          0.65 * Math.sin(x * 0.043 - y * 0.087 + simulationTime * 0.09));

      nextVelocityX[i] = clamp(
        advectedU +
          dt *
            ((-pressureStrength * pressureGradientX) /
              Math.max(advectedDensity, 0.65) -
              horizontalThermalExpansion * temperatureGradientX +
              drag * advectedU +
              parameters.viscosity *
                sphericalLaplacian(velocityX, x, y, latitude)),
        -0.9,
        0.9,
      );
      nextVelocityY[i] = clamp(
        advectedV +
          dt *
            ((-pressureStrength * pressureGradientY) /
              Math.max(advectedDensity, 0.65) -
              horizontalThermalExpansion * temperatureGradientY -
              drag * advectedV +
              parameters.viscosity *
                sphericalLaplacian(velocityY, x, y, latitude)),
        -0.9,
        0.9,
      );
      nextVelocityR[i] = clamp(
        advectedW +
          dt *
            (buoyancyStrength * parameters.driving * advectedTheta -
              radialDrag * advectedW -
              0.28 * meanRadialVelocity +
              parameters.viscosity *
                sphericalLaplacian(velocityR, x, y, latitude)),
        -0.95,
        0.95,
      );

      nextTheta[i] = clamp(
        advectedTheta +
          dt *
            (0.18 * parameters.driving * (advectedW - meanRadialVelocity) -
              (GAMMA - 1) * (1 + 0.22 * advectedTheta) * divergence -
              parameters.cooling * advectedTheta -
              0.22 * meanTheta +
              parameters.diffusivity *
                sphericalLaplacian(theta, x, y, latitude) +
              thermalForcing),
        -0.95,
        0.95,
      );
      nextDensity[i] = clamp(
        advectedDensity +
          dt *
            (-compressibility * advectedDensity * divergence -
              0.032 * advectedW +
              0.018 * (1 - advectedDensity) +
              parameters.diffusivity *
                0.35 *
                sphericalLaplacian(density, x, y, latitude)),
        0.72,
        1.28,
      );
    }
  }

  [theta, nextTheta] = [nextTheta, theta];
  [density, nextDensity] = [nextDensity, density];
  [velocityX, nextVelocityX] = [nextVelocityX, velocityX];
  [velocityY, nextVelocityY] = [nextVelocityY, velocityY];
  [velocityR, nextVelocityR] = [nextVelocityR, velocityR];
  simulationTime += dt;
  stepCount += 1;
}

function publish() {
  const pixels = new Uint8ClampedArray(cellCount * 4);
  let sumTemperature = 0;
  let sumTemperatureSquared = 0;
  let sumSpeedSquared = 0;
  let minDensity = Infinity;
  let maxDensity = -Infinity;
  let convectiveFlux = 0;
  let totalWeight = 0;

  for (let y = 0; y < ny; y += 1) {
    const latitude = ((y + 0.5) / ny - 0.5) * Math.PI;
    const areaWeight = Math.max(0, Math.cos(latitude));
    for (let x = 0; x < nx; x += 1) {
      const i = index(x, y);
      const temperatureK =
        PHOTOSPHERE_TEMPERATURE_K + theta[i] * TEMPERATURE_PERTURBATION_K;
      const speedSquared =
        velocityX[i] * velocityX[i] +
        velocityY[i] * velocityY[i] +
        velocityR[i] * velocityR[i];
      const speed = Math.sqrt(speedSquared);
      totalWeight += areaWeight;
      sumTemperature += temperatureK * areaWeight;
      sumTemperatureSquared += temperatureK * temperatureK * areaWeight;
      sumSpeedSquared += speedSquared * areaWeight;
      minDensity = Math.min(minDensity, density[i]);
      maxDensity = Math.max(maxDensity, density[i]);
      convectiveFlux += velocityR[i] * theta[i] * areaWeight;
      pixels[i * 4] = Math.round(clamp(0.5 + theta[i] * 0.48, 0, 1) * 255);
      pixels[i * 4 + 1] = Math.round(
        clamp(0.5 + velocityR[i] * 0.5, 0, 1) * 255,
      );
      pixels[i * 4 + 2] = Math.round(
        clamp((density[i] - 0.7) / 0.6, 0, 1) * 255,
      );
      pixels[i * 4 + 3] = Math.round(clamp(speed / 0.95, 0, 1) * 255);
    }
  }

  const meanTemperature = sumTemperature / totalWeight;
  const temperatureRms = Math.sqrt(
    Math.max(
      0,
      sumTemperatureSquared / totalWeight - meanTemperature * meanTemperature,
    ),
  );
  const velocityRms =
    Math.sqrt(sumSpeedSquared / totalWeight) * VELOCITY_SCALE_KM_S;
  const soundSpeed =
    Math.sqrt(
      (GAMMA * BOLTZMANN * meanTemperature) /
        (MEAN_MOLECULAR_WEIGHT * HYDROGEN_MASS),
    ) / 1000;

  self.postMessage(
    {
      type: 'frame',
      width: nx,
      height: ny,
      pixels,
      stats: {
        meanTemperature,
        temperatureRms,
        velocityRms,
        soundSpeed,
        mach: velocityRms / soundSpeed,
        densityContrast: maxDensity / minDensity,
        convectiveFlux: convectiveFlux / totalWeight,
        simulationTime,
        physicalTimeDays: stepCount * PHYSICAL_DAYS_PER_STEP,
        stepCount,
      },
    },
    [pixels.buffer],
  );
}

function tick() {
  if (!running) return;
  const substeps = nx >= 120 ? 2 : 3;
  for (let i = 0; i < substeps; i += 1) integrate();
  if (stepCount % 2 === 0) publish();
}

function startTimer() {
  if (timer !== null) clearInterval(timer);
  timer = setInterval(tick, nx >= 120 ? 45 : 40);
}

self.onmessage = (event) => {
  const message = event.data || {};
  if (message.type === 'init') {
    nx = message.quality === 'high' ? 128 : 80;
    ny = message.quality === 'high' ? 64 : 40;
    parameters = { ...parameters, ...message.parameters };
    allocate();
    initialise();
    running = !message.reducedMotion;
    startTimer();
  } else if (message.type === 'parameters') {
    parameters = { ...parameters, ...message.parameters };
  } else if (message.type === 'pause') {
    running = !message.value;
  } else if (message.type === 'reset') {
    initialise();
  }
};
