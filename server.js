import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);let vtracerInstance=null;function getVTracer(){if(!vtracerInstance)vtracerInstance=require('@visioncortex/vtracer');return vtracerInstance;}
const PORT=Number(process.env.PORT||8787);
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||'https://pixelforge-studio-app.onrender.com';
const rateBuckets=new Map();let activeVector=0;const MAX_CONCURRENT_VECTOR=1;
function ensureSvgViewBox(svg,width,height){const start=svg.indexOf('<svg');if(start<0)throw new Error('VTracer SVG root missing');const end=svg.indexOf('>',start);if(end<0)throw new Error('VTracer SVG root is incomplete');const root=svg.slice(start,end+1);if(root.toLowerCase().includes('viewbox='))return svg;const updated=root.slice(0,-1)+` viewBox="0 0 ${width} ${height}"`+'>';return svg.slice(0,start)+updated+svg.slice(end+1);}
function originAllowed(req){const origin=req.headers.origin;if(origin)return origin===ALLOWED_ORIGIN;const referer=req.headers.referer;if(!referer)return false;try{return new URL(referer).origin===ALLOWED_ORIGIN;}catch{return false;}}
function consumeRateLimit(req){const now=Date.now(),ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();let b=rateBuckets.get(ip);if(!b||now-b.started>=60_000)b={started:now,count:0};if(b.count>=5)return false;b.count++;rateBuckets.set(ip,b);if(rateBuckets.size>5000){for(const [key,value] of rateBuckets)if(now-value.started>120_000)rateBuckets.delete(key);}return true;}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
function send(res,status,data,type='application/json; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Vary':'Origin'});res.end(type.startsWith('application/json')?JSON.stringify(data):data);}
async function readBody(req,max=25*1024*1024){let n=0,a=[];for await(const c of req){n+=c.length;if(n>max)throw Object.assign(new Error('حجم الصورة كبير جداً.'),{status:413});a.push(c);}return Buffer.concat(a).toString('utf8');}
function imageBuffer(data){const m=String(data||'').match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!m)throw Object.assign(new Error('الصورة المرسلة غير صالحة.'),{status:400});const buffer=Buffer.from(m[2],'base64');if(!buffer.length||buffer.length>18*1024*1024||buffer.toString('base64').replace(/=+$/,'')!==m[2].replace(/=+$/,''))throw Object.assign(new Error('حجم الصورة أو ترميزها غير صالح.'),{status:413});return {buffer,type:`image/${m[1]}`};}
const server=http.createServer(async(req,res)=>{try{res.setHeader('Access-Control-Allow-Origin',ALLOWED_ORIGIN);res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Vary','Origin');if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}const url=new URL(req.url,'http://localhost');if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,engine:'VTracer 1.0 WASM',mode:'CPU',requiresApiKey:false});if(req.method==='POST'&&url.pathname==='/api/vectorize'){
if(!originAllowed(req))return send(res,403,{error:'مصدر الطلب غير مسموح.'});
if(!consumeRateLimit(req))return send(res,429,{error:'تم تجاوز حد الطلبات المؤقت. حاول بعد دقيقة.'});
if(activeVector>=MAX_CONCURRENT_VECTOR)return send(res,503,{error:'محرك التحويل المتجهي مشغول حالياً. حاول بعد قليل.'});
activeVector++;
try{
const body=JSON.parse(await readBody(req,25*1024*1024));
const input=imageBuffer(body.image);
if(input.type!=='image/png'||input.buffer.length<24||!input.buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||input.buffer.toString('ascii',12,16)!=='IHDR')return send(res,400,{error:'أرسل صورة PNG صالحة لمحرك التحويل المتجهي.'});
const width=input.buffer.readUInt32BE(16),height=input.buffer.readUInt32BE(20);
if(!width||!height||width>1800||height>1800||width*height>3240000)return send(res,413,{error:'أبعاد صورة التحويل يجب ألا تتجاوز 1800×1800 أو 3.24 مليون بكسل.'});
const options={mode:'spline',hierarchical:'stacked',filterSpeckle:Math.max(0,Math.min(128,Number(body.speckle)||0)),maxColors:Math.max(2,Math.min(16,Number(body.colors)||8)),simplify:Math.max(0.5,Math.min(2.5,Number(body.simplify)||1.5)),optimize:2};
const rawSvg=getVTracer().convertBuffer(input.buffer,options);
const svg=ensureSvgViewBox(rawSvg,width,height);
if(typeof svg!=='string'||!svg.includes('<svg')||svg.length>25*1024*1024)return send(res,502,{error:'لم ينتج محرك VTracer ملف SVG صالحاً أو أن الملف تجاوز الحد.'});
return send(res,200,{ok:true,svg,engine:'VTracer 1.0 WASM',width,height,options});
}finally{activeVector--;}
}if(req.method==='GET'&&url.pathname==='/api/status')return send(res,410,{error:'تم إلغاء نظام الانتظار القديم. أعد تحميل الصفحة لاستخدام المحرك الجديد.'});if((req.method==='GET'||req.method==='HEAD')&&(url.pathname==='/'||url.pathname==='/index.html')){const file=path.join(ROOT,'index.html');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();return fs.createReadStream(file).pipe(res);}if(req.method==='GET'||req.method==='HEAD'){const pathname=decodeURIComponent(url.pathname);const file=path.resolve(ROOT,'.'+pathname);if(!file.startsWith(ROOT+path.sep))return send(res,403,'ممنوع','text/plain; charset=utf-8');if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,'غير موجود','text/plain; charset=utf-8');res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();return fs.createReadStream(file).pipe(res);}send(res,404,{error:'المسار غير موجود.'});}catch(e){send(res,e.status||500,{error:e.message||'خطأ داخلي.'});}});
server.listen(PORT,'0.0.0.0',()=>console.log(`PIXELFORGE STUDIO listening on ${server.address().port}`));
