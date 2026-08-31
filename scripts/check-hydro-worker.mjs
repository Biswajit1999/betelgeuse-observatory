let completed = false;

const fail = (message) => {
  if (completed) return;
  completed = true;
  console.error(message);
  process.exit(1);
};

globalThis.self = {
  onmessage: null,
  postMessage(message) {
    if (message?.type !== 'frame' || message.stats?.stepCount < 240) return;
    const { pixels, stats } = message;
    const finiteStats = [
      stats.meanTemperature,
      stats.temperatureRms,
      stats.velocityRms,
      stats.soundSpeed,
      stats.mach,
      stats.densityContrast,
      stats.convectiveFlux,
      stats.physicalTimeDays,
    ].every(Number.isFinite);
    if (!finiteStats)
      fail('Hydrodynamic worker emitted non-finite diagnostics.');
    if (stats.meanTemperature < 3300 || stats.meanTemperature > 4200) {
      fail(`Mean temperature left the guarded range: ${stats.meanTemperature}`);
    }
    if (stats.densityContrast < 1 || stats.densityContrast > 2.2) {
      fail(`Density contrast left the guarded range: ${stats.densityContrast}`);
    }
    const firstTemperature = pixels[0];
    let varyingPixels = false;
    for (let index = 4; index < pixels.length; index += 4) {
      if (pixels[index] !== firstTemperature) {
        varyingPixels = true;
        break;
      }
    }
    if (!varyingPixels)
      fail('Hydrodynamic temperature field is spatially uniform.');
    completed = true;
    console.log(
      `Hydrodynamic worker stable through step ${stats.stepCount}: ` +
        `T=${stats.meanTemperature.toFixed(1)} K, ` +
        `v_rms=${stats.velocityRms.toFixed(3)} km/s, ` +
        `Mach=${stats.mach.toFixed(3)}, ` +
        `rho contrast=${stats.densityContrast.toFixed(4)}, ` +
        `surface time=${stats.physicalTimeDays.toFixed(1)} d`,
    );
    process.exit(0);
  },
};

await import('../public/workers/betelgeuse-hydro-worker.js');

if (typeof globalThis.self.onmessage !== 'function') {
  fail('Hydrodynamic worker did not install a message handler.');
}

globalThis.self.onmessage({
  data: {
    type: 'init',
    quality: 'efficient',
    reducedMotion: false,
    parameters: {
      viscosity: 0.035,
      diffusivity: 0.025,
      cooling: 0.045,
      driving: 0.62,
    },
  },
});

setTimeout(() => fail('Hydrodynamic worker stability check timed out.'), 8000);
