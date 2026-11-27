import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engine = fs.readFileSync(path.join(root, 'mockup-engine.js'));
const server = http.createServer((req, res) => {
  if (req.url === '/mockup-engine.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    return res.end(engine);
  }
  if (req.url === '/' || req.url === '/test.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><meta charset="utf-8"><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="/mockup-engine.js"></script><body>3D mockup smoke test</body>');
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
      details.push({ id: item.id, name: item.name, group: item.group, type: item.blob.type, size: item.blob.size, width: bitmap.width, height: bitmap.height });
      bitmap.close();
    }
    return details;
  });
  assert.equal(results.length, 10, 'exactly ten mockup scenes must render');
  for (const item of results) {
    assert.equal(item.type, 'image/png', item.id + ' must export PNG');
    assert.equal(item.width, 1200, item.id + ' width');
    assert.equal(item.height, 900, item.id + ' height');
    assert.ok(item.size > 12000, item.id + ' output must not be empty');
  }
  assert.equal(new Set(results.map(x => x.id)).size, 10, 'mockup scene IDs must be unique');
  assert.deepEqual(pageErrors, [], 'browser page must not report uncaught errors');
  console.log('3D MOCKUP BROWSER TEST: PASS — ' + results.length + ' scenes, each 1200×900 PNG.');
  for (const item of results) console.log('PASS ' + item.id + ' · ' + item.group + ' · ' + item.size + ' bytes');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
