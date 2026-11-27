import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const envExample = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const vtracerSmoke = fs.readFileSync(new URL('./vtracer-smoke.mjs', import.meta.url), 'utf8');
const acceptanceMatrix = JSON.parse(fs.readFileSync(new URL('../ACCEPTANCE_MATRIX.json', import.meta.url), 'utf8'));
const critic = fs.readFileSync(new URL('./critic.mjs', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../.github/workflows/validate.yml', import.meta.url), 'utf8');
const mockupEngine = fs.readFileSync(new URL('../mockup-engine.js', import.meta.url), 'utf8');
const mockupSmoke = fs.readFileSync(new URL('./mockup-browser-smoke.mjs', import.meta.url), 'utf8');
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
  ['Raster-to-vector engine fallback', html.includes('ImageTracer.imagedataToSVG')],
  ['VTracer WASM backend route', server.includes("url.pathname==='/api/vectorize'") && server.includes("getVTracer().convertBuffer(input.buffer,options)")],
  ['Pinned VTracer WASM dependency', packageJson.dependencies?.['@visioncortex/vtracer'] === '1.0.0-alpha.4'],
  ['Frontend calls VTracer and retains explicit local fallback', html.includes('/api/vectorize') && html.includes("conversionEngine='ImageTracer fallback'")],
  ['Transparent background pixels are written to the PNG sent to VTracer', html.includes('removeEdgeConnectedBackground(pixels,mode);ctx.putImageData(pixels,0,0);const pngData=c.toDataURL(\'image/png\')')],
  ['VTracer backend validates PNG dimensions', server.includes("input.buffer.toString('ascii',12,16)!=='IHDR'") && server.includes('width>1800||height>1800||width*height>3240000')],
  ['VTracer smoke test covers actual WASM conversion', vtracerSmoke.includes('vtracer.convertPixels') && vtracerSmoke.includes('mode: \'spline\'')],
  ['VTracer HTTP endpoint integration and Origin rejection tests', vtracerSmoke.includes('/api/vectorize') && vtracerSmoke.includes('Vector API Origin rejection failed') && vtracerSmoke.includes('spawn(process.execPath')],
  ['Pinned free vector-PDF libraries are loaded before app code', html.includes('jspdf/2.5.2/jspdf.umd.min.js') && html.includes('svg2pdf.js@2.9.0/dist/svg2pdf.umd.min.js')],
  ['PDF export is generated from SVG paths, not a print dialog or raster image', html.includes('async function svgToPdf(svg)') && html.includes('await pdf.svg(root,{x:0,y:0,width,height})') && html.includes("return pdf.output('blob')")],
  ['ZIP includes vector PDFs for all three logo variants', html.includes("baseName+'.pdf'") && html.includes("baseName+'-black.pdf'") && html.includes("baseName+'-white.pdf'")],
  ['ZIP packaging', html.includes('zip.generateAsync')],
  ['Edge-connected transparent background preprocessing', html.includes('function removeEdgeConnectedBackground(imageData,mode)') && html.includes('data[i*4+3]=0') && html.includes('queue=new Int32Array(total)')],
  ['Source image preview', html.includes("sourceImage').src=sourcePreviewUrl")],
  ['Structural vector diagnostics', html.includes('فحص بنية الملف المتجهي')],
  ['Multiple PNG sizes', html.includes('[16,32,48,64,128,256,512,1024,2048]')],
  ['Quality disclosure', html.includes('NOT HUMAN APPROVED')],
  ['Edge-connected background preserves enclosed details', html.includes('removeEdgeConnectedBackground(pixels,mode)') && html.includes('removedBackgroundPixels')],
  ['Background pixel count is scoped to the conversion workflow', html.includes('let removedBackgroundPixels=0;let result=await') && html.includes('removedBackgroundPixels=removeEdgeConnectedBackground(pixels,mode)') && !html.includes('const removedBackgroundPixels=removeEdgeConnectedBackground(pixels,mode)')],
  ['SVG XML and geometry validation', html.includes('function validateSvg(svg)') && html.includes('parsererror') && html.includes('foreignObject') && html.includes('viewBox') && html.includes("'style'") && html.includes("'use'")],
  ['All exported color variants are validated', html.includes('Object.values(variants)') && html.includes('validateSvg(candidate)')],
  ['Strict image MIME validation', html.includes("['image/png','image/jpeg','image/webp']")],
  ['20 MiB upload limit', html.includes('20*1024*1024')],
  ['40 MP image limit', html.includes('w*h>40000000')],
  ['Stale outputs cleared on new upload', html.includes("svgMarkup='';variants={}")],
  ['Backend API rate limiting', server.includes('function consumeRateLimit')],
  ['Backend origin validation', server.includes("origin!=='https://pixelforge-studio-app.onrender.com'")],
  ['Backend image payload cap', server.includes('18*1024*1024')],
  ['No paid AI provider or API credentials are required', !server.includes('CLOUDFLARE') && !server.includes('FLUX') && !server.includes('runAI') && !envExample.includes('API_TOKEN') && !envExample.includes('API_KEY')],
  ['Health endpoint identifies local CPU vector engine', server.includes("engine:'VTracer 1.0 WASM'") && server.includes('requiresApiKey:false')],
  ['No image generation/editing API routes remain', !server.includes("url.pathname==='/api/edit'") && !server.includes("url.pathname==='/api/generate'")],
  ['Strict critic rejects any status other than EXCELLENT / VERIFIED', critic.includes("item.status !== 'EXCELLENT / VERIFIED'") && critic.includes("item.criticVerdict !== 'ACCEPT'")],
  ['Acceptance matrix covers all mandatory groups', acceptanceMatrix.requirements.length >= 18 && new Set(acceptanceMatrix.requirements.map(item => item.id)).size === acceptanceMatrix.requirements.length],
  ['GitHub Actions runs strict critic after engineering validation', workflow.includes('strict-critic:') && workflow.includes('run: npm run critic')],
  ['Twenty-one distinct presentation mockup products are implemented', ['tshirt','tote','shopping','giftbox','shipping','mug','bottle','cap','sign','cards','letterhead','envelope','laptop','hoodie','polo','backpack','mailer','tube','phone','billboard','van'].every(id => mockupEngine.includes("id:'" + id + "'"))],
  ['Mockup engine renders real WebGL scenes at 1200×900 and exports PNG', mockupEngine.includes('new T.WebGLRenderer') && mockupEngine.includes('renderer.setSize(1200,900,false)') && mockupEngine.includes("'image/png'")],
  ['Studio lighting uses controlled exposure, a gradient backdrop and softer light balance', mockupEngine.includes('renderer.toneMappingExposure=.62') && mockupEngine.includes('function studioBackdrop()') && mockupEngine.includes('scene.background=backdrop') && mockupEngine.includes('0xfff0dc,1.25')],
  ['Cap mockup uses a continuous curved visor, crown seams and top button', mockupEngine.includes('const visor=new T.Shape()') && mockupEngine.includes('vg.computeVertexNormals()') && mockupEngine.includes('Crown panel seams') && mockupEngine.includes('const button=new T.Mesh')],
  ['Mockup products are grounded to the studio floor and automatically framed', mockupEngine.includes('new T.Box3().setFromObject(group)') && mockupEngine.includes('floorY-bounds.min.y') && mockupEngine.includes('camera.lookAt(center)')],
  ['Cylindrical mug and bottle branding follows curved surfaces', mockupEngine.includes('function curvedLogo(') && mockupEngine.includes("curvedLogo(parent,logo,.724") && mockupEngine.includes("curvedLogo(parent,logo,.505") && mockupEngine.includes('texture.image.width/texture.image.height')],
  ['Logo aspect ratio is preserved on mockup surfaces', mockupEngine.includes('texture.image.width/texture.image.height')],
  ['Mockup generation is local and does not upload source logos', !mockupEngine.includes('fetch(') && !mockupEngine.includes('XMLHttpRequest')],
  ['Chromium smoke test verifies all thirteen rendered PNGs and their dimensions', mockupSmoke.includes('assert.equal(results.length, 21') && mockupSmoke.includes('createImageBitmap(item.blob)') && mockupSmoke.includes('assert.equal(item.width, 1200') && mockupSmoke.includes('assert.equal(item.height, 900')],
  ['Browser mockup test checks visible geometry and calibrated color variation', mockupSmoke.includes('item.visualColors > 8') && mockupSmoke.includes('item.foregroundRatio > 0.025')],
  ['GitHub Actions runs the 3D mockup browser test', workflow.includes('mockup-browser:') && workflow.includes('npm run test:mockups')],
  ['Browser test pins Three.js and Playwright versions', packageJson.devDependencies?.three === '0.128.0' && packageJson.devDependencies?.playwright === '1.56.1'],
  ['Browser test stores real PNG evidence and validates PNG signatures', mockupSmoke.includes('artifactDir, item.id +') && mockupSmoke.includes('89504e470d0a1a0a')],
  ['GitHub Actions uploads mockup evidence artifacts', workflow.includes('actions/upload-artifact@v4') && workflow.includes('pixelforge-mockup-browser-evidence')],
  ['Project exposes the 3D mockup browser test command', packageJson.scripts?.['test:mockups'] === 'node scripts/mockup-browser-smoke.mjs'],
  ['Mockup filter exposes all seven product groups including devices and vehicles', ['الملابس','الحقائب','العلب والتغليف','المنتجات','اللافتات','المطبوعات','الأجهزة','المركبات'].every(group => html.includes('<option value="'+group+'">'))],
  ['Mockup progress UI contains no obsolete ten-scene count', !html.includes('جارٍ بناء 10 مشاهد ثلاثية الأبعاد')],
  ['Mockup cards and individual downloads are integrated into the app', html.includes('id="mockupGrid"') && html.includes('id="downloadMockups"') && html.includes('renderMockupGallery')],
  ['Complete mockup set is mandatory in ZIP export', html.includes("mockupAssets.length!==21") && html.includes("05-presentation-mockups/" )],
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
