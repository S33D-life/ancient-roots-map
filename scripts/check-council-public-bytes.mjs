import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.argv[2]||'dist';let count=0;
const blockedHash='b3c84d89ac2bc73f84d037c7a9b48e0bb0d4c7842b3f5553ce9df1598f62db7a';
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()){walk(p);continue;}const b=readFileSync(p);count++;
 if(createHash('sha256').update(b).digest('hex')===blockedHash)throw Error('Excluded family media found in '+relative(root,p));
 if(/\.(?:js|html|json|txt|svg|css)$/.test(p)&&/chosen by Leo|Ed and Leo|leos-cherry-time-tree/i.test(b.toString()))throw Error('Private attribution/reference found in '+relative(root,p));
}}
walk(root);console.log(`Council public-byte privacy gate passed: ${count} files`);
