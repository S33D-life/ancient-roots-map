import {createRoot} from 'react-dom/client';
import {useEffect,useRef,useState} from 'react';
import {BrowserRouter,useSearchParams} from 'react-router-dom';
import Circle238Page from '@/pages/council/Circle238Page';
import Composer from './Composer';
import {companions,selectedCompanion,deckUrl,type Companion} from './model';
import './preview.css';
export function Preview(){
 const [query]=useSearchParams(),initial=selectedCompanion(query.get('companion'));
 const [view,setView]=useState<'2d'|'deck'>(query.get('view')==='deck'?'deck':'2d'),[active,setActive]=useState<Companion|null>(null);
 const frame=useRef<HTMLIFrameElement>(null),cleanup=useRef<()=>void>(()=>{}),returnFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>()=>cleanup.current(),[]);
 function open(c:Companion,el?:HTMLElement){returnFocus.current=el??document.activeElement as HTMLElement;setActive(c);}
 function close(){setActive(null);requestAnimationFrame(()=>returnFocus.current?.isConnected&&returnFocus.current.focus());}
 function connectDeck(){
  cleanup.current();const doc=frame.current?.contentDocument,win=frame.current?.contentWindow;if(!doc||!win)return;
  const decorate=()=>{const node=companions.find(c=>`#${c.id}`===win.location.hash),panel=doc.querySelector('#panel .pbody'),old=doc.querySelector('[data-fixture-offer]');
   if(!node||!panel||(win as unknown as {TETOL?:{council:{active:number}}}).TETOL?.council.active!==238){old?.remove();return;}if(old&&old.parentElement===panel)return;old?.remove();
   const button=doc.createElement('button');button.className='act';button.dataset.fixtureOffer='true';button.textContent='Leave an offering · demo';button.style.cssText='min-height:48px;margin:12px 0;display:block;width:100%';button.onclick=()=>open(node,button);panel.append(button);
  };
  const observer=new MutationObserver(decorate);observer.observe(doc,{childList:true,subtree:true});win.addEventListener('hashchange',decorate);decorate();cleanup.current=()=>{observer.disconnect();win.removeEventListener('hashchange',decorate);};
 }
 return <><header className="fixture-header"><p>PRIVATE INTERACTION REVIEW · V1</p><h1>The Council of Life · yOur Blooming Week</h1><p>Examples only. Nothing is uploaded, saved or shared. Design fidelity to Claude’s interaction artifact remains unverified.</p><nav aria-label="Preview surface"><button aria-pressed={view==='2d'} onClick={()=>setView('2d')}>2D Council</button><button aria-pressed={view==='deck'} onClick={()=>setView('deck')}>Original 3D Deck</button></nav></header>
 {view==='2d'?<div onClickCapture={e=>{const link=(e.target as Element).closest('a');if(link?.getAttribute('href')?.startsWith('/tetol/')){e.preventDefault();setView('deck');}}}><Circle238Page previewTitle="The Council of Life · yOur Blooming Week · StarPod Circle 238" onOffer={key=>{const c=selectedCompanion(key);if(c)open(c);}}/></div>:<iframe ref={frame} title="Original TETOL Council Deck — isolated review" src={deckUrl(initial)} onLoad={connectDeck} sandbox="allow-scripts allow-same-origin" className="deck-preview"/>}
 <footer className="fixture-footer">Fixture build {import.meta.env.VITE_FIXTURE_SHA??"unverified"} · based on main e2f2830f. Existing Tree and images are unchanged. Other editions have no fixture offering action.</footer>
 {active&&<Composer key={active.key} companion={active} onClose={close}/>}
 </>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Preview/></BrowserRouter>);
