import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engine = fs.readFileSync(path.join(root, 'mockup-engine.js'));
const three = fs.readFileSync(path.join(root, 'node_modules/three/build/three.min.js'));
const artifactDir = path.join(root, 'artifacts', 'mockup-browser');
fs.mkdirSync(artifactDir, { recursive: true });
const server = http.createServer((req, res) => {
  if (req.url === '/three.min.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    return res.end(three);
  }
  if (req.url === '/mockup-engine.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    return res.end(engine);
  }
  if (req.url === '/' || req.url === '/test.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><meta charset="utf-8"><script src="/three.min.js"></script><script src="/mockup-engine.js"></script><body>3D mockup smoke test</body>');
  }
  res.writeHead(404); res.end('Not found');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:' + address.port + '/test.html', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.PIXELFORGE_MOCKUPS?.available === true, { timeout: 45000 });
  const results = await page.evaluate(async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><path fill="#14283f" d="M40 40H560V260H40Z"/><path fill="#d4ad6b" d="M120 90H480V210H120Z"/></svg>';
    const items = await window.PIXELFORGE_MOCKUPS.render(svg);
    const details = [];
    for (const item of items) {
      const bitmap = await createImageBitmap(item.blob);
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(bitmap, 0, 0);
      const pixels = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
      const background = [pixels[0], pixels[1], pixels[2]]; const colors = new Set(); let foreground = 0, samples = 0;
      for (let y = 0; y < bitmap.height; y += 12) for (let x = 0; x < bitmap.width; x += 12) { const i = (y * bitmap.width + x) * 4; colors.add([pixels[i] >> 3, pixels[i+1] >> 3, pixels[i+2] >> 3].join(',')); if (Math.abs(pixels[i]-background[0]) + Math.abs(pixels[i+1]-background[1]) + Math.abs(pixels[i+2]-background[2]) > 36) foreground++; samples++; }
      details.push({ id: item.id, name: item.name, group: item.group, type: item.blob.type, size: item.blob.size, width: bitmap.width, height: bitmap.height, visualColors: colors.size, foregroundRatio: foreground / samples, base64: await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(item.blob); }) });
      bitmap.close();
    }
    return details;
  });
  assert.equal(results.length, 21, 'exactly twenty-one mockup scenes must render');
  for (const item of results) {
    const png = Buffer.from(item.base64, 'base64');
    fs.writeFileSync(path.join(artifactDir, item.id + '.png'), png);
    console.log('VISUAL ' + item.id + ': colors=' + item.visualColors + ', foreground=' + item.foregroundRatio.toFixed(4) + ', bytes=' + item.size);
    delete item.base64;
  }
  fs.writeFileSync(path.join(artifactDir, 'manifest.json'), JSON.stringify(results, null, 2));
  for (const item of results) {
    assert.equal(item.type, 'image/png', item.id + ' must export PNG');
    assert.equal(item.width, 1200, item.id + ' width');
    assert.equal(item.height, 900, item.id + ' height');
    assert.ok(item.size > 12000, item.id + ' output must not be empty');
    assert.ok(item.visualColors > 8, item.id + ' must contain rendered material and lighting variation');
    assert.ok(item.foregroundRatio > 0.025, item.id + ' must contain visible product geometry');
  }
  assert.equal(new Set(results.map(x => x.id)).size, 21, 'mockup scene IDs must be unique');
  for (const item of results) {
    const png = fs.readFileSync(path.join(artifactDir, item.id + '.png'));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', item.id + ' PNG signature');
  }
  assert.deepEqual(pageErrors, [], 'browser page must not report uncaught errors');
  console.log('3D MOCKUP BROWSER TEST: PASS — ' + results.length + ' scenes, each 1200×900 PNG. Artifacts: ' + artifactDir);
  for (const item of results) console.log('PASS ' + item.id + ' · ' + item.group + ' · ' + item.size + ' bytes');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
