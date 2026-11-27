import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { deflateSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const vtracer = require('@visioncortex/vtracer');
const width = 64, height = 64;
const rgba = new Uint8Array(width * height * 4);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const p = (y * width + x) * 4, inside = x >= 12 && x <= 51 && y >= 12 && y <= 51;
  rgba[p] = inside ? 20 : 255; rgba[p + 1] = inside ? 35 : 255;
  rgba[p + 2] = inside ? 55 : 255; rgba[p + 3] = 255;
}
const svg = vtracer.convertPixels(rgba, width, height, {
  mode: 'spline', hierarchical: 'stacked', maxColors: 4, simplify: 1.5, optimize: 2
});
if (typeof svg !== 'string' || !svg.includes('<svg') || !/<path\\b/.test(svg)) {
  throw new Error('VTracer direct WASM conversion did not produce SVG paths.');
}
console.log('VTracer direct WASM smoke test PASS (' + svg.length + ' SVG characters)');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const name = Buffer.from(type), out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); name.copy(out, 4); data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}
function makePng(w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rows = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 4); rows[row] = 0;
    for (let x = 0; x < w; x++) {
      const p = row + 1 + x * 4, inside = x >= 12 && x <= w - 13 && y >= 12 && y <= h - 13;
      rows[p] = inside ? 20 : 255; rows[p + 1] = inside ? 35 : 255;
      rows[p + 2] = inside ? 55 : 255; rows[p + 3] = 255;
    }
  }
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(rows)), pngChunk('IEND', Buffer.alloc(0))
  ]);
}

const child = spawn(process.execPath, ['server.js'], {
  cwd: process.cwd(), env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe']
});
let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString(); });
try {
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Vector API startup timed out. ' + stderr)), 15000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error('Vector API exited early (' + code + '). ' + stderr)); });
    child.stdout.on('data', chunk => {
      const match = chunk.toString().match(/listening on (\\d+)/);
      if (match) { clearTimeout(timer); resolve(Number(match[1])); }
    });
  });
  const image = 'data:image/png;base64,' + makePng(width, height).toString('base64');
  const response = await fetch('http://127.0.0.1:' + port + '/api/vectorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://pixelforge-studio-app.onrender.com' },
    body: JSON.stringify({ image, colors: 4, speckle: 0, simplify: 1.5 })
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok || payload.engine !== 'VTracer 1.0 WASM' ||
      typeof payload.svg !== 'string' || !payload.svg.includes('<svg') || !/<path\\b/.test(payload.svg)) {
    throw new Error('VTracer HTTP endpoint integration failed: ' + JSON.stringify(payload).slice(0, 500));
  }
  const denied = await fetch('http://127.0.0.1:' + port + '/api/vectorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.invalid' },
    body: JSON.stringify({ image })
  });
  if (denied.status !== 403) throw new Error('Vector API Origin rejection failed: HTTP ' + denied.status);
  console.log('VTracer HTTP integration and Origin guard PASS (' + payload.svg.length + ' SVG characters)');
} finally {
  child.kill('SIGTERM');
  await Promise.race([once(child, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))]);
}
