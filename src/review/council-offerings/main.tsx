import {createRoot} from 'react-dom/client';
import {useEffect,useRef,useState} from 'react';
import {BrowserRouter,useSearchParams} from 'react-router-dom';
import Circle238Page from '@/pages/council/Circle238Page';
import Composer from './Composer';
import Invitation from './Invitation';
import {invitation} from './model';
import {companions,selectedCompanion,deckUrl,type Companion} from './model';
import {companionLore} from './lore';
import './fonts.css';
import './preview.css';
export function Preview(){
 const [query,setQuery]=useSearchParams(),initial=selectedCompanion(query.get('companion'));
 const qa=query.get('qa')==='1';
 const [view,setView]=useState<'2d'|'deck'>(query.get('view')==='deck'?'deck':'2d'),[active,setActive]=useState<Companion|null>(null);
 const frame=useRef<HTMLIFrameElement>(null),cleanup=useRef<()=>void>(()=>{}),returnFocus=useRef<HTMLElement|null>(null),pendingNextFocus=useRef(false);
 useEffect(()=>()=>cleanup.current(),[]);
 useEffect(()=>{if(pendingNextFocus.current&&!active&&view==='2d'){pendingNextFocus.current=false;document.querySelector<HTMLElement>('.fixture-invitation button')?.focus();}},[query,active,view]);
 function open(c:Companion,el?:HTMLElement){returnFocus.current=el??document.activeElement as HTMLElement;setActive(c);}
 function close(){setActive(null);requestAnimationFrame(()=>returnFocus.current?.isConnected&&returnFocus.current.focus());}
 function next(){
  if(!active)return;const c=companions[(companions.findIndex(x=>x.key===active.key)+1)%companions.length];setActive(null);
  if(view==='deck'){const win=frame.current?.contentWindow as (Window&{TETOL_NAV?:{do:(action:string,id:string)=>void}})|null;win?.TETOL_NAV?.do('goTo',c.id);requestAnimationFrame(()=>frame.current?.contentDocument?.querySelector<HTMLElement>('[data-fixture-offer]')?.focus());}
  else{pendingNextFocus.current=true;const nextQuery=new URLSearchParams(query);nextQuery.set('companion',c.key);nextQuery.delete('returned');setQuery(nextQuery);}
 }
 function connectDeck(){
  cleanup.current();const doc=frame.current?.contentDocument,win=frame.current?.contentWindow;if(!doc||!win)return;
  const style=doc.createElement('style');style.textContent=`.fixture-invitation{margin:16px 0;padding:14px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,hsl(42 60% 40% / .1),transparent)}.fixture-invitation .q{font:italic 21px/1.3 Georgia,serif;margin:6px 0 12px}.fixture-invitation .hint{font:12px/1.4 system-ui;color:var(--ink3);margin:10px 0 0}.fixture-invitation .new-mark{font:10px system-ui;text-transform:uppercase;color:var(--gold)}.fixture-invitation .act{width:100%;min-height:48px}.fixture-invitation button:focus-visible{outline:3px solid var(--gold);outline-offset:3px}`;doc.head.append(style);
  const decorate=()=>{const node=companions.find(c=>`#${c.id}`===win.location.hash),panel=doc.querySelector('#panel .pbody'),old=doc.querySelector('[data-fixture-invitation]');
   if(!node||!panel||(win as unknown as {TETOL?:{council:{active:number}}}).TETOL?.council.active!==238){old?.remove();return;}if(old&&old.parentElement===panel&&old.getAttribute('data-companion')===node.key)return;old?.remove();
   const block=doc.createElement('section');block.className='fixture-invitation';block.dataset.fixtureInvitation='true';block.dataset.companion=node.key;block.setAttribute('aria-label','Offering invitation');
   const mark=doc.createElement('span');mark.className='new-mark';mark.textContent='New · offerings';const question=doc.createElement('p');question.className='q';question.textContent=invitation.question;const hint=doc.createElement('p');hint.className='hint';hint.textContent=invitation.hint;
   const button=doc.createElement('button');button.type='button';button.className='act';button.dataset.fixtureOffer='true';button.textContent='Offer something';button.onclick=()=>open(node,button);block.append(mark,question,button,hint);
   // #127/#131 already supply lore. Baseline main gets the same approved copy in this harness only.
   let lore=panel.querySelector('[data-fixture-lore]');
   const approved=companionLore[node.key as keyof typeof companionLore];
   const hasApprovedLore=[...panel.querySelectorAll('p')].some(p=>p.textContent===approved.text);
   if(!hasApprovedLore){lore=doc.createElement('div');lore.setAttribute('data-fixture-lore','');for(const text of [approved.name,approved.text]){const p=doc.createElement('p');p.textContent=text;lore.append(p);}const image=panel.querySelector('[data-circle-artwork]');let after:Element|null=image;while(after?.nextElementSibling?.tagName==='P')after=after.nextElementSibling;(after??panel.firstElementChild)?.after(lore);}
   const loreText=[...panel.querySelectorAll('p')].find(p=>p.textContent===approved.text);
   if(loreText){(lore??loreText).after(block);}else{const heading=[...panel.querySelectorAll('h4')].find(h=>/Other Circles/i.test(h.textContent??''));panel.insertBefore(block,heading?.closest('.sec')??panel.querySelector('.actions'));}
   // Use the existing sheet control once; no renderer, geometry or gesture handlers are replaced.
   if(doc.body.classList.contains('phone')&&(doc.body.dataset.sheet??'peek')==='peek')doc.querySelector<HTMLButtonElement>('#grab')?.click();
  };
  const observer=new MutationObserver(decorate);observer.observe(doc,{childList:true,subtree:true});win.addEventListener('hashchange',decorate);decorate();cleanup.current=()=>{observer.disconnect();win.removeEventListener('hashchange',decorate);style.remove();};
 }
 return <div className={`fixture-shell host-${view}`}>{qa?<header className="fixture-header"><p>PRIVATE INTERACTION REVIEW · V1</p><h1>The Council of Life · yOur Blooming Week</h1><p>DEMO · nothing is saved. No uploads or real submissions.</p><nav aria-label="Preview surface"><button aria-pressed={view==='2d'} onClick={()=>setView('2d')}>2D Council</button><button aria-pressed={view==='deck'} onClick={()=>setView('deck')}>Original 3D Deck</button></nav></header>:<p className="fixture-demo-band">DEMO · nothing is saved</p>}
 {view==='2d'?<div onClickCapture={e=>{const link=(e.target as Element).closest('a');if(link?.getAttribute('href')?.startsWith('/tetol/')){e.preventDefault();setView('deck');}}}><Circle238Page previewTitle="The Council of Life · yOur Blooming Week · StarPod Circle 238" renderAfterScene={key=>{const c=selectedCompanion(key)!;const lore=companionLore[key as keyof typeof companionLore];return <><p>{lore.name}</p><p>{lore.text}</p><Invitation onOffer={button=>open(c,button)}/></>;}}/></div>:<iframe ref={frame} title="Original TETOL Council Deck — isolated review" src={deckUrl(initial)} onLoad={connectDeck} sandbox="allow-scripts allow-same-origin" className="deck-preview"/>}
 {qa&&<footer className="fixture-footer">Fixture build {import.meta.env.VITE_FIXTURE_SHA??'unverified'} · review only. Original artwork and historical editions are unchanged.{qa&&<p>Reviewer QA mode · synthetic outcome controls enabled.</p>}</footer>}
 {active&&<Composer key={active.key} companion={active} host={view} qa={qa} onClose={close} onNext={next}/>}
 </div>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><Preview/></BrowserRouter>);
