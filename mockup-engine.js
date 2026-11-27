/* PIXELFORGE Studio-rendered product mockups.
 * Uses free Three.js r128; all scenes are rendered locally in the browser.
 * These are procedural 3D renders, not photographs or licensed photo mockups.
 */
(function(){
  'use strict';
  const T=window.THREE;
  if(!T){window.PIXELFORGE_MOCKUPS={available:false,reason:'تعذر تحميل محرك العرض ثلاثي الأبعاد.'};return;}
  const items=[
    {id:'tshirt',name:'قميص وملابس',group:'الملابس'},
    {id:'tote',name:'حقيبة قماشية',group:'الحقائب'},
    {id:'shopping',name:'حقيبة تسوق ورقية',group:'الحقائب'},
    {id:'giftbox',name:'علبة هدايا فاخرة',group:'العلب والتغليف'},
    {id:'shipping',name:'صندوق شحن',group:'العلب والتغليف'},
    {id:'mug',name:'كوب سيراميك',group:'المنتجات'},
    {id:'bottle',name:'زجاجة ومنتج',group:'المنتجات'},
    {id:'cap',name:'قبعة',group:'الملابس'},
    {id:'sign',name:'لافتة واجهة',group:'اللافتات'},
    {id:'cards',name:'بطاقات أعمال',group:'المطبوعات'},
    {id:'letterhead',name:'ورق رسمي',group:'المطبوعات'},
    {id:'envelope',name:'ظرف مراسلات',group:'المطبوعات'},
    {id:'laptop',name:'حاسوب محمول',group:'الأجهزة'}
  ];
  function noiseTexture(base,kind){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
    x.fillStyle=base;x.fillRect(0,0,256,256);
    let seed=kind==='fabric'?17:kind==='paper'?31:47;
    for(let i=0;i<14000;i++){seed=(seed*1664525+1013904223)>>>0;const a=(seed&255)/255*.12;x.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';const px=seed%256,py=(seed>>>8)%256;x.fillRect(px,py,kind==='fabric'?1:2,kind==='fabric'?3:1);}
    if(kind==='fabric'){x.strokeStyle='rgba(30,25,20,.14)';x.lineWidth=.5;for(let i=0;i<256;i+=4){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(256,i);x.stroke();}}
    const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);tex.anisotropy=4;return tex;
  }
  function mat(color,kind='paper',rough=.82,metal=0){const tex=noiseTexture(color,kind);return new T.MeshStandardMaterial({color:0xffffff,map:tex,bumpMap:tex,bumpScale:kind==='fabric'?.018:.009,roughness:rough,metalness:metal});}
  function planeLogo(parent,texture,w,h,x,y,z,rotation=0){const ratio=texture.image?.width&&texture.image?.height?texture.image.width/texture.image.height:1;if(ratio>w/h)h=w/ratio;else w=h*ratio;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.z=rotation;m.renderOrder=5;parent.add(m);return m;}
  function curvedLogo(parent,texture,radius,width,height,centerY=0,centerZ=0){
    const ratio=texture.image?.width&&texture.image?.height?texture.image.width/texture.image.height:1;if(ratio>width/height)height=width/ratio;else width=height*ratio;
    const segments=48,rows=8,positions=[],uvs=[],indices=[];
    for(let y=0;y<=rows;y++)for(let x=0;x<=segments;x++){
      const u=x/segments,v=y/rows,theta=(u-.5)*width/radius;
      positions.push(radius*Math.sin(theta),centerY+(v-.5)*height,centerZ+radius*Math.cos(theta));
      uvs.push(u,v);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<segments;x++){
      const a=y*(segments+1)+x,b=a+segments+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
    const m=new T.Mesh(g,new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}));m.renderOrder=5;parent.add(m);return m;
  }
  function box(parent,w,h,d,material,x=0,y=0,z=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;}
  function tube(parent,points,r,material){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const m=new T.Mesh(new T.TubeGeometry(curve,48,r,10,false),material);parent.add(m);return m;}
  function shirt(parent,logo){
    const s=new T.Shape();s.moveTo(-.68,1.15);s.lineTo(-1.12,1.02);s.lineTo(-1.72,.55);s.lineTo(-1.35,-.08);s.lineTo(-1.02,.12);s.lineTo(-1.02,-1.25);s.quadraticCurveTo(0,-1.42,1.02,-1.25);s.lineTo(1.02,.12);s.lineTo(1.35,-.08);s.lineTo(1.72,.55);s.lineTo(1.12,1.02);s.lineTo(.68,1.15);s.quadraticCurveTo(0,.55,-.68,1.15);
    const g=new T.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.025,curveSegments:16});g.computeVertexNormals();const m=new T.Mesh(g,mat('#aeb3b5','fabric',.94));m.position.y=-.02;parent.add(m);planeLogo(parent,logo,.62,.62,0,.2,.19);
    tube(parent,[[-.65,1.12,.16],[-.35,.82,.17],[0,.7,.17],[.35,.82,.17],[.65,1.12,.16]],.012,mat('#aaa69f','fabric',.9));
  }
  function tote(parent,logo){
    box(parent,2.05,2.25,.18,mat('#a99c86','fabric',.98),0,-.05,0);
    box(parent,1.94,2.12,.025,mat('#9d907a','fabric',.98),0,-.05,.105);
    const strap=mat('#9e9079','fabric',.95);tube(parent,[[-.62,1.02,.02],[-.62,1.72,.02],[-.38,1.88,.02],[.38,1.88,.02],[.62,1.72,.02],[.62,1.02,.02]],.075,strap);
    planeLogo(parent,logo,.92,.92,0,-.05,.135);
  }
  function shopping(parent,logo){
    const paper=mat('#bba98d','paper',.94);box(parent,1.85,2.1,.62,paper,0,-.08,0);box(parent,.62,2.1,.025,mat('#b7a487','paper'),1.0,-.08,-.01);
    const rope=mat('#554638','fabric',.9);tube(parent,[[-.5,.96,.12],[-.5,1.55,.12],[-.28,1.7,.12],[.28,1.7,.12],[.5,1.55,.12],[.5,.96,.12]],.035,rope);
    planeLogo(parent,logo,.95,.85,0,-.12,.33);
  }
  function giftbox(parent,logo){
    box(parent,2.0,1.45,1.35,mat('#182b43','paper',.42),0,-.05,0);
    box(parent,2.08,.18,1.42,mat('#263e5b','paper',.38),0,.76,0);
    const gold=mat('#c4a36b','paper',.42,.5);box(parent,.15,1.42,1.45,gold,-.82,.0,.02);box(parent,2.06,.12,1.45,gold,0,.83,.02);
    planeLogo(parent,logo,.85,.62,0,-.05,.69);
  }
  function shipping(parent,logo){
    const kraft=mat('#b78d5d','paper',.95);box(parent,2.15,1.55,1.5,kraft,0,0,0);
    const tape=mat('#d7bd8d','paper',.88);box(parent,.28,.018,1.51,tape,0,.79,0);box(parent,2.15,.018,.28,tape,0,.79,0);
    planeLogo(parent,logo,.9,.7,0,.0,.77);
    const seam=mat('#8f6b47','paper',.96);box(parent,2.12,.012,.012,seam,0,.78,.76);
  }
  function mug(parent,logo){
    const ceramic=new T.MeshStandardMaterial({color:'#e8e5df',roughness:.22,metalness:.04});const body=new T.Mesh(new T.CylinderGeometry(.72,.68,1.35,64,1,true),ceramic);body.position.y=-.02;parent.add(body);
    const rim=new T.Mesh(new T.TorusGeometry(.70,.035,12,64),mat('#f5f2ec','paper',.18));rim.rotation.x=Math.PI/2;rim.position.y=.66;parent.add(rim);
    const handle=new T.Mesh(new T.TorusGeometry(.42,.09,18,48,Math.PI*1.8),ceramic);handle.position.set(.72,.02,0);handle.rotation.z=-Math.PI/2;parent.add(handle);
    curvedLogo(parent,logo,.724,.82,.68,-.02,0);
  }
  function bottle(parent,logo){
    const pts=[[0,-1.3],[.42,-1.3],[.48,-1.15],[.5,-.6],[.48,.48],[.4,.72],[.23,.9],[.2,1.16],[.25,1.2],[.25,1.3],[0,1.3]].map(p=>new T.Vector2(p[0],p[1]));
    const g=new T.LatheGeometry(pts,64);const glass=new T.MeshPhysicalMaterial({color:'#c5d5c8',roughness:.16,metalness:.05,transmission:.18,transparent:true,opacity:.9,clearcoat:.8});const m=new T.Mesh(g,glass);parent.add(m);
    const cap=new T.Mesh(new T.CylinderGeometry(.26,.26,.18,48),mat('#263b35','paper',.35));cap.position.y=1.35;parent.add(cap);
    curvedLogo(parent,logo,.505,.68,.62,-.1,0);
  }
  function cap(parent,logo){
    const dome=new T.Mesh(new T.SphereGeometry(.9,48,32,0,Math.PI*2,0,Math.PI/2),mat('#283b53','fabric',.96));dome.scale.set(1.12,.92,1);dome.position.y=-.05;parent.add(dome);
    const brimShape=new T.Shape();brimShape.moveTo(-.82,-.12);brimShape.quadraticCurveTo(0,-1.05,.82,-.12);brimShape.quadraticCurveTo(0,.15,-.82,-.12);
    const brim=new T.Mesh(new T.ExtrudeGeometry(brimShape,{depth:.09,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2}),mat('#1c2c40','fabric',.94));brim.position.set(0,-.42,.28);parent.add(brim);
    planeLogo(parent,logo,.52,.45,0,.12,.82);
  }
  function sign(parent,logo){
    const wall=mat('#d0cdc5','paper',.96);box(parent,3.5,2.5,.2,wall,0,-.05,-.35);
    const panel=mat('#1a2a3d','paper',.38,.12);box(parent,3.0,1.25,.2,panel,0,.05,-.18);
    const edge=mat('#c2a16a','paper',.32,.65);box(parent,3.08,.035,.23,edge,0,.70,-.16);box(parent,3.08,.035,.23,edge,0,-.60,-.16);
    planeLogo(parent,logo,1.55,.72,0,.05,-.065);
    const pin=mat('#9e9b94','paper',.35,.7);for(const x of [-1.42,1.42]){const p=new T.Mesh(new T.CylinderGeometry(.035,.035,.035,20),pin);p.rotation.x=Math.PI/2;p.position.set(x,.05,-.05);parent.add(p);}
  }
  function cards(parent,logo){
    const dark=mat('#172638','paper',.5),light=mat('#f2eee5','paper',.7);
    const a=box(parent,2.3,1.35,.045,dark,-.22,.12,0);a.rotation.y=-.16;a.rotation.z=-.08;
    const b=box(parent,2.3,1.35,.045,light,.24,-.18,.12);b.rotation.y=.12;b.rotation.z=.06;
    planeLogo(parent,logo,.78,.55,.24,-.18,.151,.06);
  }
  function letterhead(parent,logo){
    box(parent,2.25,3.0,.045,mat('#f7f4ed','paper',.92),0,0,0);
    planeLogo(parent,logo,.9,.52,-.48,1.05,.035);
    const ink=mat('#aeb4bc','paper',.9);for(let i=0;i<8;i++)box(parent,1.55-i%3*.12,.012,.008,ink,.15,.55-i*.22,.032);
    const gold=mat('#c2a16b','paper',.55,.35);box(parent,1.75,.018,.01,gold,0,-1.23,.033);
  }
  function envelope(parent,logo){
    box(parent,2.5,1.48,.065,mat('#e9e3d7','paper',.9),0,0,0);
    const flap=new T.Shape();flap.moveTo(-1.22,.7);flap.lineTo(0,-.12);flap.lineTo(1.22,.7);flap.lineTo(-1.22,.7);
    const fm=new T.Mesh(new T.ShapeGeometry(flap),mat('#d9d1c3','paper',.94));fm.position.z=.039;parent.add(fm);
    tube(parent,[[-1.18,-.68,.04],[0,.12,.04],[1.18,-.68,.04]],.009,mat('#b7ad9e','paper',.92));
    planeLogo(parent,logo,.62,.42,-.62,-.18,.052);
  }
  function laptop(parent,logo){
    const screen=mat('#252a31','paper',.3,.72);box(parent,2.45,1.62,.12,screen,0,.35,-.45);
    box(parent,2.32,1.48,.018,mat('#111923','paper',.22,.1),0,.35,-.375);
    planeLogo(parent,logo,1.0,.72,0,.35,-.36);
    const base=mat('#aeb5bd','paper',.38,.72);box(parent,2.7,.13,1.72,base,0,-.56,.24);
    const keys=mat('#333941','paper',.5,.2);for(let row=0;row<4;row++)for(let col=0;col<12;col++)box(parent,.13,.018,.12,keys,-.92+col*.167,-.485,.02+row*.19);
    box(parent,.55,.018,.34,mat('#8c949e','paper',.42,.6),0,-.485,.79);
  }
  const builders={tshirt:shirt,tote,shopping,giftbox,shipping,mug,bottle,cap,sign,cards,letterhead,envelope,laptop};
  async function render(svg,onProgress){
    if(!window.WebGLRenderingContext)throw Error('المتصفح لا يدعم WebGL اللازم لعرض النماذج ثلاثية الأبعاد.');
    const logoUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{
      const logoTexture=await new Promise((resolve,reject)=>new T.TextureLoader().load(logoUrl,t=>{t.encoding=T.sRGBEncoding;t.anisotropy=8;resolve(t);},undefined,reject));
      const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
      renderer.setPixelRatio(1);renderer.setSize(1200,900,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
      const out=[];
      try{
        for(const item of items){
          const scene=new T.Scene();scene.background=new T.Color('#d9d5ce');
          const camera=new T.PerspectiveCamera(34,4/3,.1,100);
          scene.add(new T.HemisphereLight(0xffffff,0x665f56,.68));
          const key=new T.DirectionalLight(0xfff0dc,1.75);key.position.set(-3.5,6,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.bias=-.0002;scene.add(key);
          const fill=new T.DirectionalLight(0xd5e2ff,.38);fill.position.set(4,2,3);scene.add(fill);
          const rim=new T.DirectionalLight(0xffffff,.68);rim.position.set(0,4,-4);scene.add(rim);
          const floorY=-1.65;
          const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#a9a39a',roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=floorY-.012;floor.receiveShadow=true;scene.add(floor);
          const group=new T.Group();scene.add(group);builders[item.id](group,logoTexture);
          group.updateMatrixWorld(true);
          const bounds=new T.Box3().setFromObject(group),dimensions=bounds.getSize(new T.Vector3());
          const lift=floorY-bounds.min.y;group.position.y+=lift;bounds.min.y+=lift;bounds.max.y+=lift;
          const center=bounds.getCenter(new T.Vector3()),vFov=T.MathUtils.degToRad(camera.fov),hFov=2*Math.atan(Math.tan(vFov/2)*camera.aspect);
          const fit=Math.max(dimensions.y/(2*Math.tan(vFov/2)),dimensions.x/(2*Math.tan(hFov/2)),dimensions.z/(2*Math.tan(hFov/2)));
          const distance=Math.max(5.2,fit*1.32),direction=new T.Vector3(3.6,2.6,6.7).normalize();
          camera.position.copy(center).addScaledVector(direction,distance);camera.near=Math.max(.05,distance/100);camera.far=distance*12;camera.updateProjectionMatrix();camera.lookAt(center);
          group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
          renderer.render(scene,camera);
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
          const blob=await new Promise((resolve,reject)=>renderer.domElement.toBlob(b=>b?resolve(b):reject(Error('تعذر حفظ صورة العرض.')),'image/png'));
          out.push({id:item.id,name:item.name,group:item.group,blob});if(typeof onProgress==='function')onProgress(item,out.length,items.length);
          scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m.map&&m.map!==logoTexture)m.map.dispose();if(m.bumpMap&&m.bumpMap!==m.map)m.bumpMap.dispose();m.dispose();});}});
          scene.clear();
        }
      }finally{renderer.dispose();renderer.forceContextLoss();logoTexture.dispose();}
      return out;
    }finally{URL.revokeObjectURL(logoUrl);}
  }
  window.PIXELFORGE_MOCKUPS={available:true,items,render};
})();