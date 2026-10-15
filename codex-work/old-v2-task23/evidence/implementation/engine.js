const {BASE,clone,wallsFor,outer,furnitureFor,roomGeometry,materialFor,insideFloor}=window.Design;
let THREE,OrbitControls;
try{THREE=await import('three');({OrbitControls}=await import('three/addons/controls/OrbitControls.js'));}
catch(e){document.querySelectorAll('.loading').forEach(el=>{el.textContent='3D 라이브러리를 불러오지 못했습니다. 인터넷 연결 후 새로고침해 주세요.';el.classList.add('error');});window.dispatchEvent(new CustomEvent('viewer-error'));throw e;}
const mats=new Map();
function mat(color,extra={}){const k=color+JSON.stringify(extra);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:.8,...extra}));return mats.get(k);}
function box(g,w,h,d,x,y,z,color,extra={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof color==='object'?color:mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function beam(g,a,b,size=.08,color='#c6d0ca'){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),m=box(g,size,v.length(),size,...av.clone().add(bv).multiplyScalar(.5).toArray(),color);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
function label(g,text,x,y,z,color='#284b3e',scale=1){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#f8f5ec';ctx.roundRect(4,4,504,116,30);ctx.fill();ctx.fillStyle=color;ctx.font='500 44px "IBM Plex Sans KR",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const m=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));m.position.set(x,y,z);m.scale.set(4*scale,scale,1);g.add(m);return m;}
const mx=x=>x-4,mz=z=>z-5.25;
function pbox(g,w,h,d,x,y,z,c,e){return box(g,w,h,d,mx(x),y,mz(z),c,e);}
function pbeam(g,a,b,s,c){return beam(g,[mx(a[0]),a[1],mz(a[2])],[mx(b[0]),b[1],mz(b[2])],s,c);}
function floorMaterial(type){const key='floor-'+type;if(mats.has(key))return mats.get(key);const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle={wood:'#c4aa89',tile:'#d8d8cc',stone:'#c4c1b4'}[type];ctx.fillRect(0,0,256,256);ctx.strokeStyle=type==='wood'?'#ac916f':'#b7b8ae';ctx.lineWidth=2;
 for(let j=0;j<8;j++){ctx.beginPath();ctx.moveTo(0,j*32);ctx.lineTo(256,j*32);ctx.stroke();if(type==='wood'){for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(i*100+(j%2)*50,j*32);ctx.lineTo(i*100+(j%2)*50,j*32+32);ctx.stroke();}ctx.globalAlpha=.18;for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(0,j*32+k*7+4);ctx.lineTo(256,j*32+k*7+4);ctx.stroke();}ctx.globalAlpha=1;}}
 if(type!=='wood')for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(i*32,0);ctx.lineTo(i*32,256);ctx.stroke();}
 const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,1);tex.colorSpace=THREE.SRGBColorSpace;const m=mat('#ffffff',{map:tex});mats.set(key,m);return m;}
