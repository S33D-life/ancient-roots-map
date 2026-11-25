// Explicit local review only. Reads retained derivatives; never uploads or writes data.
import http from 'node:http';
import {readFileSync,realpathSync,statSync,createReadStream} from 'node:fs';
import {resolve,sep,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
const [buildArg,packArg,portArg='4362']=process.argv.slice(2);
if(!buildArg||!packArg||!isAbsolute(buildArg)||!isAbsolute(packArg))throw Error('Usage: node scripts/review-circle242.mjs /absolute/dist /absolute/private-pack [port]');
const build=realpathSync(buildArg),pack=realpathSync(packArg),port=Number(portArg);
if(pack===process.cwd()||pack.startsWith(realpathSync(process.cwd())+sep)||!Number.isInteger(port)||port<1024||port>65535)throw Error('External private pack and unprivileged local port required');
const manifest=JSON.parse(readFileSync(resolve(pack,'web-manifest.json'))),catalogue=JSON.parse(readFileSync(resolve(pack,'catalogue.json')));
if(manifest.length!==20||catalogue.number!==242||catalogue.publicationApproved!==false||catalogue.fire!==null)throw Error('Invalid review pack');
const files=new Map();
for(const item of manifest){
 if(!/^[a-z0-9-]+(?:-front)?\.webp$/.test(item.file))throw Error('Invalid asset');
 const path=realpathSync(resolve(pack,'web',item.file));if(!path.startsWith(pack+sep))throw Error('External asset');
 if(createHash('sha256').update(readFileSync(path)).digest('hex')!==item.sha256)throw Error('Asset hash mismatch');files.set('/council/circle-242/'+item.file,path);
}
if(files.size!==20)throw Error('Duplicate pair');
for(const c of catalogue.companions){
 const a=manifest.find(x=>x.key===c.key&&x.side==='front'),b=manifest.find(x=>x.key===c.key&&x.side==='reverse');
 if(!a||!b||c.sha256!==a.sha256||c.reverse?.sha256!==b.sha256||createHash('sha256').update(c.reverse.readableText).digest('hex')!==c.reverse.transcriptSha256)throw Error('Catalogue/transcript pairing mismatch');
}
const tree=JSON.parse(readFileSync(resolve(build,'council/time-tree.json')));
if(tree.editions.some(e=>e.number===242))throw Error('Preview expects unactivated public tree');
tree.editions.push({number:242,state:'PRIVATE REVIEW',canopy:'/council/circle-242/index.html'});
const mime={'.js':'text/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(!['127.0.0.1','localhost','[::1]'].includes(new URL('http://'+req.headers.host).hostname)||!['GET','HEAD'].includes(req.method)||/%|\\|(?:^|\/)\./.test(url.pathname))throw Error('Unavailable');
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(url.pathname==='/council/time-tree.json'||url.pathname==='/council/circle-242/catalogue.json') {res.setHeader('Content-Type','application/json');return res.end(req.method==='HEAD'?'':JSON.stringify(url.pathname.endsWith('time-tree.json')?tree:catalogue));}
  let path=files.get(url.pathname)||resolve(build,'.'+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname));
  if(!files.has(url.pathname)&&(!path.startsWith(build+sep)||!statSync(path,{throwIfNoEntry:false})?.isFile())){
   if(/\.[a-z0-9]+$/.test(url.pathname))throw Error('Unavailable');path=resolve(build,'index.html');
  }
  path=realpathSync(path);if(!path.startsWith(build+sep)&&!files.has(url.pathname))throw Error('Unavailable');
  const ext=path.slice(path.lastIndexOf('.'));res.setHeader('Content-Type',mime[ext]||'application/octet-stream');
  if(req.method==='HEAD')return res.end();createReadStream(path).on('error',()=>res.destroy()).pipe(res);
 }catch{res.statusCode=404;res.end('Unavailable');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Private local Circle 242 review: http://127.0.0.1:${port}/council/circle-242/index.html (Ctrl-C closes; no public listener)`));
