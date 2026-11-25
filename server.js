import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.dirname(fileURLToPath(import.meta.url));
function loadEnv(){
  try { for(const line of fs.readFileSync(path.join(ROOT,".env"),"utf8").split(/\r?\n/)){
    const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if(m && !process.env[m[1]]) process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,"");
  }} catch {}
}
loadEnv();
const PORT=Number(process.env.PORT||8787), FAL_KEY=()=>process.env.FAL_KEY||"", ADMIN_PASSWORD=()=>process.env.ADMIN_PASSWORD||"";
const API="https://queue.fal.run";
const MODELS={edit:"fal-ai/flux-kontext/dev",image:"fal-ai/flux/dev",video:"fal-ai/wan/v2.7/image-to-video"};
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".txt":"text/plain; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon"};
function send(res,status,data,type="application/json; charset=utf-8") {res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store"});res.end(type.startsWith("application/json")?JSON.stringify(data):data);}
async function readBody(req,max=190*1024*1024){let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>max)throw Object.assign(new Error("حجم البيانات كبير جداً."),{status:413});chunks.push(c);}return Buffer.concat(chunks).toString("utf8");}
async function submit(model,input){
  const r=await fetch(`${API}/${model}`,{method:"POST",headers:{Authorization:`Key ${FAL_KEY()}`,"Content-Type":"application/json"},body:JSON.stringify(input)});
  const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(d.detail||d.message||`fal API ${r.status}`),{status:r.status});return {...d,model};
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    if(req.method==="GET"&&url.pathname==="/api/health")return send(res,200,{ok:true,configured:Boolean(FAL_KEY()),adminConfigured:Boolean(ADMIN_PASSWORD())});
    if(url.pathname.startsWith("/api/") && url.pathname!=="/api/health" && url.pathname!=="/api/download") {
      const supplied=String(req.headers["x-admin-password"]||"");
      if(!ADMIN_PASSWORD() || supplied.length!==ADMIN_PASSWORD().length || supplied!==ADMIN_PASSWORD()) return send(res,401,{error:"رمز الإدارة غير صحيح أو لم يتم إدخاله."});
    }
    if(url.pathname==="/api/settings"&&req.method==="GET")return send(res,200,{configured:Boolean(FAL_KEY())});
    if(url.pathname==="/api/settings"&&req.method==="POST"){
      const body=JSON.parse(await readBody(req,16*1024));
      const key=String(body.falKey||"").trim();
      if(!key||key.length<12||key.length>4096||/[\r\n\0]/.test(key))return send(res,400,{error:"المفتاح فارغ أو بصيغة غير صالحة."});
      process.env.FAL_KEY=key;
      return send(res,200,{ok:true,configured:true,message:"تم تفعيل المفتاح في ذاكرة الخادم. لن يظهر في المتصفح؛ أعد إدخاله إذا أُعيد تشغيل الخدمة."});
    }
    if(url.pathname==="/api/settings"&&req.method==="DELETE"){
      delete process.env.FAL_KEY;
      return send(res,200,{ok:true,configured:false,message:"تم حذف مفتاح fal من ذاكرة الخادم."});
    }
    if(req.method==="POST"&&["/api/edit","/api/generate"].includes(url.pathname)){
      if(!FAL_KEY())return send(res,503,{error:"محرك الذكاء الاصطناعي غير مفعّل على الخادم حالياً."});
      const body=JSON.parse(await readBody(req));const prompt=String(body.prompt||"").trim();if(!prompt)return send(res,400,{error:"اكتب تعليمات التعديل."});
      let model,input;
      if(url.pathname==="/api/edit"){
        if(typeof body.image!=="string"||!/^data:image\/(png|jpeg|webp);base64,/.test(body.image))return send(res,400,{error:"الصورة المرسلة غير صالحة."});
        model=MODELS.edit;input={prompt,image_url:body.image,num_images:1};
      }else if(body.mode==="image"){
        model=MODELS.image;input={prompt,image_size:body.aspect_ratio||"square_hd",num_images:1};
      }else if(body.mode==="video"){
        if(typeof body.image!=="string"||!body.image.startsWith("data:image/"))return send(res,400,{error:"اختر صورة لتحريكها."});
        model=MODELS.video;input={prompt,image_url:body.image};
      }else return send(res,400,{error:"نوع المهمة غير معروف."});
      return send(res,200,await submit(model,input));
    }
    if(req.method==="GET"&&url.pathname==="/api/status"){
      if(!FAL_KEY())return send(res,503,{error:"محرك الذكاء الاصطناعي غير مفعّل."});
      const model=url.searchParams.get("model")||"",id=url.searchParams.get("requestId")||"";
      if(!Object.values(MODELS).includes(model)||!/^[a-zA-Z0-9-]+$/.test(id))return send(res,400,{error:"معرّف المهمة غير صالح."});
      const base=`${API}/${model}/requests/${id}`,headers={Authorization:`Key ${FAL_KEY()}`};
      const sr=await fetch(`${base}/status`,{headers}),sd=await sr.json().catch(()=>({}));if(!sr.ok)return send(res,sr.status,{error:sd.detail||"تعذر جلب حالة المهمة."});
      if(sd.status==="COMPLETED"){const rr=await fetch(base,{headers}),rd=await rr.json().catch(()=>({}));if(!rr.ok)return send(res,rr.status,{error:rd.detail||"تعذر جلب النتيجة."});return send(res,200,{status:"COMPLETED",...rd});}
      return send(res,200,sd);
    }
    if(req.method==="GET"&&url.pathname==="/api/download"){
      const remote=new URL(url.searchParams.get("url")||"");
      if(remote.protocol!=="https:"||!["fal.media","v3.fal.media","storage.googleapis.com"].includes(remote.hostname))return send(res,400,"رابط ملف غير مسموح.","text/plain; charset=utf-8");
      const upstream=await fetch(remote);if(!upstream.ok)return send(res,upstream.status,"تعذر جلب الملف الناتج.","text/plain; charset=utf-8");
      const type=upstream.headers.get("content-type")||"application/octet-stream";if(!type.startsWith("image/")&&!type.startsWith("video/"))return send(res,415,"نوع ملف غير مدعوم.","text/plain; charset=utf-8");
      const bytes=Buffer.from(await upstream.arrayBuffer());res.writeHead(200,{"Content-Type":type,"Content-Length":bytes.length,"Content-Disposition":`attachment; filename="pixelforge-result.${type.startsWith("video/")?"mp4":"png"}"`});return res.end(bytes);
    }
    if(req.method==="GET"||req.method==="HEAD"){
      let pathname=decodeURIComponent(url.pathname);if(pathname==="/")pathname="/index.html";
      const file=path.resolve(ROOT,"."+pathname);if(!file.startsWith(ROOT+path.sep))return send(res,403,"ممنوع","text/plain; charset=utf-8");
      if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,"غير موجود","text/plain; charset=utf-8");
      res.writeHead(200,{"Content-Type":mime[path.extname(file).toLowerCase()]||"application/octet-stream","Cache-Control":"no-cache"});if(req.method==="HEAD")return res.end();return fs.createReadStream(file).pipe(res);
    }
    send(res,404,{error:"المسار غير موجود."});
  }catch(e){send(res,e.status||500,{error:e.message||"خطأ داخلي."});}
});
server.listen(PORT,"0.0.0.0",()=>console.log(`PIXELFORGE STUDIO running at http://localhost:${PORT}`));
