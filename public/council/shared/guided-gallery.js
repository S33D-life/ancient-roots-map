import { destination,selection,surfaceLink,navigationControls,installNavigationStyle,focusNavigation } from './companion-navigation.js';
import { loadFolioEdition,registerFolioFrame } from './folio-edition.js';
export async function renderCanopy(number) {
  const edition=await loadFolioEdition(number),items=edition.companions,createFrame=registerFolioFrame(edition);
  installNavigationStyle();
  document.querySelector('h1').tabIndex=-1;
  const list=document.querySelector('#companions'),question=document.querySelector('#question'),notice=document.querySelector('#notice');
  question.textContent=edition.question||'';
  if(notice)notice.textContent=edition.thread||'';
  if('canopyShell' in document.body.dataset){document.querySelector('h1').textContent=edition.title||`The Council of Life · Circle ${number}`;document.title=`Circle ${number} · Council of Life`;document.querySelector('#fire').textContent=edition.fire?'See the edition’s confirmed Fire information.':'Open all week. No Fire is scheduled.';}
  const controls=document.createElement('div'),surface=document.createElement('a');surface.className='canopy-surface-link';surface.textContent='Continue in original 3D TETOL';list.before(controls,surface);
  const cards=items.map(c=>{const card=document.createElement('li'),heading=document.createElement('h2'),detail=document.createElement('p'),frame=createFrame();heading.textContent=c.label;heading.tabIndex=-1;heading.dataset.canopyHeading='';detail.textContent=c.author?`${c.kind} · ${c.author}`:c.kind;frame.setAttribute('label',c.label);frame.setAttribute('companion-key',c.key);frame.setAttribute('front',c.artwork);frame.setAttribute('front-alt',c.alt);card.append(heading,detail,frame);list.append(card);return {card,heading,frame,c};});
  function apply(action){const current=selection(new URL(location.href),items);controls.replaceChildren(navigationControls(number,items,current.item,choose));surface.href=surfaceLink(location.href,number,items,false).href;
    for(const {card,frame,c} of cards){card.hidden=!!current.item&&c!==current.item;frame.setAttribute('side',current.item===c?current.side:'front');}
    // Native list ordinals must reflect the original roster position in guided mode.
    list.start=current.item?items.indexOf(current.item)+1:1;
    if(action)focusNavigation(controls,action,cards.find(c=>c.c===current.item)?.heading||document.querySelector('h1'));
  }
  function choose(item,action){history.pushState(null,'',destination(location.href,number,item));apply(action);}
  document.addEventListener('council-frame-turn',event=>{const c=items.find(c=>c.key===event.detail.key);if(!c||!list.contains(event.target))return;history.pushState(null,'',destination(location.href,number,c,event.detail.side));apply();});
  addEventListener('popstate',()=>apply('history'));apply();
}
export function showCanopyError(error){console.error(error);document.querySelector('#notice').textContent='This Council is unavailable. Historical editions remain in the Time Tree.';}