function wall(g,w,y,h,openings=true,color='#eee9df'){
 const horizontal=Math.abs(w.z2-w.z1)<.001,start=horizontal?w.x1:w.z1,end=horizontal?w.x2:w.z2;
 const ops=openings?w.openings.filter(o=>!o.wing||g.userData.extension):[],cuts=[start,end];
 for(const o of ops)cuts.push(Math.max(start,o.at),Math.min(end,o.at+o.w));cuts.sort((a,b)=>a-b);
 const fill=(a,b,bottom,height)=>{if(b-a<=.001||height<=.001)return;pbox(g,horizontal?b-a:w.t,height,horizontal?w.t:b-a,horizontal?(a+b)/2:w.x1,y+bottom+height/2,horizontal?w.z1:(a+b)/2,color);};
 for(let i=0;i<cuts.length-1;i++){const a=cuts[i],b=cuts[i+1],o=ops.find(o=>(a+b)/2>o.at&&(a+b)/2<o.at+o.w);if(o){fill(a,b,0,o.sill);fill(a,b,o.sill+o.h,h-o.sill-o.h);}else fill(a,b,0,h);}
}
function opening(g,w,o,y){const hor=w.z1===w.z2,at=o.at+o.w/2,xx=hor?at:w.x1,zz=hor?w.z1:at,bot=y+o.sill;const c='#374c49';
 for(const sign of [-1,1])pbox(g,hor?.055:.12,o.h,hor?.12:.055,xx+(hor?sign*o.w/2:0),bot+o.h/2,zz+(hor?0:sign*o.w/2),c);
 for(const yy of [bot,bot+o.h])pbox(g,hor?o.w:.12,.055,hor?.12:o.w,xx,yy,zz,c);
 if(o.type==='window'){pbox(g,hor?o.w:.025,o.h,hor?.025:o.w,xx,bot+o.h/2,zz,'#9dc9c9',{transparent:true,opacity:.42,roughness:.18,metalness:.12});pbox(g,hor?.035:.08,o.h,hor?.08:.035,xx,bot+o.h/2,zz,c);}
 else{const pivot=new THREE.Group();pivot.position.set(mx(hor?o.at:w.x1),y,mz(hor?w.z1:o.at));g.add(pivot);pivot.rotation.y=hor?-.65:Math.PI/2+.65;box(pivot,o.w,.025,.035,o.w/2,o.h/2,0,'#a28664');const door=box(pivot,o.w,o.h,.045,o.w/2,o.h/2,0,'#c7ad89');box(pivot,.04,.04,.06,o.w-.1,.95,-.04,'#283e35');door.castShadow=true;}
}
function roof(g,x1,x2,z1,z2,eave,ridge,color='#3e5150'){
 const mid=(z1+z2)/2,half=(z2-z1)/2+.25,dy=ridge-eave,len=Math.hypot(half,dy),a=Math.atan2(dy,half);
 for(const side of [-1,1]){const m=pbox(g,x2-x1+.45,.09,len,(x1+x2)/2,(eave+ridge)/2,mid+side*half/2,color);m.rotation.x=side*a;
  for(let x=x1-.15;x<x2+.25;x+=.36){const seam=pbox(g,.022,.12,len,x,(eave+ridge)/2+.03,mid+side*half/2,'#526360');seam.rotation.x=side*a;}}
 for(const x of[x1,x2]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([mx(x),eave,mz(z1),mx(x),ridge,mz(mid),mx(x),eave,mz(z2)],3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat('#e9e5da',{side:THREE.DoubleSide}));m.castShadow=true;g.add(m);}
}
function furnitureMesh(g,f){const root=new THREE.Group();root.position.set(mx(f.x),f.floor*2.3,mz(f.z));root.rotation.y=-f.r*Math.PI/180;g.add(root);root.userData.furnitureId=f.id;const b=(w,h,d,x,y,z,c)=>box(root,w,h,d,x,y,z,c);
 if(['table','dining','desk'].includes(f.type)){b(f.w,.055,f.d,0,f.h-.025,0,f.color);for(const x of[-f.w/2+.06,f.w/2-.06])for(const z of[-f.d/2+.06,f.d/2-.06])b(.05,f.h-.05,.05,x,(f.h-.05)/2,z,'#655b4c');if(f.type==='dining')for(const z of[-f.d/2-.22,f.d/2+.22]){b(.35,.05,.35,0,.42,z,'#d0c4ad');b(.35,.35,.045,0,.61,z+Math.sign(z)*.14,'#d0c4ad');}}
 else if(f.type==='bed'){b(f.w,.16,f.d,0,.1,0,'#ad9170');b(f.w-.04,Math.max(.08,f.h-.16),f.d-.05,0,.16+(f.h-.16)/2,0,f.color);b(f.w-.1,.045,f.d*.55,0,f.h+.015,f.d*.2,'#9dada0');for(const x of[-f.w*.24,f.w*.24])b(f.w*.4,.1,.38,x,f.h+.06,-f.d/2+.26,'#f7f4ea');}
 else if(f.type==='sofa'){b(f.w,.28,f.d,0,.28,0,f.color);b(f.w,.4,.17,0,.52,-f.d/2+.08,f.color);for(const x of[-f.w/2+.08,f.w/2-.08])b(.16,.38,f.d,x,.48,0,f.color);for(const x of[-f.w*.24,f.w*.24])b(f.w*.43,.12,f.d*.7,x,.48,.06,'#c5cebd');}
 else if(f.type==='washer'){b(f.w,f.h,f.d,0,f.h/2,0,f.color);const drum=new THREE.Mesh(new THREE.CylinderGeometry(f.w*.3,f.w*.3,.028,24),mat('#455963'));drum.rotation.x=Math.PI/2;drum.position.set(0,f.h*.47,f.d/2+.01);root.add(drum);b(f.w*.7,.08,.018,0,f.h*.86,f.d/2,'#faf9f3');}
 else if(f.type==='toilet'){b(f.w*.9,f.h*.42,f.d*.7,0,f.h*.24,.07,'#f7f6ef');b(f.w,f.h*.85,.15,0,f.h*.45,-f.d*.36,'#f7f6ef');b(f.w,.05,f.d*.72,0,f.h*.45,.02,'#ffffff');}
 else{b(f.w,f.h,f.d,0,f.h/2,0,f.color);b(f.w+.025,.04,f.d+.025,0,f.h,0,['kitchen','basin'].includes(f.type)?'#ebe8de':'#d4b594');if(f.type==='kitchen'){b(.5,.02,.4,-f.w*.22,f.h+.025,0,'#697879');for(const x of[f.w*.18,f.w*.32])b(.17,.015,.23,x,f.h+.03,0,'#364440');}if(f.type==='cabinet')b(.02,f.h,.015,0,f.h/2,f.d/2+.01,'#9b8364');}
 return root;
}
function buildHouse(s){const root=new THREE.Group(),stages=Array.from({length:7},()=>new THREE.Group());stages.forEach((g,i)=>{g.name='stage-'+i;g.userData.extension=s.extension;root.add(g);});const ro=new THREE.Group();ro.name='roof';root.add(ro);const plannedRo=new THREE.Group();plannedRo.name='planned-addition-roofs';ro.add(plannedRo);
 const form=stages[1];for(const z of[2.92,7.58])pbox(form,8.3,.4,.08,4,-.06,z,'#927251');for(const x of[-.08,8.08])pbox(form,.08,.4,4.7,x,-.06,5.25,'#927251');for(let x=.2;x<8;x+=.35){pbeam(form,[x,.08,3.1],[x,.08,7.4],.012,'#6f7770');}for(let z=3.2;z<7.4;z+=.35)pbeam(form,[.1,.095,z],[7.9,.095,z],.012,'#6f7770');
 const concrete=stages[2];pbox(concrete,8.25,.28,4.75,4,-.17,5.25,'#b7b8ac');for(let x=.25;x<8;x+=.5)pbox(concrete,.045,.045,4.45,x,-.025,5.25,'#88938c');
 const frame=stages[3];for(const x of[.05,2.7,4.9,7.95])for(const z of[3.05,7.45]){pbeam(frame,[x,.03,z],[x,2.3,z],.1);pbeam(frame,[x,2.3,3.05],[x,2.3,7.45],.1);}for(const z of[3.05,7.45]){pbeam(frame,[.05,.05,z],[7.95,.05,z],.1);pbeam(frame,[.05,2.3,z],[7.95,2.3,z],.12);for(let x=.65;x<7.9;x+=.65)pbeam(frame,[x,.03,z],[x,2.3,z],.045,'#adb9b3');}
 const loft=stages[4];for(const x of[.05,2.7,4.9,7.95]){for(const z of[3.05,7.45])pbeam(loft,[x,2.3,z],[x,4.1,z],.1);pbeam(loft,[x,4.1,3.05],[x,5,5.25],.1);pbeam(loft,[x,5,5.25],[x,4.1,7.45],.1);pbeam(loft,[x,4.1,3.05],[x,4.1,7.45],.09);pbeam(loft,[x,4.1,4.15],[x,4.6,5.25],.07);pbeam(loft,[x,4.6,5.25],[x,4.1,6.35],.07);}for(const z of[3.05,4.15,5.25,6.35,7.45])pbeam(loft,[.05,z===5.25?5:z===4.15||z===6.35?4.55:4.1,z],[7.95,z===5.25?5:z===4.15||z===6.35?4.55:4.1,z],.07);
 const shell=stages[5],backShell=new THREE.Group();shell.add(backShell);for(const w of outer({...s,rear:false},0)){const openings=w.id==='west'&&s.rear?w.openings.filter(o=>o.type!=='door'):w.openings;wall(w.id==='back'?backShell:shell,{...w,openings},0,2.3);}
 for(const w of outer({...s,rear:false},1))wall(shell,w,2.3,1.8);
 roof(ro,0,8,3,7.5,4.1,5);ro.userData.stage=5;
 const finish=stages[6];for(const room of roomGeometry(s,0))for(const c of room.cells)pbox(finish,c.w,.035,c.d,c.x+c.w/2,.018,c.z+c.d/2,floorMaterial(materialFor(s,room)));
 for(const room of roomGeometry(s,1))for(const c of room.cells)pbox(finish,c.w,.075,c.d,c.x+c.w/2,2.2625,c.z+c.d/2,floorMaterial(materialFor(s,room)));
 for(let i=0;i<13;i++){const z=7.25-(i+.5)*2.2/13,h=(i+1)*2.3/13;pbox(finish,.95,.1,2.2/13,4.35,h-.05,z,'#be9d75');}pbeam(finish,[4,0,7.25],[4,2.3,5.05],.06,'#5c5e52');
 for(const z of[3.1,7.4])pbeam(finish,[4.9,3.4,z],[7.9,3.4,z],.045,'#4e6055');
 for(const [z1,z2]of[[3.1,4.78],[5.6,7.4]]){pbeam(finish,[4.9,3.4,z1],[4.9,3.4,z2],.045,'#4e6055');pbeam(finish,[4.9,2.33,z1],[4.9,2.33,z2],.04,'#4e6055');for(let z=z1;z<=z2;z+=.13)pbeam(finish,[4.9,2.33,z],[4.9,3.4,z],.022,'#687769');}
 for(const x of[3.85,4.8]){pbeam(finish,[x,1.0,7.25],[x,3.3,5.05],.04,'#4e6055');for(let i=0;i<=12;i++){const z=7.25-i*2.2/12,y=i*2.3/12;pbeam(finish,[x,y,z],[x,y+1,z],.022,'#687769');}}
 for(const w of wallsFor(s,0).filter(w=>w.kind==='partition')){wall(finish,w,0,2.3);for(const o of w.openings)if(o.at>=(w.x1===w.x2?w.z1:w.x1))opening(finish,w,o,0);}
 for(const w of outer({...s,rear:false},0)){if(w.id==='back'&&s.rear)continue;for(const o of w.openings){if(w.id==='west'&&o.type==='door')continue;opening(finish,w,o,0);}}
 for(const w of outer({...s,rear:false},1))for(const o of w.openings)if(!o.wing||s.extension)opening(finish,w,o,2.3);
 if(s.rear){pbox(finish,8.2,.25,3,4,-.16,1.5,'#b7b8ac');for(const w of outer(s,0).filter(w=>w.id==='back')){wall(finish,w,0,2.3);w.openings.forEach(o=>opening(finish,w,o,0));}for(const x of[.05,7.95]){const w=outer(s,0).find(w=>w.x1===x);wall(finish,{...w,z2:3.0,openings:w.openings.filter(o=>o.at<3)},0,2.3);w.openings.filter(o=>o.at<3).forEach(o=>opening(finish,w,o,0));}const m=pbox(plannedRo,8.4,.085,3.35,4,2.45,1.43,'#52615b');m.rotation.x=-.06;}
 else{const w=outer(s,0)[0];w.openings.filter(o=>o.type==='door').forEach(o=>opening(finish,w,o,0));}
 if(s.extension){pbox(finish,.2,.075,.9,8,2.2625,4.7,floorMaterial('wood'));for(const x of[8.1,10.9])for(const z of[3.6,6.7])pbeam(finish,[x,-.2,z],[x,2.3,z],.12,'#72847a');pbox(finish,3,.18,3.3,9.5,2.21,5.15,'#b8b7a8');for(const w of[{x1:8,z1:3.55,x2:11,z2:3.55,t:.1,openings:[]},{x1:8,z1:6.75,x2:11,z2:6.75,t:.1,openings:[{at:8.55,w:1.9,sill:.35,h:1.0,type:'window'}]},{x1:10.95,z1:3.5,x2:10.95,z2:6.8,t:.1,openings:[{at:4.1,w:1.2,sill:.35,h:1,type:'window'}]}]){wall(finish,w,2.3,1.8);w.openings.forEach(o=>opening(finish,w,o,2.3));}const m=pbox(plannedRo,3.35,.085,3.65,9.55,4.2,5.15,'#4c6158');m.rotation.z=-.055;}
 furnitureFor(s,0).concat(furnitureFor(s,1)).forEach(f=>furnitureMesh(finish,f));
 pbox(finish,8.5,.16,1.15,4,.06,8.02,'#aa9272');for(let x=.05;x<8.25;x+=.25)pbox(finish,.22,.018,1.15,x,.148,8.02,'#b99a76');
 const setStage=(n,cut=false)=>{stages.forEach((g,i)=>{g.visible=i===1?n===1:i<=n;});ro.visible=n>=5&&!cut;plannedRo.visible=n===6;backShell.visible=n!==6||!s.rear;frame.visible=n>=3&&n<5;loft.visible=n===4;return n;};[1,2,3,4,6].forEach(i=>batchStatic(stages[i]));batchStatic(backShell);setStage(6);
 return {root,stages,roof:ro,setStage,design:s};
}
function disposeTree(root){root.traverse(o=>{o.geometry?.dispose();});root.removeFromParent();}
// Static scenery shares geometry with instancing, keeping touch navigation responsive.
function batchStatic(root){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),sets=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;let base,scale=new THREE.Vector3(1,1,1),kind;
 if(o.geometry.type==='BoxGeometry'){base=new THREE.BoxGeometry(1,1,1);const p=o.geometry.parameters;scale.set(p.width,p.height,p.depth);kind='box';}
 else if(['IcosahedronGeometry','DodecahedronGeometry'].includes(o.geometry.type)){const p=o.geometry.parameters;base=o.geometry.type==='IcosahedronGeometry'?new THREE.IcosahedronGeometry(1,p.detail):new THREE.DodecahedronGeometry(1,p.detail);scale.setScalar(p.radius);kind=o.geometry.type+p.detail;}
 else return;const key=kind+'-'+o.material.id+'-'+o.castShadow+'-'+o.receiveShadow;if(!sets.has(key))sets.set(key,{geometry:base,material:o.material,items:[],cast:o.castShadow,receive:o.receiveShadow});else base.dispose();sets.get(key).items.push({object:o,matrix:inverse.clone().multiply(o.matrixWorld).scale(scale)});
 });for(const s of sets.values()){const inst=new THREE.InstancedMesh(s.geometry,s.material,s.items.length);s.items.forEach((item,i)=>{inst.setMatrixAt(i,item.matrix);item.object.removeFromParent();item.object.geometry.dispose();});inst.castShadow=s.cast;inst.receiveShadow=s.receive;inst.computeBoundingSphere();root.add(inst);}}
