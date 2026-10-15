/* Authored solely from intels. Coordinates are metres; labels and editor inputs are mm. */
const MODEL_VERSION=1, STORAGE_KEY='cheongyong-independent-design-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const BASE={version:MODEL_VERSION,rear:true,extension:true,
 walls:[
 {id:'rear-laundry',x1:2.8,z1:.1,x2:2.8,z2:3.05,t:.1,kind:'partition',floor:0,active:true,openings:[{at:2.15,w:.8,sill:0,h:2.05,type:'door'}]},
 {id:'rear-cross',x1:.1,z1:3.05,x2:7.9,z2:3.05,t:.1,kind:'partition',floor:0,active:true,openings:[{at:3.45,w:.85,sill:0,h:2.05,type:'door'}]},
 {id:'room-divide',x1:4.9,z1:.1,x2:4.9,z2:7.4,t:.1,kind:'partition',floor:0,active:true,openings:[{at:1.95,w:.8,sill:0,h:2.05,type:'door'},{at:4.85,w:.8,sill:0,h:2.05,type:'door'}]},
 {id:'bath-divide',x1:4.9,z1:4.45,x2:7.9,z2:4.45,t:.1,kind:'partition',floor:0,active:true,openings:[{at:5.05,w:.75,sill:0,h:2.05,type:'door'}]}
 ],floors:{'세탁·다용도실':'tile','후면 홀':'wood','후면 방':'wood','거실·주방':'wood','욕실':'tile','침실':'wood','다락':'wood','다락 증축':'wood'},
 furniture:[
 {id:'sofa',label:'2인 소파',type:'sofa',floor:0,x:1.05,z:5.4,w:1.8,d:.8,h:.75,r:90,color:'#b3bfae'},
 {id:'coffee',label:'커피 테이블',type:'table',floor:0,x:2.25,z:5.4,w:1.0,d:.55,h:.4,r:0,color:'#b78860'},
 {id:'dining',label:'2인 식탁',type:'dining',floor:0,x:3.45,z:4.35,w:1.05,d:.7,h:.73,r:0,color:'#b78860'},
 {id:'bed',label:'퀸 침대',type:'bed',floor:0,x:6.55,z:6.05,w:1.5,d:2.0,h:.5,r:0,color:'#d7d2c7'},
 {id:'wardrobe',label:'옷장',type:'cabinet',floor:0,x:7.52,z:5.7,w:1.5,d:.6,h:1.95,r:90,color:'#c0aa90'},
 {id:'kitchen',label:'싱크대',type:'kitchen',floor:0,x:1.65,z:3.55,w:2.65,d:.6,h:.88,r:0,color:'#aebbae'},
 {id:'toilet',label:'양변기',type:'toilet',floor:0,x:6.4,z:3.7,w:.4,d:.7,h:.7,r:0,color:'#faf9f5'},
 {id:'basin',label:'세면대',type:'basin',floor:0,x:7.5,z:3.65,w:.55,d:.45,h:.8,r:90,color:'#faf9f5'},
 {id:'washer',label:'세탁기',type:'washer',floor:0,x:.55,z:.6,w:.6,d:.65,h:.85,r:0,color:'#deded8'},
 {id:'rearbed',label:'싱글 침대',type:'bed',floor:0,x:6.5,z:1.2,w:1.0,d:2,h:.45,r:90,color:'#c6cbbc'},
 {id:'loftbed',label:'다락 매트리스',type:'bed',floor:1,x:6.55,z:6.25,w:1.2,d:1.9,h:.24,r:0,color:'#d2c4ad'},
 {id:'desk',label:'다락 책상',type:'desk',floor:1,x:6.65,z:3.5,w:1.2,d:.6,h:.72,r:0,color:'#ba936e'},
 {id:'wingdesk',label:'증축 서재 테이블',type:'desk',floor:1,x:9.65,z:4.1,w:1.3,d:.65,h:.72,r:0,color:'#ba936e'}
 ]};
