import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const errors = [];
const checks = [];

const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(script => script.includes('(()=>{'));
if (!inlineScripts.length) errors.push('Main application script was not found.');
for (const [index, script] of inlineScripts.entries()) {
  try {
    new vm.Script(script, { filename: 'index-inline-' + index + '.js' });
    checks.push('Frontend JavaScript syntax');
  } catch (error) {
    errors.push('Frontend syntax: ' + error.message);
  }
}

try {
  const serverForParse = server
    .replace(/^import .*;\s*$/gm, '')
    .replaceAll('import.meta.url', "'file:///project/server.js'");
  new vm.Script(serverForParse, { filename: 'server.js' });
  checks.push('Backend JavaScript syntax');
} catch (error) {
  errors.push('Backend syntax: ' + error.message);
}

const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
const refs = [...html.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
for (const id of [...new Set(refs)]) {
  if (!ids.has(id)) errors.push('Missing DOM element #' + id);
}
for (const id of ['sourceFile','sourceInfo','sourceThumb','sourceImage','convert','mainPreview','diagnostics','downloadSvg','downloadPng','downloadPdf','downloadPack']) {
  if (!ids.has(id)) errors.push('Required UI element missing: #' + id);
}

const features = [
  ['Raster-to-vector engine', html.includes('ImageTracer.imagedataToSVG')],
  ['ZIP packaging', html.includes('zip.generateAsync')],
  ['Edge-connected transparent background preprocessing', html.includes('function removeEdgeConnectedBackground(imageData,mode)') && html.includes('data[i*4+3]=0') && html.includes('const queue=new Int32Array(total)')],
  ['Source image preview', html.includes("sourceImage').src=sourcePreviewUrl")],
  ['Structural vector diagnostics', html.includes('فحص بنية الملف المتجهي')],
  ['Multiple PNG sizes', html.includes('[16,32,48,64,128,256,512,1024,2048]')],
  ['Quality disclosure', html.includes('NOT HUMAN APPROVED')],
  ['Edge-connected background preserves enclosed details', html.includes('removeEdgeConnectedBackground(pixels,mode)') && html.includes('removedBackgroundPixels')],
  ['SVG XML and geometry validation', html.includes('function validateSvg(svg)') && html.includes('parsererror') && html.includes('foreignObject') && html.includes('viewBox')],
  ['All exported color variants are validated', html.includes('Object.values(variants)') && html.includes('validateSvg(candidate)')],
  ['Strict image MIME validation', html.includes("['image/png','image/jpeg','image/webp']")],
  ['20 MiB upload limit', html.includes('20*1024*1024')],
  ['40 MP image limit', html.includes('w*h>40000000')],
  ['Stale outputs cleared on new upload', html.includes("svgMarkup='';variants={}")],
  ['Backend API rate limiting', server.includes('function consumeRateLimit')],
  ['Backend origin validation', server.includes("origin!=='https://pixelforge-studio-app.onrender.com'")],
  ['Backend prompt length cap', server.includes('prompt.length>4000')],
  ['Backend image payload cap', server.includes('18*1024*1024')],
  ['Backend concurrent request cap', server.includes('MAX_CONCURRENT_AI=2')],
  ['Backend releases concurrency slot on all exits', server.includes('activeAI++;') && server.includes('finally{activeAI--;}')],
  ['Environment template matches Cloudflare backend', envExample.includes('CLOUDFLARE_ACCOUNT_ID=') && envExample.includes('CLOUDFLARE_API_TOKEN=') && !envExample.includes('FAL_KEY=')],
  ['No unused admin password claim', !server.includes('adminConfigured') && !server.includes('ADMIN_PASSWORD')]
];
function solidImage(width, height, rgb) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgb[0]; data[i * 4 + 1] = rgb[1]; data[i * 4 + 2] = rgb[2]; data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}
try {
  const start = html.indexOf('function removeEdgeConnectedBackground(');
  const end = html.indexOf('\nfunction cleanBackground', start);
  if (start < 0 || end < 0) throw new Error('Background-removal function not found');
  const sandbox = { Int32Array };
  vm.runInNewContext(html.slice(start, end) + '\nthis.removeEdgeConnectedBackground = removeEdgeConnectedBackground;', sandbox);
  const removeBackground = sandbox.removeEdgeConnectedBackground;
  const white = solidImage(5, 5, [255, 255, 255]);
  for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) {
    const p = (y * 5 + x) * 4; white.data[p] = 0; white.data[p + 1] = 0; white.data[p + 2] = 0;
  }
  const whiteRemoved = removeBackground(white, 'white');
  checks.push(whiteRemoved === 16 && white.data[(2 * 5 + 2) * 4 + 3] === 255 && white.data[3] === 0
    ? 'Flood-fill test: white exterior removed, enclosed white detail preserved'
    : 'Flood-fill test FAILED: white exterior/detail preservation');
  const black = solidImage(3, 3, [0, 0, 0]);
  const center = (4) * 4; black.data[center] = 255; black.data[center + 1] = 255; black.data[center + 2] = 255;
  const blackRemoved = removeBackground(black, 'black');
  checks.push(blackRemoved === 8 && black.data[center + 3] === 255 && black.data[3] === 0
    ? 'Flood-fill test: black exterior removed, enclosed white detail preserved'
    : 'Flood-fill test FAILED: black exterior/detail preservation');
  const keep = solidImage(3, 3, [255, 255, 255]);
  checks.push(removeBackground(keep, 'keep') === 0 && keep.data[3] === 255
    ? 'Flood-fill test: keep mode leaves source pixels unchanged'
    : 'Flood-fill test FAILED: keep mode altered source pixels');
  if (checks.slice(-3).some(item => item.includes('FAILED'))) errors.push('Edge-connected background algorithm unit test failed.');
} catch (error) {
  errors.push('Background-removal unit tests: ' + error.message);
}
for (const [name, condition] of features) {
  if (condition) checks.push(name);
  else errors.push('Feature marker missing: ' + name);
}

if (errors.length) {
  console.error('PIXELFORGE validation FAILED\n' + errors.map(error => '- ' + error).join('\n'));
  process.exitCode = 1;
} else {
  console.log('PIXELFORGE static validation PASS (' + checks.length + ' checks)');
  for (const item of checks) console.log('PASS: ' + item);
}
