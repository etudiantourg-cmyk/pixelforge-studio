import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'));
const mockupEngine = fs.readFileSync(path.join(root, 'mockup-engine.js'));
const three = fs.readFileSync(path.join(root, 'node_modules/three/build/three.min.js'));
const rgbeLoader = fs.readFileSync(path.join(root, 'node_modules/three/examples/js/loaders/RGBELoader.js'));
const jszip = fs.readFileSync(path.join(root, 'node_modules/jszip/dist/jszip.min.js'));
const jspdf = fs.readFileSync(path.join(root, 'node_modules/jspdf/dist/jspdf.umd.min.js'));
const svg2pdf = fs.readFileSync(path.join(root, 'node_modules/svg2pdf.js/dist/svg2pdf.umd.min.js'));
const artifactDir = path.join(root, 'artifacts', 'e2e-browser');
fs.mkdirSync(artifactDir, { recursive: true });

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
function pngChunk(type,data){
  const name=Buffer.from(type),out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0);name.copy(out,4);data.copy(out,8);
  out.writeUInt32BE(crc32(Buffer.concat([name,data])),8+data.length);
  return out;
}
function makePng(width,height){
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
  const rows=Buffer.alloc(height*(1+width*4));
  for(let y=0;y<height;y++){const row=y*(1+width*4);rows[row]=0;for(let x=0;x<width;x++){const p=row+1+x*4,inside=x>=12&&x<=width-13&&y>=12&&y<=height-13;rows[p]=inside?20:255;rows[p+1]=inside?35:255;rows[p+2]=inside?55:255;rows[p+3]=255;}}
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',ihdr),pngChunk('IDAT',deflateSync(rows)),pngChunk('IEND',Buffer.alloc(0))]);
}

