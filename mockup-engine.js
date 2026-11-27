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
    {id:'laptop',name:'حاسوب محمول',group:'الأجهزة'},
    {id:'hoodie',name:'سترة بغطاء رأس',group:'الملابس'},
    {id:'polo',name:'قميص بولو',group:'الملابس'},
    {id:'backpack',name:'حقيبة ظهر',group:'الحقائب'},
    {id:'mailer',name:'علبة شحن فاخرة',group:'العلب والتغليف'},
    {id:'tube',name:'عبوة أسطوانية',group:'المنتجات'},
    {id:'phone',name:'هاتف ذكي',group:'الأجهزة'},
    {id:'billboard',name:'لوحة إعلانية خارجية',group:'اللافتات'},
    {id:'van',name:'مركبة توصيل',group:'المركبات'}
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
    const g=new T.ExtrudeGeometry(s,{depth:.12,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.025,curveSegments:16});g.computeVertexNormals();const m=new T.Mesh(g,mat('#8c949b','fabric',.94));m.position.y=-.02;parent.add(m);const decal=planeLogo(parent,logo,.62,.62,0,.2,.19);
    tube(parent,[[-.65,1.12,.16],[-.35,.82,.17],[0,.7,.17],[.35,.82,.17],[.65,1.12,.16]],.012,mat('#aaa69f','fabric',.9));return decal;
  }
  function tote(parent,logo){
    box(parent,2.05,2.25,.18,mat('#82735f','fabric',.98),0,-.05,0);
    box(parent,1.94,2.12,.025,mat('#766953','fabric',.98),0,-.05,.105);
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
    const crownMat=mat('#283b53','fabric',.96),brimMat=mat('#1c2c40','fabric',.94),stitch=mat('#8390a0','fabric',.9);
    const dome=new T.Mesh(new T.SphereGeometry(.9,64,40,0,Math.PI*2,0,Math.PI/2),crownMat);dome.scale.set(1.12,.92,1);dome.position.y=-.05;parent.add(dome);
    // A continuous curved visor joined to the crown instead of a detached flat wedge.
    const visor=new T.Shape();visor.moveTo(-.79,-.01);visor.bezierCurveTo(-.9,-.2,-.72,-.78,0,-.96);visor.bezierCurveTo(.72,-.78,.9,-.2,.79,-.01);visor.bezierCurveTo(.48,.13,-.48,.13,-.79,-.01);visor.closePath();
    const vg=new T.ExtrudeGeometry(visor,{depth:.075,bevelEnabled:true,bevelSegments:4,bevelSize:.035,bevelThickness:.025,curveSegments:24});vg.computeVertexNormals();
    const brim=new T.Mesh(vg,brimMat);brim.rotation.x=-Math.PI/2;brim.position.set(0,-.045,.02);parent.add(brim);
    // Crown panel seams and top button give the cap readable construction.
    for(let a=0;a<6;a++){const ang=a*Math.PI/3;const pts=[];for(let i=0;i<=12;i++){const t=i/12*Math.PI/2;pts.push([Math.sin(t)*.9*Math.cos(ang),-.05+Math.cos(t)*.84,Math.sin(t)*.9*Math.sin(ang)]);}tube(parent,pts,.008,stitch);}
    const button=new T.Mesh(new T.SphereGeometry(.075,20,12),brimMat);button.position.set(0,.79,0);parent.add(button);
    planeLogo(parent,logo,.48,.38,0,.18,.79);
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
  function hoodie(parent,logo){
    const s=new T.Shape();s.moveTo(-.7,1.0);s.lineTo(-1.12,.9);s.lineTo(-1.7,.45);s.lineTo(-1.38,-.1);s.lineTo(-1.02,.1);s.lineTo(-1.02,-1.3);s.quadraticCurveTo(0,-1.48,1.02,-1.3);s.lineTo(1.02,.1);s.lineTo(1.38,-.1);s.lineTo(1.7,.45);s.lineTo(1.12,.9);s.lineTo(.7,1.0);s.quadraticCurveTo(0,.7,-.7,1.0);
    const g=new T.ExtrudeGeometry(s,{depth:.16,bevelEnabled:true,bevelSegments:4,bevelSize:.045,bevelThickness:.03,curveSegments:20});const body=new T.Mesh(g,mat('#3e4a5b','fabric',.97));parent.add(body);
    const hood=new T.Mesh(new T.SphereGeometry(.57,40,24,0,Math.PI*2,0,Math.PI/2),mat('#4b5667','fabric',.98));hood.scale.set(1,.8,.38);hood.position.set(0,1.0,-.08);parent.add(hood);
    box(parent,1.0,.42,.055,mat('#4b5667','fabric',.98),0,-.68,.19);
    tube(parent,[[-.32,.9,.2],[-.32,.58,.2],[-.32,.35,.2]],.018,mat('#d0c8b8','fabric',.9));
    tube(parent,[[.32,.9,.2],[.32,.58,.2],[.32,.35,.2]],.018,mat('#d0c8b8','fabric',.9));
    planeLogo(parent,logo,.58,.58,0,.22,.205);
  }
  function polo(parent,logo){
    const decal=shirt(parent,logo);if(decal)decal.position.y=-.04;
    const collar=mat('#26384e','fabric',.92);
    const left=new T.Shape();left.moveTo(-.48,1.1);left.lineTo(0,.78);left.lineTo(-.12,.58);left.lineTo(-.58,.94);left.closePath();
    const right=new T.Shape();right.moveTo(.48,1.1);right.lineTo(0,.78);right.lineTo(.12,.58);right.lineTo(.58,.94);right.closePath();
    const a=new T.Mesh(new T.ShapeGeometry(left),collar);a.position.z=.2;parent.add(a);
    const b=new T.Mesh(new T.ShapeGeometry(right),collar);b.position.z=.2;parent.add(b);
    box(parent,.07,.38,.035,collar,0,.52,.205);
    const button=mat('#d7d2c7','paper',.4,.1);for(let y of [.62,.48,.34]){const m=new T.Mesh(new T.SphereGeometry(.025,12,8),button);m.position.set(.01,y,.235);parent.add(m);}
  }
  function backpack(parent,logo){
    const fabric=mat('#4b5968','fabric',.98),edge=mat('#273748','fabric',.92),zip=mat('#c4a36b','paper',.45,.55);
    box(parent,1.78,2.15,.72,fabric,0,-.02,0);
    box(parent,1.52,1.02,.18,edge,0,-.52,.43);
    box(parent,1.42,.025,.06,zip,0,-.02,.54);
    box(parent,.13,1.45,.12,edge,-.62,-.08,-.5);box(parent,.13,1.45,.12,edge,.62,-.08,-.5);
    tube(parent,[[-.48,1.0,-.05],[-.48,1.55,-.1],[0,1.68,-.1],[.48,1.55,-.1],[.48,1.0,-.05]],.075,edge);
    const side=mat('#344253','fabric',.98);box(parent,.22,.75,.58,side,-.91,-.35,0);box(parent,.22,.75,.58,side,.91,-.35,0);
    planeLogo(parent,logo,.7,.55,0,-.48,.535);
  }
  function mailer(parent,logo){
    const kraft=mat('#b49a77','paper',.96),lid=mat('#c5ad8b','paper',.94),tape=mat('#d8c6a4','paper',.86);
    box(parent,2.2,.62,1.55,kraft,0,-.08,0);box(parent,2.22,.09,1.57,lid,0,.28,0);
    box(parent,2.0,.035,.22,tape,0,.34,0);box(parent,.22,.035,1.5,tape,0,.34,0);
    planeLogo(parent,logo,1.0,.48,0,-.08,.79);
    tube(parent,[[-1.05,-.39,.78],[0,-.39,.79],[1.05,-.39,.78]],.012,mat('#8b765c','paper',.9));
  }
  function tubeProduct(parent,logo){
    const body=new T.Mesh(new T.CylinderGeometry(.52,.52,1.8,64,1,true),mat('#b9a58b','paper',.82));parent.add(body);
    const top=new T.Mesh(new T.CylinderGeometry(.54,.54,.18,64),mat('#26384b','paper',.38,.28));top.position.y=.95;parent.add(top);
    const base=new T.Mesh(new T.CylinderGeometry(.52,.52,.08,64),mat('#8c765a','paper',.55,.18));base.position.y=-.92;parent.add(base);
    curvedLogo(parent,logo,.525,.78,.62,-.02,0);
  }
  function phone(parent,logo){
    const frame=mat('#6e7781','paper',.32,.82),glass=new T.MeshStandardMaterial({color:'#101820',roughness:.14,metalness:.22});
    const body=new T.Mesh(new T.BoxGeometry(1.08,2.2,.13),frame);parent.add(body);
    box(parent,1.0,2.1,.018,glass,0,0,.075);
    const camera=mat('#090e15','paper',.12,.25);for(const x of [-.36,-.22]){const lens=new T.Mesh(new T.CylinderGeometry(.055,.055,.02,24),camera);lens.rotation.x=Math.PI/2;lens.position.set(x,.91,.09);parent.add(lens);}
    planeLogo(parent,logo,.48,.42,0,-.08,.095);
    box(parent,.24,.025,.012,mat('#88929e','paper',.3,.7),0,-.98,.09);
  }
  function billboard(parent,logo){
    const post=mat('#444b53','paper',.48,.65),panel=mat('#202d40','paper',.42,.16),trim=mat('#c5a36b','paper',.34,.62);
    box(parent,.12,2.45,.14,post,-1.15,-.55,-.1);box(parent,.12,2.45,.14,post,1.15,-.55,-.1);
    box(parent,3.45,1.8,.22,panel,0,.45,0);
    box(parent,3.52,.055,.25,trim,0,1.38,0);box(parent,3.52,.055,.25,trim,0,-.48,0);
    box(parent,.55,.06,.48,post,-1.15,-1.72,0);box(parent,.55,.06,.48,post,1.15,-1.72,0);
    planeLogo(parent,logo,2.35,1.15,0,.45,.125);
  }
  function van(parent,logo){
    const body=mat('#d7d6d0','paper',.68,.12),glass=mat('#273849','paper',.24,.35),rubber=mat('#171a1f','paper',.92);
    box(parent,3.25,1.25,1.25,body,0,.05,0);
    box(parent,1.05,1.05,1.22,body,1.05,.15,0);
    box(parent,.92,.55,.035,glass,1.05,.48,.635);
    box(parent,.025,.62,.95,glass,1.58,.48,0);
    for(const x of [-1.0,1.0])for(const z of [-.66,.66]){const wheel=new T.Mesh(new T.CylinderGeometry(.34,.34,.18,40),rubber);wheel.rotation.x=Math.PI/2;wheel.position.set(x,-.65,z);parent.add(wheel);const hub=new T.Mesh(new T.CylinderGeometry(.14,.14,.19,32),mat('#9ca3aa','paper',.36,.72));hub.rotation.x=Math.PI/2;hub.position.set(x,-.65,z);parent.add(hub);}
    planeLogo(parent,logo,1.05,.68,-.25,.12,.64);
  }
  const builders={tshirt:shirt,tote,shopping,giftbox,shipping,mug,bottle,cap,sign,cards,letterhead,envelope,laptop,hoodie,polo,backpack,mailer,tube:tubeProduct,phone,billboard,van};
  function studioBackdrop(){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const x=canvas.getContext('2d');
    const g=x.createRadialGradient(250,190,35,256,256,390);g.addColorStop(0,'#f4f1eb');g.addColorStop(.58,'#d8d4cc');g.addColorStop(1,'#aaa59d');x.fillStyle=g;x.fillRect(0,0,512,512);
    const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;return tex;
  }
  async function loadStudioEnvironment(renderer){
    if(!T.RGBELoader||!T.PMREMGenerator)return null;
    const generator=new T.PMREMGenerator(renderer);
    generator.compileEquirectangularShader();
    try{
      const hdr=await new Promise((resolve,reject)=>{
        new T.RGBELoader().setDataType(T.UnsignedByteType).load(
          'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
          resolve,undefined,reject
        );
      });
      const env=generator.fromEquirectangular(hdr).texture;
      hdr.dispose();
      return {texture:env,generator};
    }catch(error){
      generator.dispose();
      console.warn('PIXELFORGE HDRI unavailable; using local studio lights.',error);
      return null;
    }
  }
  async function render(svg,onProgress){
    if(!window.WebGLRenderingContext)throw Error('المتصفح لا يدعم WebGL اللازم لعرض النماذج ثلاثية الأبعاد.');
    const logoUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{
      const logoTexture=await new Promise((resolve,reject)=>new T.TextureLoader().load(logoUrl,t=>{t.encoding=T.sRGBEncoding;t.anisotropy=8;resolve(t);},undefined,reject));
      const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
      renderer.setPixelRatio(1);renderer.setSize(1200,900,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.62;
      const out=[];
      const environment=await loadStudioEnvironment(renderer);
      window.PIXELFORGE_MOCKUPS.environmentStatus=environment?'loaded':'fallback';
      const backdrop=studioBackdrop();
      try{
        for(const item of items){
          const scene=new T.Scene();scene.background=backdrop;if(environment)scene.environment=environment.texture;
          const camera=new T.PerspectiveCamera(34,4/3,.1,100);
          scene.add(new T.HemisphereLight(0xffffff,0x665f56,.48));
          const key=new T.DirectionalLight(0xfff0dc,1.25);key.position.set(-3.5,6,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.bias=-.0002;scene.add(key);
          const fill=new T.DirectionalLight(0xd5e2ff,.24);fill.position.set(4,2,3);scene.add(fill);
          const rim=new T.DirectionalLight(0xffffff,.42);rim.position.set(0,4,-4);scene.add(rim);
          const floorY=-1.65;
          const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#8e8981',roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=floorY-.012;floor.receiveShadow=true;scene.add(floor);
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
      }finally{if(environment){environment.texture.dispose();environment.generator.dispose();}renderer.dispose();renderer.forceContextLoss();logoTexture.dispose();}
      return out;
    }finally{URL.revokeObjectURL(logoUrl);}
  }
  window.PIXELFORGE_MOCKUPS={available:true,items,render,environmentStatus:'not-started',environmentCredit:'Studio Small 09 · Sergej Majboroda · Poly Haven · CC0'};
})();