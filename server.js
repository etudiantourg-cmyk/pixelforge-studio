import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);let vtracerInstance=null;function getVTracer(){if(!vtracerInstance)vtracerInstance=require('@visioncortex/vtracer');return vtracerInstance;}
function loadEnv(){try{for(const line of fs.readFileSync(path.join(ROOT,'.env'),'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['\"]|['\"]$/g,'');}}catch{}}
loadEnv();
const PORT=Number(process.env.PORT||8787),CF_ACCOUNT=()=>String(process.env.CLOUDFLARE_ACCOUNT_ID||'').trim(),CF_TOKEN=()=>String(process.env.CLOUDFLARE_API_TOKEN||'').trim();
const MODEL='@cf/black-forest-labs/flux-2-klein-4b';
const rateBuckets=new Map();let activeAI=0,activeVector=0;const MAX_CONCURRENT_AI=2,MAX_CONCURRENT_VECTOR=1;
function consumeRateLimit(req){const now=Date.now(),ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();let b=rateBuckets.get(ip);if(!b||now-b.started>=60_000)b={started:now,count:0};if(b.count>=5)return false;b.count++;rateBuckets.set(ip,b);if(rateBuckets.size>5000){for(const [key,value] of rateBuckets)if(now-value.started>120_000)rateBuckets.delete(key);}return true;}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
function send(res,status,data,type='application/json; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','Access-Control-Allow-Origin':'https://pixelforge-studio-app.onrender.com','Vary':'Origin'});res.end(type.startsWith('application/json')?JSON.stringify(data):data);}
async function readBody(req,max=25*1024*1024){let n=0,a=[];for await(const c of req){n+=c.length;if(n>max)throw Object.assign(new Error('حجم الصورة كبير جداً.'),{status:413});a.push(c);}return Buffer.concat(a).toString('utf8');}
function imageBuffer(data){const m=String(data||'').match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!m)throw Object.assign(new Error('الصورة المرسلة غير صالحة.'),{status:400});const buffer=Buffer.from(m[2],'base64');if(!buffer.length||buffer.length>18*1024*1024||buffer.toString('base64').replace(/=+$/,'')!==m[2].replace(/=+$/,''))throw Object.assign(new Error('حجم الصورة أو ترميزها غير صالح.'),{status:413});return {buffer,type:`image/${m[1]}`};}
async function runAI(prompt,image,dimensions={},reference=null){if(!CF_ACCOUNT()||!CF_TOKEN())throw Object.assign(new Error('إعدادات Cloudflare غير مكتملة على الخادم.'),{status:503});const form=new FormData();form.set('prompt',prompt);form.set('width',String(dimensions.width||1024));form.set('height',String(dimensions.height||1024));if(image){const im=imageBuffer(image);form.set('input_image_0',new Blob([im.buffer],{type:im.type}),'input-image.'+(im.type.split('/')[1]||'png'));}if(reference){const ref=imageBuffer(reference);form.set('input_image_1',new Blob([ref.buffer],{type:ref.type}),'reference-image.'+(ref.type.split('/')[1]||'png'));}const endpoint=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CF_ACCOUNT())}/ai/run/${MODEL}`;const r=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${CF_TOKEN()}`},body:form});const raw=await r.text();let d={};try{d=JSON.parse(raw)}catch{}if(!r.ok||d.success===false)throw Object.assign(new Error(d.errors?.[0]?.message||d.messages?.[0]?.message||`Cloudflare API error ${r.status}`),{status:r.status>=400&&r.status<600?r.status:502});let result=d.result||d;let img=result.image||result.images?.[0]?.image||result.images?.[0]||result.output?.image;if(typeof img==='object'&&img!==null)img=img.data||img.base64||img.url;if(typeof img!=='string')throw Object.assign(new Error('استجاب Cloudflare لكن لم يعثر الخادم على بيانات الصورة الناتجة.'),{status:502});return /^data:image\//.test(img)?img:`data:image/png;base64,${img}`;}
const server=http.createServer(async(req,res)=>{try{res.setHeader('Access-Control-Allow-Origin','https://pixelforge-studio-app.onrender.com');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Vary','Origin');if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}const url=new URL(req.url,'http://localhost');if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,configured:Boolean(CF_ACCOUNT()&&CF_TOKEN()),provider:'Cloudflare Workers AI'});if(req.method==='GET'&&url.pathname==='/api/settings')return send(res,200,{configured:Boolean(CF_ACCOUNT()&&CF_TOKEN()),provider:'Cloudflare Workers AI'});if(req.method==='POST'&&url.pathname==='/api/vectorize'){
const origin=req.headers.origin;
if(origin!=='https://pixelforge-studio-app.onrender.com')return send(res,403,{error:'مصدر الطلب غير مسموح.'});
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
const svg=getVTracer().convertBuffer(input.buffer,options);
if(typeof svg!=='string'||!svg.includes('<svg')||svg.length>25*1024*1024)return send(res,502,{error:'لم ينتج محرك VTracer ملف SVG صالحاً أو أن الملف تجاوز الحد.'});
return send(res,200,{ok:true,svg,engine:'VTracer 1.0 WASM',width,height,options});
}finally{activeVector--;}
}if(req.method==='POST'&&(url.pathname==='/api/edit'||url.pathname==='/api/generate')){
const origin=req.headers.origin;
if(origin&&origin!=='https://pixelforge-studio-app.onrender.com')return send(res,403,{error:'مصدر الطلب غير مسموح.'});
if(!consumeRateLimit(req))return send(res,429,{error:'تم تجاوز حد الطلبات المؤقت. حاول بعد دقيقة.'});
if(activeAI>=MAX_CONCURRENT_AI)return send(res,503,{error:'المحرك مشغول حالياً. حاول بعد قليل.'});
activeAI++;
try{
const body=JSON.parse(await readBody(req));
const prompt=String(body.prompt||'').trim();
if(!prompt)return send(res,400,{error:'اكتب تعليمات المهمة أولاً.'});
if(prompt.length>4000)return send(res,400,{error:'التعليمات أطول من الحد المسموح (4000 حرف).'});
if(url.pathname==='/api/generate'&&body.mode==='video')return send(res,501,{error:'توليد الفيديو غير متاح حالياً عبر محرك الصور.'});
if(url.pathname==='/api/generate'&&body.mode!=='image')return send(res,400,{error:'نوع المهمة غير معروف.'});
if(url.pathname==='/api/edit'&&!body.image)return send(res,400,{error:'اختر صورة أولاً.'});
const dims={width:1024,height:1024};
const result=await runAI(prompt,url.pathname==='/api/edit'?body.image:null,dims,url.pathname==='/api/edit'?(body.reference||null):null);
return send(res,200,{ok:true,result,image:result,provider:'Cloudflare Workers AI FLUX.2 Klein 4B'});
}finally{activeAI--;}
}if(req.method==='GET'&&url.pathname==='/api/status')return send(res,410,{error:'تم إلغاء نظام الانتظار القديم. أعد تحميل الصفحة لاستخدام المحرك الجديد.'});if((req.method==='GET'||req.method==='HEAD')&&(url.pathname==='/'||url.pathname==='/index.html')){const file=path.join(ROOT,'index.html');res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();return fs.createReadStream(file).pipe(res);}if(req.method==='GET'||req.method==='HEAD'){const pathname=decodeURIComponent(url.pathname);const file=path.resolve(ROOT,'.'+pathname);if(!file.startsWith(ROOT+path.sep))return send(res,403,'ممنوع','text/plain; charset=utf-8');if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,'غير موجود','text/plain; charset=utf-8');res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});if(req.method==='HEAD')return res.end();return fs.createReadStream(file).pipe(res);}send(res,404,{error:'المسار غير موجود.'});}catch(e){send(res,e.status||500,{error:e.message||'خطأ داخلي.'});}});
server.listen(PORT,'0.0.0.0',()=>console.log(`PIXELFORGE STUDIO listening on ${server.address().port}`));