const portProbe=http.createServer();
await new Promise(resolve=>portProbe.listen(0,'127.0.0.1',resolve));
const port=portProbe.address().port;
await new Promise(resolve=>portProbe.close(resolve));
const origin='http://127.0.0.1:'+port;
const localHtml=html.toString('utf8').replace('https://pixelforge-studio-zajl.onrender.com/api/vectorize','/api/vectorize');
if(localHtml===html.toString('utf8'))throw new Error('Vector API URL rewrite was not applied');
let browser,backend;
const failures=[];
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({acceptDownloads:true});
  page.setDefaultTimeout(180000);
  page.on('pageerror',e=>failures.push(e.message));
  page.on('requestfailed',request=>failures.push('request failed: '+request.url()+' · '+request.failure()?.errorText));
  page.on('console',m=>{if(m.type()==='error')failures.push('console: '+m.text());});
  await page.route('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:jszip}));
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:jspdf}));
  await page.route('https://cdn.jsdelivr.net/npm/svg2pdf.js@2.9.0/dist/svg2pdf.umd.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:svg2pdf}));
  await page.route('https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:'window.ImageTracer={};'}));
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:three}));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/RGBELoader.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:rgbeLoader}));
  backend=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),ALLOWED_ORIGIN:origin},stdio:['ignore','pipe','pipe']});
  let backendError='',backendStdout='';
  backend.stderr.on('data',chunk=>{backendError+=chunk.toString();});
  const healthResponse=await fetch(origin+'/api/health');
  const healthPayload=await healthResponse.json();
  assert.equal(healthResponse.status,200,'local VTracer health endpoint must respond');
  assert.equal(healthPayload.engine,'VTracer 1.0 WASM','local API must expose the actual VTracer engine');
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Local VTracer API startup timed out. '+backendError)),15000);
    backend.once('error',error=>{clearTimeout(timer);reject(error);});
    backend.once('exit',code=>{clearTimeout(timer);reject(new Error('Local VTracer API exited early ('+code+'). '+backendError));});
    backend.stdout.on('data',chunk=>{backendStdout+=chunk.toString();if(backendStdout.includes('listening on '+port)){clearTimeout(timer);resolve();}});
  });
  await page.route(origin+'/',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:localHtml}));
  await page.route(origin+'/index.html',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:localHtml}));
  await page.goto(origin+'/',{waitUntil:'load',timeout:60000});
  const servedHtml=await page.content();
  assert.ok(servedHtml.includes('/api/vectorize')&&!servedHtml.includes('pixelforge-studio-zajl.onrender.com/api/vectorize'),'E2E page must use the local same-origin VTracer endpoint');
  await page.waitForFunction(()=>window.JSZip&&window.jspdf?.jsPDF&&typeof new window.jspdf.jsPDF().svg==='function');
  const inputPng=makePng(64,64);
  await page.locator('#sourceFile').setInputFiles({name:'brand-test.png',mimeType:'image/png',buffer:inputPng});
  await page.waitForFunction(()=>document.querySelector('#convert')?.disabled===false);
  await page.locator('#convert').click();
  try{
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('اكتمل التتبع بمحرك VTracer 1.0 WASM'),null,{timeout:60000});
  }catch(error){
    const status=await page.locator('#status').textContent().catch(()=>'<missing status>');
    throw new Error('Real VTracer browser conversion did not complete. UI status='+status+'; backend stdout='+backendStdout+'; backend stderr='+backendError+'; browser errors='+failures.join(' | ')+'; '+error.message);
  }
  assert.ok((await page.locator('#diagnostics').textContent()).includes('عدد المسارات:'),'real VTracer output must populate vector diagnostics');
  await page.waitForFunction(()=>document.querySelectorAll('.mockupCard').length===21);
  assert.equal(await page.evaluate(()=>window.PIXELFORGE_MOCKUPS?.environmentStatus),'loaded','real mockup engine must load the Poly Haven HDRI');
  assert.equal(await page.locator('#downloadSvg').isDisabled(),false,'SVG export should be enabled');
  assert.equal(await page.locator('#downloadPdf').isDisabled(),false,'PDF export should be enabled');
  assert.equal(await page.locator('#downloadPack').isDisabled(),false,'ZIP export should be enabled');

  const saveDownload=async(selector,name)=>{
    const pending=page.waitForEvent('download');
    await page.locator(selector).click();
    const download=await pending;
    const target=path.join(artifactDir,name);
    await download.saveAs(target);
    return target;
  };
  const svgPath=await saveDownload('#downloadSvg','brand-test.svg');
  const svgText=fs.readFileSync(svgPath,'utf8');
  assert.ok(svgText.trimStart().startsWith('<svg'),'downloaded SVG must contain an SVG root');

  const pngPath=await saveDownload('#downloadPng','brand-test-2048.png');
  const png=fs.readFileSync(pngPath);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','PNG export must have a real PNG signature');
  assert.equal(png.readUInt32BE(16),2048,'PNG export must be 2048 pixels wide');
  assert.equal(png.readUInt32BE(20),2048,'PNG export must be 2048 pixels high');

  const pdfPath=await saveDownload('#downloadPdf','brand-test.pdf');
  const pdf=fs.readFileSync(pdfPath);
  assert.equal(pdf.subarray(0,5).toString('ascii'),'%PDF-','PDF export must be a real PDF document');

  const zipPath=await saveDownload('#downloadPack','brand-test-assets.zip');
  const zipBytes=fs.readFileSync(zipPath);
  assert.equal(zipBytes.subarray(0,2).toString('ascii'),'PK','ZIP export must be a real ZIP archive');
  const zip=await JSZip.loadAsync(zipBytes);
  const names=Object.keys(zip.files).filter(name=>!zip.files[name].dir);
  assert.ok(names.includes('01-master/brand-test.svg'),'ZIP must contain the SVG master');
  assert.ok(names.includes('01-master/brand-test.pdf'),'ZIP must contain the vector PDF master');
  assert.ok(names.includes('01-master/brand-test-black.pdf'),'ZIP must contain the black PDF variant');
  assert.ok(names.includes('01-master/brand-test-white.pdf'),'ZIP must contain the white PDF variant');
  assert.ok(names.includes('03-documentation/brand-manifest.json'),'ZIP must contain the machine-readable brand manifest');
  assert.ok(names.includes('03-documentation/brand-guidelines.html'),'ZIP must contain the brand guide');
  assert.equal(names.filter(n=>n.startsWith('05-presentation-mockups/')).length,21,'ZIP must contain all twenty-one presentation assets');
  assert.ok(names.includes('02-digital/png-2048/brand-test-2048.png'),'ZIP must contain the 2048px digital export');
  const embeddedPdf=await zip.file('01-master/brand-test.pdf').async('nodebuffer');
  assert.equal(embeddedPdf.subarray(0,5).toString('ascii'),'%PDF-','embedded PDF must be valid');
  const manifest=JSON.parse(await zip.file('03-documentation/brand-manifest.json').async('string'));
  assert.equal(manifest.approval,'NOT HUMAN APPROVED','package must not misrepresent automated tracing as human approved');
  await page.setViewportSize({width:390,height:844});
  const mobileLayout=await page.evaluate(()=>({viewport:window.innerWidth,document:document.documentElement.scrollWidth}));
  assert.ok(mobileLayout.document<=mobileLayout.viewport+2,'mobile viewport must not introduce horizontal page overflow');
  assert.equal(await page.locator('label[for="sourceFile"]').isVisible(),true,'mobile upload control must remain visible');
  assert.equal(await page.locator('#convert').isVisible(),true,'mobile conversion control must remain visible');
  assert.deepEqual(failures,[],'browser must not report uncaught JavaScript or console errors');
  fs.writeFileSync(path.join(artifactDir,'e2e-summary.json'),JSON.stringify({source:'brand-test.png',svgBytes:svgText.length,pngBytes:png.length,pdfBytes:pdf.length,zipBytes:zipBytes.length,zipFiles:names.length,mockupAssets:names.filter(n=>n.startsWith('05-presentation-mockups/')).length,mockupRenderer:'REAL_WEBGL_21_SCENES',mobileViewport:'PASS',vectorPdf:'PASS',svg:'PASS',png:'PASS',zip:'PASS'},null,2));
  console.log('PIXELFORGE BROWSER E2E: PASS — upload, real VTracer vectorization, real 21-scene WebGL mockups, SVG/PNG/PDF downloads, and complete ZIP package verified.');
}finally{
  if(browser)await browser.close();
  if(backend){backend.kill('SIGTERM');await Promise.race([once(backend,'exit'),new Promise(resolve=>setTimeout(resolve,3000))]);}

}
