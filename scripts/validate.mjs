import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const errors = [];
const checks = [];
const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1]).filter(s => s.includes('(()=>{'));
if (!scripts.length) errors.push('Main application script was not found.');
for (const [i, script] of scripts.entries()) {
  try { new vm.Script(script, { filename: 'index-inline-' + i + '.js' }); checks.push('Inline JavaScript syntax'); }
  catch (error) { errors.push('JavaScript syntax: ' + error.message); }
}
const ids = new Set([...html.matchAll(/\\bid=["']([^"']+)["']/g)].map(m => m[1]));
const refs = [...html.matchAll(/\\$\\('([^']+)'\\)/g)].map(m => m[1]);
for (const id of [...new Set(refs)]) if (!ids.has(id)) errors.push('Missing DOM element #' + id);
for (const id of ['sourceFile','sourceInfo','sourceThumb','sourceImage','convert','mainPreview','diagnostics','downloadSvg','downloadPng','downloadPdf','downloadPack']) {
  if (!ids.has(id)) errors.push('Required UI element missing: #' + id);
}
for (const [name, condition] of [
  ['Raster-to-vector engine', html.includes('ImageTracer.imagedataToSVG')],
  ['ZIP packaging', html.includes('zip.generateAsync')],
  ['Transparent background preprocessing', html.includes('pixels.data[p+3]=0')],
  ['Source image preview', html.includes("sourceImage').src=previewUrl")],
  ['Structural vector diagnostics', html.includes('فحص بنية الملف المتجهي')],
  ['Multiple PNG sizes', html.includes('[16,32,48,64,128,256,512,1024,2048]')],
  ['Quality disclosure', html.includes('NOT HUMAN APPROVED')]
]) if (!condition) errors.push('Feature marker missing: ' + name); else checks.push(name);
if (errors.length) {
  console.error('PIXELFORGE validation FAILED\\n' + errors.map(e => '- ' + e).join('\\n'));
  process.exitCode = 1;
} else {
  console.log('PIXELFORGE static validation PASS (' + checks.length + ' checks)');
  for (const item of checks) console.log('PASS: ' + item);
}