const CATALOG=[['sofa','소파',1.8,.8,.75,'#b3bfae'],['bed','침대',1.5,2,.5,'#d7d2c7'],['table','테이블',1,.55,.4,'#b78860'],['desk','책상',1.2,.6,.72,'#ba936e'],['cabinet','수납장',1.2,.45,1.3,'#c0aa90'],['dining','식탁',1.05,.7,.73,'#b78860'],['washer','세탁기',.6,.65,.85,'#deded8']];
const SEEDS=[{name:'세탁·다용도실',x:1.3,z:1.4},{name:'후면 홀',x:3.6,z:1.4},{name:'후면 방',x:6.4,z:1.4},{name:'거실·주방',x:2.3,z:5.2},{name:'욕실',x:6.3,z:3.75},{name:'침실',x:6.4,z:6}];
const outer=(s,floor=0)=>{
 const lo=s.rear?0:3;
 return [
 {id:'west',x1:.05,z1:lo,x2:.05,z2:7.5,t:.1,kind:'structure',floor,active:true,openings:floor?[]:[...(s.rear?[{at:1.8,w:.85,sill:0,h:2.05,type:'door',label:'후문'}]:[{at:3.35,w:.85,sill:0,h:2.05,type:'door',label:'후문'}]),{at:5.3,w:1.2,sill:.8,h:1.2,type:'window'}]},
 {id:'east',x1:7.95,z1:lo,x2:7.95,z2:7.5,t:.1,kind:'structure',floor,active:true,openings:floor?[{at:4.25,w:.9,sill:0,h:1.65,type:'door',wing:true}]:[{at:3.35,w:.6,sill:1.35,h:.6,type:'window'},{at:5.3,w:1.2,sill:.85,h:1.2,type:'window'}]},
 {id:'back',x1:0,z1:lo+.05,x2:8,z2:lo+.05,t:.1,kind:'structure',floor,active:true,openings:floor?[]:[{at:.9,w:1.4,sill:1.1,h:1,type:'window'},{at:5.55,w:1.65,sill:.85,h:1.2,type:'window'}]},
 {id:'front',x1:0,z1:7.45,x2:8,z2:7.45,t:.1,kind:'structure',floor,active:true,openings:floor?[{at:5.75,w:1.5,sill:.35,h:.85,type:'window'}]:[{at:.8,w:2.2,sill:.45,h:1.65,type:'window'},{at:3.25,w:.95,sill:0,h:2.05,type:'door',label:'현관'},{at:5.7,w:1.6,sill:.8,h:1.2,type:'window'}]}
 ];
};
function wallsFor(s,floor){
 if(floor===1)return outer({...s,rear:false},1);
 return [...outer(s),...s.walls.filter(w=>w.active && (s.rear||(!w.id.startsWith('rear-')&&w.id!=='rear-cross'))).map(w=>({...w,z1:Math.max(w.z1,s.rear?.1:3.1)}))];
}
function furnitureFor(s,floor){return s.furniture.filter(f=>f.floor===floor&&(s.rear||f.z-f.d/2>=3)&&(s.extension||f.x<8));}
function bounds(f){const a=f.r*Math.PI/180;return {w:Math.abs(Math.cos(a))*f.w+Math.abs(Math.sin(a))*f.d,d:Math.abs(Math.sin(a))*f.w+Math.abs(Math.cos(a))*f.d};}
function stairRect(){return {x1:3.85,x2:4.85,z1:5.05,z2:7.25};}
function insideFloor(s,floor,x,z,margin=0){
 if(floor===0)return x>=.1+margin&&x<=7.9-margin&&z>=(s.rear?.1:3.1)+margin&&z<=7.4-margin;
 return (x>=4.95+margin&&x<=7.9-margin&&z>=3.1+margin&&z<=7.4-margin)||(s.extension&&x>=7.8+margin&&x<=10.9-margin&&z>=3.6+margin&&z<=6.7-margin)||(x>=3.85+margin&&x<=4.96&&z>=4.8+margin&&z<=5.55-margin);
}
function roomGeometry(s,floor){
 if(floor===1)return [{names:['다락'],name:'다락',area:(7.9-4.95)*4.3+1.1*.75,cx:6.4,cz:4.7,cells:[{x:4.95,z:3.1,w:2.95,d:4.3},{x:3.85,z:4.8,w:1.1,d:.75}]},...(s.extension?[{names:['다락 증축'],name:'다락 증축',area:2.8*3.1,cx:9.5,cz:5.15,cells:[{x:8.1,z:3.6,w:2.8,d:3.1}]}]:[])];
 const minZ=s.rear?.1:3.1,ws=wallsFor(s,0).filter(w=>w.kind==='partition');
 const xs=new Set([.1,7.9]),zs=new Set([minZ,7.4]);
 for(const w of ws){if(w.x1===w.x2){xs.add(Math.max(.1,w.x1-w.t/2));xs.add(Math.min(7.9,w.x1+w.t/2));zs.add(Math.max(minZ,w.z1));zs.add(Math.min(7.4,w.z2));}else{zs.add(Math.max(minZ,w.z1-w.t/2));zs.add(Math.min(7.4,w.z1+w.t/2));xs.add(Math.max(.1,w.x1));xs.add(Math.min(7.9,w.x2));}}
 const X=[...xs].sort((a,b)=>a-b),Z=[...zs].sort((a,b)=>a-b),cells=new Map();
 for(let i=0;i<X.length-1;i++)for(let j=0;j<Z.length-1;j++){
  const x=(X[i]+X[i+1])/2,z=(Z[j]+Z[j+1])/2;
  if(ws.some(w=>w.x1===w.x2?Math.abs(x-w.x1)<w.t/2-.00001&&z>w.z1-.00001&&z<w.z2+.00001:Math.abs(z-w.z1)<w.t/2-.00001&&x>w.x1-.00001&&x<w.x2+.00001))continue;
  cells.set(`${i},${j}`,{i,j,x:X[i],z:Z[j],w:X[i+1]-X[i],d:Z[j+1]-Z[j]});
 }
 const rooms=[];
 while(cells.size){const q=[cells.values().next().value],all=[];cells.delete(`${q[0].i},${q[0].j}`);
  while(q.length){const c=q.pop();all.push(c);for(const [i,j]of[[c.i-1,c.j],[c.i+1,c.j],[c.i,c.j-1],[c.i,c.j+1]]){const k=`${i},${j}`;if(cells.has(k)){q.push(cells.get(k));cells.delete(k);}}}
  const names=SEEDS.filter(seed=>all.some(c=>seed.x>=c.x&&seed.x<=c.x+c.w&&seed.z>=c.z&&seed.z<=c.z+c.d)).map(seed=>seed.name);
  const area=all.reduce((a,c)=>a+c.w*c.d,0);if(area<.001)continue;
  rooms.push({name:names.join(' + ')||'열린 공간',names,area,cx:all.reduce((a,c)=>a+(c.x+c.w/2)*c.w*c.d,0)/area,cz:all.reduce((a,c)=>a+(c.z+c.d/2)*c.w*c.d,0)/area,cells:all});
 }
 return rooms;
}
function materialFor(s,room){return s.floors[room.names[0]]||'wood';}
function readDesign(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY));if(data?.version===1&&Array.isArray(data.walls)&&Array.isArray(data.furniture))return validateDesign(data);}catch{}return clone(BASE);}
function validateDesign(raw){
 const d=clone(BASE);d.rear=raw.rear!==false;d.extension=raw.extension!==false;
 d.floors=Object.fromEntries(Object.entries(raw.floors||d.floors).filter(([k,v])=>typeof k==='string'&&['wood','tile','stone'].includes(v)));
 d.walls=d.walls.map(w=>{const v=raw.walls.find(a=>a.id===w.id);if(!v)return w;return {...w,active:v.active!==false,x1:w.x1===w.x2?Math.min(7.3,Math.max(.6,Number(v.x1)||w.x1)):w.x1,x2:w.x1===w.x2?Math.min(7.3,Math.max(.6,Number(v.x1)||w.x1)):w.x2,z1:w.z1===w.z2?Math.min(6.8,Math.max(.6,Number(v.z1)||w.z1)):w.z1,z2:w.z1===w.z2?Math.min(6.8,Math.max(.6,Number(v.z1)||w.z1)):w.z2};});
 d.furniture=raw.furniture.slice(0,80).filter(f=>[f.x,f.z,f.w,f.d,f.h,f.r].every(Number.isFinite)&&[0,1].includes(f.floor)&&[...CATALOG.map(x=>x[0]),'kitchen','toilet','basin'].includes(f.type)&&f.w>=.2&&f.w<=3.5&&f.d>=.2&&f.d<=3.5).map(f=>({...f,label:String(f.label).slice(0,40),id:String(f.id).slice(0,70),color:/^#[a-f0-9]{6}$/i.test(f.color)?f.color:'#b3bfae'}));return d;
}
window.Design={BASE,CATALOG,clone,outer,wallsFor,furnitureFor,roomGeometry,materialFor,bounds,insideFloor,stairRect,readDesign,validateDesign,STORAGE_KEY};