function createViewer(container,{site=false}={}){
 const scene=new THREE.Scene();scene.background=new THREE.Color(site?'#d7e6e5':'#eceee7');scene.fog=new THREE.Fog(site?'#d7e6e5':'#eceee7',site?65:35,site?160:90);
 const camera=new THREE.PerspectiveCamera(40,1,.04,240);const fitFactor=Math.max(1,.95/Math.max(.4,container.clientWidth/Math.max(1,container.clientHeight)));camera.position.set((site?27:13)*fitFactor,(site?20:13)*fitFactor,(site?32:17)*fitFactor);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;container.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',site?'대지와 공사 단계 3D 장면':'주택 3D 장면');
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.target.set(0,site?1.5:1.8,0);controls.maxPolarAngle=Math.PI*.49;controls.minDistance=site?6:4;controls.maxDistance=site?90:35;controls.update();
 scene.add(new THREE.HemisphereLight('#e6f1f5','#a49a7c',2.0));const sun=new THREE.DirectionalLight('#fff1d0',3.2);sun.position.set(18,25,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=sun.shadow.camera.bottom=site?-30:-14;sun.shadow.camera.right=sun.shadow.camera.top=site?30:14;sun.shadow.camera.far=100;sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;scene.add(sun);scene.add(sun.target);
 const clock=new THREE.Clock();let alive=true,paused=false,fps=false,yaw=0,pitch=0,lastFrame=0,walkFloor=0,keys=new Set(),touchMove=0,look=null,house=null,base=site?1.35:0,cinematic=false,camTween=null;
 function resize(){const r=container.getBoundingClientRect();if(r.width<1||r.height<1)return;camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);}const observer=new ResizeObserver(resize);observer.observe(container);resize();
 function setHouse(next){if(house)disposeTree(house.root);house=next;if(site){house.root.rotation.y=Math.PI/2;house.root.position.y=base;}scene.add(house.root);}
 function localPos(v){return site?house.root.worldToLocal(v.clone()):v.clone();}
 function worldPos(x,y,z){const v=new THREE.Vector3(mx(x),y,mz(z));return site?house.root.localToWorld(v):v;}
 function collide(x,z,y){const s=house.design,lf=y>1.8?1:0,r=.16;
  if(lf===1&&!insideFloor(s,1,x,z,r)&&!(x>=3.99&&x<=4.71&&z>=5.05&&z<=7.3))return true;
  for(const w of wallsFor(s,lf)){if(lf===1&&w.id==='back')continue;const hor=w.z1===w.z2,a=hor?x:z,b=hor?z:x,start=hor?w.x1:w.z1,end=hor?w.x2:w.z2;if(a<start-r||a>end+r||Math.abs(b-(hor?w.z1:w.x1))>w.t/2+r)continue;const op=w.openings.find(o=>o.sill===0&&(!o.wing||s.extension)&&a>o.at+r&&a<o.at+o.w-r);if(!op)return true;}
  if(lf===1&&s.extension&&(x>7.8&&x<8.13)&&!(z>4.4&&z<4.98))return true;
  for(const f of furnitureFor(s,lf)){const a=f.r*Math.PI/180,dx=x-f.x,dz=z-f.z,xx=dx*Math.cos(a)+dz*Math.sin(a),zz=-dx*Math.sin(a)+dz*Math.cos(a);if(Math.abs(xx)<f.w/2+r&&Math.abs(zz)<f.d/2+r)return true;}
  return false;
 }
 function move(dt){if(!house)return;const dir=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+touchMove,strafe=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);if(!dir&&!strafe)return;
  const speed=2.1*dt,v=new THREE.Vector3((-Math.sin(yaw)*dir+Math.cos(yaw)*strafe)*speed,0,(-Math.cos(yaw)*dir-Math.sin(yaw)*strafe)*speed);const next=camera.position.clone().add(v),lp=localPos(next),old=localPos(camera.position),x=lp.x+4,z=lp.z+5.25;let floorY=walkFloor*2.3;
  if(x>3.99&&x<4.71&&z>5.05&&z<7.3)floorY=Math.max(0,Math.min(2.3,(7.25-z)/2.2*2.3));else if(walkFloor===0&&old.y>2.9&&insideFloor(house.design,1,x,z,.16)){walkFloor=1;floorY=2.3;window.dispatchEvent(new CustomEvent('walk-floor',{detail:1}));}else if(walkFloor===1&&old.y<1.8){walkFloor=0;floorY=0;window.dispatchEvent(new CustomEvent('walk-floor',{detail:0}));}
  if(Math.abs(x)>65||Math.abs(z)>65||collide(x,z,floorY))return;
  if(site&&walkFloor===0){const wx=next.x,wz=next.z;floorY=insideFloor(house.design,0,x,z)?0:(wx>-9&&wx<12&&wz>-9&&wz<11)?-.25:-1.25;}
  camera.position.copy(next);camera.position.y=base+floorY+(walkFloor?1.4:1.6);
 }
 function floorTo(f){walkFloor=f;const v=worldPos(f?5.5:3.25,f?3.7:1.6,f?5.1:6.8);camera.position.copy(v);yaw=site?-Math.PI/2:0;pitch=-.07;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
 function setFPS(on,f=0){fps=on;cinematic=false;camTween=null;controls.enabled=!on;keys.clear();touchMove=0;if(on){floorTo(f);renderer.domElement.focus();}else{camera.rotation.order='XYZ';const fitFactor=Math.max(1,.95/Math.max(.4,container.clientWidth/Math.max(1,container.clientHeight)));camera.position.set((site?27:13)*fitFactor,(site?20:13)*fitFactor,(site?32:17)*fitFactor);controls.target.set(0,site?1.5:1.8,0);controls.update();}return on;}
 const keydown=e=>{if(fps&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}};const keyup=e=>keys.delete(e.code);addEventListener('keydown',keydown);addEventListener('keyup',keyup);addEventListener('blur',()=>{keys.clear();touchMove=0;});
 renderer.domElement.addEventListener('pointerdown',e=>{if(fps){look={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}});
 renderer.domElement.addEventListener('pointermove',e=>{if(fps&&look?.id===e.pointerId){yaw-=(e.clientX-look.x)*.005;pitch=Math.max(-1.25,Math.min(1.25,pitch-(e.clientY-look.y)*.004));look.x=e.clientX;look.y=e.clientY;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}});
 renderer.domElement.addEventListener('pointerup',()=>{look=null;});renderer.domElement.addEventListener('pointercancel',()=>{look=null;touchMove=0;});
 function tweenCamera(pos,target,duration=900){fps=false;controls.enabled=true;camTween={from:camera.position.clone(),to:new THREE.Vector3(...pos).multiplyScalar(Math.max(1,.95/Math.max(.4,camera.aspect))),tf:controls.target.clone(),tt:new THREE.Vector3(...target),start:performance.now(),duration};}
 function setTime(value){const t=Number(value),ang=(t-6)/12*Math.PI;sun.position.set(28*Math.cos(ang),Math.max(3,30*Math.sin(ang)),12*Math.sin(ang*.65));sun.color.set(t>16?'#ffbc77':'#fff0d3');sun.intensity=t>17?2.1:3.2;scene.background.set(t>17?'#edc9b1':site?'#d7e6e5':'#eceee7');scene.fog.color.copy(scene.background);}
 const tick=()=>{if(!alive)return;requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.2),now=performance.now();if(paused||document.hidden)return;if(fps){for(let remaining=dt;remaining>0;remaining-=.025)move(Math.min(.025,remaining));}else{if(camTween){const t=Math.min(1,(now-camTween.start)/camTween.duration),k=t*t*(3-2*t);camera.position.lerpVectors(camTween.from,camTween.to,k);controls.target.lerpVectors(camTween.tf,camTween.tt,k);if(t===1)camTween=null;}if(cinematic){const a=now*.000095;camera.position.set(Math.cos(a)*27,16+Math.sin(a*.7)*2,Math.sin(a)*27);controls.target.set(0,2,0);}controls.update();}if(now-lastFrame>(site?1000/45:1000/60)){renderer.render(scene,camera);lastFrame=now;}};tick();
 return {scene,camera,renderer,controls,sun,setHouse,setFPS,floorTo,tweenCamera,setTime,resize,worldPos,get house(){return house;},get fps(){return fps;},get floor(){return walkFloor;},set touchMove(v){touchMove=v;},set cinematic(v){cinematic=v;},set paused(v){paused=v;},capture(){renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');},dispose(){alive=false;observer.disconnect();controls.dispose();renderer.dispose();removeEventListener('keydown',keydown);removeEventListener('keyup',keyup);}};
}
window.Engine={THREE,mat,box,beam,label,pbox,pbeam,buildHouse,disposeTree,createViewer,furnitureMesh,batchStatic};window.dispatchEvent(new CustomEvent('viewer-ready'));
