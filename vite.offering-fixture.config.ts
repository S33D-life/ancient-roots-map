import {defineConfig,type Plugin,type ViteDevServer} from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
const originalRoot=path.resolve('public');
const csp="default-src 'self'; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self'; worker-src 'self' blob:; object-src 'none'; form-action 'none'; base-uri 'self'";
const ephemeral=`(()=>{for(const key of ['localStorage','sessionStorage']){const m=new Map();Object.defineProperty(window,key,{configurable:true,value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(String(k),String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]??null,get length(){return m.size}}});}const f=window.fetch.bind(window);window.fetch=(input,options)=>{const u=new URL(input instanceof Request?input.url:String(input),location.href);if(u.origin!==location.origin||!['GET','HEAD'].includes((options?.method??(input instanceof Request?input.method:'GET')).toUpperCase())||!['/tetol/','/council/'].some(p=>u.pathname.startsWith(p)))return Promise.reject(new Error('Fixture review: network writes and external requests disabled'));return f(input,options);};})();`;
function reviewOnlyAssets():Plugin {
 const install=(server:Pick<ViteDevServer,'middlewares'>)=>{server.middlewares.use(async(req,res,next)=>{
  res.setHeader('Content-Security-Policy',csp);res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
  if(!['GET','HEAD'].includes(req.method??'GET')){res.statusCode=405;res.end('Read-only fixture server');return;}
  const pathname=new URL(req.url??'/', 'http://localhost').pathname;
  if(/\/rest\/|\/auth\/|\/functions\/|\/api\//.test(pathname)){res.statusCode=403;res.end('No backend in this review');return;}
  if(!['/tetol/','/council/'].some(prefix=>pathname.startsWith(prefix))){next();return;}
  const file=path.resolve(originalRoot,'.'+decodeURIComponent(pathname));
  if(!file.startsWith(originalRoot+path.sep)){res.statusCode=403;res.end();return;}
  try{if(!(await stat(file)).isFile())throw Error('not a file');let data=await readFile(file);const ext=path.extname(file);const mime:Record<string,string>={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};res.setHeader('Content-Type',mime[ext]??'application/octet-stream');if(ext==='.html')data=Buffer.from(data.toString().replace('<head>','<head><script>'+ephemeral+'</script>'));res.end(req.method==='HEAD'?undefined:data);}catch{res.statusCode=404;res.end('Outside fixture preview. Use the review entry or original 3D Time Tree.');}
 });};
 return {name:'local-offering-review-assets',configureServer:install,configurePreviewServer:install};
}
export default defineConfig({define:{'import.meta.env.VITE_FIXTURE_SHA':JSON.stringify(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim())},plugins:[react(),reviewOnlyAssets()],publicDir:false,envPrefix:'OFFERING_FIXTURE_UNUSED_',resolve:{alias:{'@':path.resolve('src')}},server:{host:'127.0.0.1',port:4242,strictPort:true,hmr:false},preview:{host:'127.0.0.1',port:4242,strictPort:true},build:{outDir:'dist-offering-fixture',rollupOptions:{input:'review/council-offerings.html'}}});
