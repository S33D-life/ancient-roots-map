/** GET/HEAD-only, loopback-only review of withheld Circle239 assets. Never copies them to public/. */
import http from 'node:http';
import {readFileSync,statSync,existsSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
const intake=resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Usage: node scripts/review-circle239-living-frames.mjs /absolute/intake/unpacked [port]');
const root=resolve('dist'), port=Number(process.argv[3]||4270);
const fronts=JSON.parse(readFileSync(join(root,'council/circle-239/companions.json')));
const source=JSON.parse(readFileSync(join(intake,'MANIFEST.json')));
if(source.circle!==239||source.items.length!==10)throw Error('Wrong private intake');
const candidate=source.receiptId==='typeset-candidates-v2';
const receipt=JSON.parse(readFileSync(candidate?'docs/releases/circle239-living-frames/candidate-receipt.json':'docs/releases/circle239-living-frames/receipt.json'));
const assets=new Map();
const items=fronts.companions.map((c,i)=>{
 const item=source.items[i],expected=receipt.items[i];
 if(item.filename!==expected.filename||item.sha256!==expected.sha256)throw Error('Intake does not match reviewed source receipt');
 const file=join(intake,item.filename),bytes=readFileSync(file);
 if(item.number!==c.order || createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Private intake hash/order mismatch: '+c.key);
 const artwork='/council/circle-239/reverses/'+c.key+'.png';assets.set(artwork,bytes);
 const textFile=file.replace(/\.png$/,'.txt');
 if(candidate&&(!existsSync(textFile)||createHash('sha256').update(readFileSync(textFile)).digest('hex')!==expected.transcriptSha256))throw Error('Candidate transcript hash mismatch: '+c.key);
 return {...c,status:'LOCAL_PRIVATE_REVIEW',artwork,sha256:item.sha256,width:item.dimensions_px[0],height:item.dimensions_px[1],readableText:(candidate?'PRIVATE CANDIDATE — human artwork/rights approval pending.\n':'PRIVATE DRAFT — uncorrected artwork and OCR; not fact-cleared.\n')+(existsSync(textFile)?readFileSync(textFile,'utf8'):'Transcript pending manual review.'),factReviewed:false,rightsApproved:false,explore:null};
});
const catalog=JSON.stringify({circle:239,publicationApproved:false,status:'LOCAL_PRIVATE_REVIEW',items});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 res.setHeader('Content-Security-Policy',"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; frame-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let path;try{path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end();return;}
 let body,type;
 if(path==='/council/circle-239/reverse-folios.json'){body=catalog;type='application/json';}
 else if(assets.has(path)){body=assets.get(path);type='image/png';}
 else {const file=resolve(root,'.'+path);if(file!==root&&!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
  const target=existsSync(file)&&statSync(file).isFile()?file:!extname(path)?join(root,'index.html'):null;
  if(!target){res.writeHead(404);res.end();return;}body=readFileSync(target);type=types[extname(target)]||'application/octet-stream';}
 res.setHeader('Content-Type',type);res.end(req.method==='HEAD'?undefined:body);
});
server.listen(port,'127.0.0.1',()=>console.log(`PRIVATE, UNAPPROVED artwork review only: http://127.0.0.1:${port}/council/239?review239=1\nOriginal Tree: http://127.0.0.1:${port}/tetol/circle-235/pre-fire/tetol.html?circle=239&review239=1#croom\nCtrl-C stops only this loopback review. No public/LAN/Tailscale mapping.`));
