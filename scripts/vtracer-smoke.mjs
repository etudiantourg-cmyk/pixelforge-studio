import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const vtracer = require('@visioncortex/vtracer');
const width = 64;
const height = 64;
const rgba = new Uint8Array(width * height * 4);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const p = (y * width + x) * 4;
    const inside = x >= 12 && x <= 51 && y >= 12 && y <= 51;
    rgba[p] = inside ? 20 : 255;
    rgba[p + 1] = inside ? 35 : 255;
    rgba[p + 2] = inside ? 55 : 255;
    rgba[p + 3] = 255;
  }
}

const svg = vtracer.convertPixels(rgba, width, height, {
  mode: 'spline',
  hierarchical: 'stacked',
  maxColors: 4,
  simplify: 1.5,
  optimize: 2
});

if (typeof svg !== 'string' || !svg.includes('<svg') || !/<path\\b/.test(svg)) {
  throw new Error('VTracer smoke test did not produce an SVG path document.');
}
console.log('VTracer WASM smoke test PASS (' + svg.length + ' SVG characters)');
