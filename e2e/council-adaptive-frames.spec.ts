import {test,expect,type Page} from '@playwright/test';
import manifest from '../public/council/circle-238/companions.json' with {type:'json'};
import {disconnectedTransport} from './fixtures/circle237-disconnected-transport';
const route='/tetol/circle-235/pre-fire/tetol.html?circle=238';
test.beforeEach(async({context,page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 await page.addInitScript(()=>{window.requestAnimationFrame=cb=>window.setTimeout(()=>cb(performance.now()),100);window.cancelAnimationFrame=id=>clearTimeout(id);});
});
async function ready(page:Page){await page.waitForFunction(()=>!!(window as any).__tetol);await page.waitForFunction(()=>document.body.classList.contains('inroom')&&!document.body.classList.contains('moving')&&!document.body.dataset.q);}
async function bounds(page:Page,id:string){return page.evaluate(id=>{
 const {cam,THREE}= (window as any).__tetol,s=(document.querySelector('three-d-stage') as any)._scene;s.updateMatrixWorld(true);cam.updateMatrixWorld();
 const art=s.getObjectByName(id+'_artwork'),board=s.getObjectByName(id+'_frame'),d=board.parent.userData.layout;
 const corners=(mesh:any)=>{const {width:w,height:h}=mesh.geometry.parameters;return [[-w/2,-h/2],[w/2,-h/2],[-w/2,h/2],[w/2,h/2]].map(([x,y])=>{const v=new THREE.Vector3(x,y,0).applyMatrix4(mesh.matrixWorld).project(cam);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,z:v.z};});};
 const p=document.querySelector('#panel')!.getBoundingClientRect(),exit=document.querySelector('#council-return')!.getBoundingClientRect();
 const cords=s.getObjectsByProperty('name',id+'_hanging_cord').map((cord:any)=>{const v=new THREE.Vector3(0,.5,0).applyMatrix4(cord.matrixWorld).project(cam);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,z:v.z};});
 const center=new THREE.Vector3(0,0,0).applyMatrix4(art.matrixWorld).project(cam),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(center.x,center.y),cam);
 const visible=(o:any)=>{for(;o;o=o.parent)if(!o.visible)return false;return true;};
 const hit=ray.intersectObjects(s.children,true).find((h:any)=>visible(h.object)&&h.object.isMesh&&h.object.material?.opacity!==0);
 return {firstHit:hit?.object.name,cords,cameraHeight:cam.position.y,art:corners(art),board:corners(board),panel:{left:p.left,top:p.top},phone:document.body.classList.contains('phone'),exitBottom:exit.top<innerHeight/3?exit.bottom:0,uv:Array.from(art.geometry.attributes.uv.array),size:[art.geometry.parameters.width,art.geometry.parameters.height],image:[art.material.map.image.width,art.material.map.image.height],d};
},id);}
async function contained(page:Page,id:string){await expect.poll(async()=>{
 const b=await bounds(page,id);return b.cameraHeight>.43&&[...b.board,...b.cords].every(p=>p.x>=10&&p.x<= (b.phone? (page.viewportSize()!.width-10):b.panel.left-10)&&p.y>=Math.max(10,b.exitBottom+10)&&p.y<=(b.phone?b.panel.top-10:page.viewportSize()!.height-10)&&p.z>0&&p.z<1);
},{timeout:15000}).toBe(true);const b=await bounds(page,id);expect(b.firstHit).toBe(id+'_artwork');expect(b.size[0]/b.size[1]).toBeCloseTo(b.image[0]/b.image[1],5);expect(b.uv).toEqual([0,1,1,1,0,0,1,0]);return b;}
test('all ten approved scenes fit at phone, landscape and desktop widths; sheet changes refit',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto(route+'#croom');await ready(page);
 const receipt=[];
 for(const size of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(const c of manifest.companions){await page.evaluate(id=>(window as any).TETOL_NAV.do('goTo',id),c.id);await expect(page.locator('#panel h2')).toHaveText(c.label);receipt.push({size,id:c.id,...await contained(page,c.id)});}
  await page.screenshot({path:`output/playwright/adaptive-frames/${info.project.name}-${size.width}-actual.png`});
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(id=>(window as any).TETOL_NAV.do('goTo',id),manifest.companions[0].id);
 for(const sheet of ['peek','full','mid']){await page.locator('body').evaluate((el,s)=>{(el as HTMLElement).dataset.sheet=s;},sheet);await contained(page,manifest.companions[0].id);}
 await page.reload();await ready(page);await contained(page,manifest.companions[0].id);
 // A user camera adjustment survives stable overlay bounds; only layout changes refit.
 const moved=await page.evaluate(()=>{const t=(window as any).__tetol;t.controls.target.x+=.02;t.cam.position.x+=.02;t.controls.update();return t.cam.position.toArray();});
 await page.waitForTimeout(500);const held=await page.evaluate(()=>(window as any).__tetol.cam.position.toArray());held.forEach((n:number,i:number)=>expect(n).toBeCloseTo(moved[i],3));
 await info.attach('projected-bounds.json',{body:JSON.stringify(receipt,null,2),contentType:'application/json'});
});
test('actual decoder and layout preserve edge-marked portrait, landscape, square and extreme fixtures',async({page},info)=>{
 const c=manifest.companions[0];
 for(const [name,w,h] of [['portrait',640,960],['landscape',960,640],['square',800,800],['extreme-wide',1600,160],['extreme-tall',160,1600]] as const){
  const pattern='**'+c.artwork;await page.route(pattern,r=>r.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#efe6bf"/><rect width="100%" height="8%" fill="red"/><rect y="92%" width="100%" height="8%" fill="blue"/><rect width="8%" height="100%" fill="green"/><rect x="92%" width="8%" height="100%" fill="purple"/><text x="15%" y="50%" font-size="${Math.min(w,h)/8}">${name}</text></svg>`}));
  await page.setViewportSize({width:390,height:844});await page.goto(route+'#'+c.id);await ready(page);
  for(const size of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){await page.setViewportSize(size);await contained(page,c.id);await page.screenshot({path:`output/playwright/adaptive-frames/${info.project.name}-${name}-${size.width}.png`});}
  await page.unroute(pattern);
 }
});
